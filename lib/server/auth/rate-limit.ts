import "server-only";
import { createHmac } from "node:crypto";
import { db } from "../db";
import { AUTH, jwtKey } from "../config";
import { ApiError } from "../errors";

export async function limitCredentials(scope: "signup" | "signin", email: string) {
  const key = createHmac("sha256", jwtKey()).update(`${scope}:${email}`).digest("hex");
  const { rows } = await db().query<{ attempts: number; retry_after: number }>(`
    INSERT INTO app_auth.rate_limits (key, attempts, resets_at)
    VALUES ($1, 1, CURRENT_TIMESTAMP + $2 * INTERVAL '1 second')
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN app_auth.rate_limits.resets_at <= CURRENT_TIMESTAMP
        THEN 1 ELSE LEAST(app_auth.rate_limits.attempts + 1, $3 + 1) END,
      resets_at = CASE WHEN app_auth.rate_limits.resets_at <= CURRENT_TIMESTAMP
        THEN CURRENT_TIMESTAMP + $2 * INTERVAL '1 second' ELSE app_auth.rate_limits.resets_at END
    RETURNING attempts, GREATEST(1, CEIL(EXTRACT(EPOCH FROM (resets_at - CURRENT_TIMESTAMP))))::int AS retry_after
  `, [key, AUTH.rateLimitWindowSeconds, AUTH.rateLimitAttempts]);
  if (rows[0].attempts > AUTH.rateLimitAttempts) {
    throw new ApiError("TOO_MANY_REQUESTS", undefined, rows[0].retry_after);
  }
}
