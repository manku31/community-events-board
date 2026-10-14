import "server-only";
import { randomUUID } from "node:crypto";
import { errors, jwtVerify, SignJWT } from "jose";
import { ApiError } from "@/lib/api";
import { ACCESS_TOKEN_SECONDS, getJwtKey, TOKEN_AUDIENCE, TOKEN_ISSUER } from "./config";

export type AccessClaims = { userId: number; role: string; sessionId: string };

export async function createAccessToken(user: { id: number; role: string }, sessionId: string): Promise<string> {
  return new SignJWT({ role: user.role, sid: sessionId, tokenUse: "access" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(user.id))
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_SECONDS}s`)
    .sign(getJwtKey());
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const key = getJwtKey();
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      typ: "JWT",
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      requiredClaims: ["exp", "iat", "sub", "role", "sid", "tokenUse"],
      maxTokenAge: `${ACCESS_TOKEN_SECONDS}s`,
    });
    const userId = Number(payload.sub);
    if (!payload.sub || !/^[1-9]\d*$/.test(payload.sub) || !Number.isSafeInteger(userId) ||
        typeof payload.role !== "string" || !payload.role ||
        typeof payload.sid !== "string" || !payload.sid || payload.tokenUse !== "access") {
      throw new ApiError(401, "INVALID_ACCESS_TOKEN", "Please sign in again.");
    }
    return { userId, role: payload.role, sessionId: payload.sid };
  } catch (error) {
    if (error instanceof errors.JOSEError || error instanceof ApiError) {
      throw new ApiError(401, "INVALID_ACCESS_TOKEN", "Please sign in again.");
    }
    throw error;
  }
}
