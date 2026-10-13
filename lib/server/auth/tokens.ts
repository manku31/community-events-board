import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { errors, jwtVerify, SignJWT } from "jose";
import { AUTH, jwtKey } from "../config";
import { ApiError } from "../errors";

export function newRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function signAccessToken(userId: string, sessionId: string, expiresAt: Date) {
  const now = Math.floor(Date.now() / 1000);
  const exp = Math.min(now + AUTH.accessTokenSeconds, Math.floor(expiresAt.getTime() / 1000));
  if (exp <= now) throw new ApiError("UNAUTHORIZED");
  const accessToken = await new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256", typ: "at+jwt" })
    .setSubject(userId).setJti(randomUUID())
    .setIssuer(AUTH.issuer).setAudience(AUTH.audience)
    .setIssuedAt(now).setExpirationTime(exp).sign(jwtKey());
  return { accessToken, expiresIn: exp - now };
}

export async function verifyAccessToken(token: string) {
  const key = jwtKey();
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"], issuer: AUTH.issuer, audience: AUTH.audience,
      typ: "at+jwt", requiredClaims: ["sub", "sid", "jti", "iat", "exp"],
      maxTokenAge: AUTH.accessTokenSeconds,
    });
    const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (!payload.sub || !uuid.test(payload.sub) || typeof payload.sid !== "string"
      || !uuid.test(payload.sid)) throw new ApiError("UNAUTHORIZED");
    return { userId: payload.sub, sessionId: payload.sid };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof errors.JOSEError) throw new ApiError("UNAUTHORIZED");
    throw error;
  }
}
