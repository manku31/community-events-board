import "server-only";
import { createHash, randomBytes } from "node:crypto";

export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isRefreshToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
