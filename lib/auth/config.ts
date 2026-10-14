import "server-only";

export const ACCESS_TOKEN_SECONDS = 15 * 60;
export const REFRESH_TOKEN_SECONDS = 30 * 24 * 60 * 60;
export const TOKEN_ISSUER = "community-events-board";
export const TOKEN_AUDIENCE = "community-events-board-api";

export function getJwtKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT_SECRET must contain at least 32 bytes.");
  }
  return new TextEncoder().encode(secret);
}
