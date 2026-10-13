import "server-only";
import { db } from "../db";
import { ApiError } from "../errors";
import { api } from "../http";
import { verifyAccessToken } from "./tokens";
import { publicUser, type AuthContext, type Role, type UserRow } from "./types";

// Call at the data boundary. A signed JWT alone does not establish a live session.
export async function requireAuth(request: Request): Promise<AuthContext> {
  const header = request.headers.get("authorization");
  if (!header || header.length > 2048) throw new ApiError("UNAUTHORIZED");
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(header);
  if (!match) throw new ApiError("UNAUTHORIZED");
  const claims = await verifyAccessToken(match[1]);
  const { rows } = await db().query<UserRow>(`
    SELECT u.id, u.email, u.role, u.created_at
    FROM app_auth.sessions s JOIN app_auth.users u ON u.id = s.user_id
    WHERE s.id = $1 AND s.user_id = $2 AND s.revoked_at IS NULL AND s.expires_at > CURRENT_TIMESTAMP
  `, [claims.sessionId, claims.userId]);
  if (!rows[0]) throw new ApiError("UNAUTHORIZED");
  return { user: publicUser(rows[0]), sessionId: claims.sessionId };
}

export function requireRole(auth: AuthContext, role: Role): void {
  if (auth.user.role !== role) throw new ApiError("FORBIDDEN");
}

// Reusable server middleware for protected JSON routes, including future admin APIs.
export function withAuth(
  handler: (request: Request, auth: AuthContext) => Promise<Response>,
  role?: Role,
) {
  return api(async (request) => {
    const auth = await requireAuth(request);
    if (role) requireRole(auth, role);
    return handler(request, auth);
  });
}
