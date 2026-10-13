import "server-only";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { AUTH } from "../config";
import { db, transaction } from "../db";
import { ApiError, type ErrorCode } from "../errors";
import { hashPassword, verifyPassword } from "./password";
import { limitCredentials } from "./rate-limit";
import { hashToken, newRefreshToken, signAccessToken } from "./tokens";
import { publicUser, type UserRow } from "./types";
import type { Credentials } from "./validation";

async function tokensFor(user: UserRow, sessionId: string, expiresAt: Date, refreshToken: string) {
  return {
    user: publicUser(user),
    ...await signAccessToken(user.id, sessionId, expiresAt),
    refreshToken,
    tokenType: "Bearer" as const,
    refreshExpiresAt: expiresAt.toISOString(),
  };
}

async function startSession(client: PoolClient, user: UserRow) {
  const sessionId = randomUUID();
  const refreshToken = newRefreshToken();
  const { rows } = await client.query<{ expires_at: Date }>(`
    INSERT INTO app_auth.sessions (id, user_id, expires_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP + $3 * INTERVAL '1 second') RETURNING expires_at
  `, [sessionId, user.id, AUTH.sessionSeconds]);
  await client.query("INSERT INTO app_auth.refresh_tokens (token_hash, session_id) VALUES ($1, $2)",
    [hashToken(refreshToken), sessionId]);
  return tokensFor(user, sessionId, rows[0].expires_at, refreshToken);
}

export async function signUp(credentials: Credentials) {
  await limitCredentials("signup", credentials.email);
  const passwordHash = await hashPassword(credentials.password);
  return transaction(async (client) => {
    // The unique constraint handles concurrent signups without a check/insert race.
    const { rows } = await client.query<UserRow>(`
      INSERT INTO app_auth.users (id, email, password_hash)
      VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role, created_at
    `, [randomUUID(), credentials.email, passwordHash]);
    if (!rows[0]) throw new ApiError("EMAIL_IN_USE");
    return startSession(client, rows[0]);
  });
}

export async function signIn(credentials: Credentials) {
  await limitCredentials("signin", credentials.email);
  const { rows } = await db().query<UserRow & { password_hash: string }>(`
    SELECT id, email, role, created_at, password_hash FROM app_auth.users WHERE email = $1
  `, [credentials.email]);
  const user = rows[0];
  const valid = await verifyPassword(credentials.password, user?.password_hash);
  if (!user || !valid) throw new ApiError("INVALID_CREDENTIALS");
  return transaction((client) => startSession(client, user));
}

type RefreshRow = UserRow & {
  session_id: string;
  expires_at: Date;
  revoked_at: Date | null;
  used_at: Date | null;
  expired: boolean;
};

export async function refreshTokens(refreshToken: string) {
  const result = await transaction(async (client): Promise<
    { data: Awaited<ReturnType<typeof tokensFor>> } | { error: ErrorCode }
  > => {
    const { rows } = await client.query<RefreshRow>(`
      SELECT u.id, u.email, u.role, u.created_at, s.id AS session_id,
        s.expires_at, s.revoked_at, t.used_at,
        s.expires_at <= CURRENT_TIMESTAMP + INTERVAL '1 second' AS expired
      FROM app_auth.refresh_tokens t
      JOIN app_auth.sessions s ON s.id = t.session_id
      JOIN app_auth.users u ON u.id = s.user_id
      WHERE t.token_hash = $1
      FOR UPDATE OF s, t
    `, [hashToken(refreshToken)]);
    const row = rows[0];
    if (!row || row.revoked_at || row.expired) return { error: "INVALID_REFRESH_TOKEN" };
    if (row.used_at) {
      await client.query("UPDATE app_auth.sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1", [row.session_id]);
      // Return the error so revocation COMMITS; throwing here would roll it back.
      return { error: "REFRESH_TOKEN_REUSED" };
    }
    await client.query("UPDATE app_auth.refresh_tokens SET used_at = CURRENT_TIMESTAMP WHERE token_hash = $1", [hashToken(refreshToken)]);
    const nextToken = newRefreshToken();
    await client.query("INSERT INTO app_auth.refresh_tokens (token_hash, session_id) VALUES ($1, $2)", [hashToken(nextToken), row.session_id]);
    return { data: await tokensFor(row, row.session_id, row.expires_at, nextToken) };
  });
  if ("error" in result) throw new ApiError(result.error);
  return result.data;
}

export async function logOut(sessionId: string) {
  await db().query("UPDATE app_auth.sessions SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE id = $1", [sessionId]);
}
