import "server-only";

export const AUTH = {
  issuer: "community-events-board",
  audience: "community-events-board-api",
  accessTokenSeconds: 15 * 60,
  sessionSeconds: 7 * 24 * 60 * 60,
  maxBodyBytes: 4096,
  rateLimitWindowSeconds: 15 * 60,
  rateLimitAttempts: 10,
} as const;

export function databaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required.");
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL must be a PostgreSQL URL.");
  }
  // pg's sslmode=require can disable certificate verification. Enforce it
  // for remote databases while allowing a local development database.
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

export function jwtKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 64 || secret.startsWith("replace-")) {
    throw new Error("JWT_SECRET must contain at least 64 random characters.");
  }
  return new TextEncoder().encode(secret);
}
