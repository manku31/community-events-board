import "server-only";
import { randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { ACCESS_TOKEN_SECONDS, REFRESH_TOKEN_SECONDS } from "./config";
import { createAccessToken } from "./jwt";
import { generateRefreshToken, hashRefreshToken, isRefreshToken } from "./refresh-token";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshExpiresAt: Date;
};

function invalidRefreshToken() {
  return new ApiError(401, "INVALID_REFRESH_TOKEN", "Your session has expired. Please sign in again.");
}

async function lockFamily(tx: Prisma.TransactionClient, familyId: string) {
  // Serialize rotations and revocations for the whole session, not just one token.
  // Transaction locks also work with Neon's transaction pooler.
  await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${familyId}, 0))`;
}

// Call only after checking the user's password in a future login/signup API.
export async function issueAuthTokens(userId: number): Promise<AuthTokens> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!user) throw new ApiError(401, "UNAUTHORIZED", "Please sign in again.");
  const familyId = randomUUID();
  const refreshToken = generateRefreshToken();
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_SECONDS * 1000);
  const accessToken = await createAccessToken(user, familyId);
  await prisma.refreshToken.create({
    data: { userId: user.id, familyId, tokenHash: hashRefreshToken(refreshToken), expiresAt: refreshExpiresAt },
  });
  return { accessToken, refreshToken, tokenType: "Bearer", expiresIn: ACCESS_TOKEN_SECONDS, refreshExpiresAt };
}

export async function rotateRefreshToken(token: string): Promise<AuthTokens> {
  if (!isRefreshToken(token)) throw invalidRefreshToken();
  const tokenHash = hashRefreshToken(token);
  const result = await prisma.$transaction(async (tx) => {
    const found = await tx.refreshToken.findUnique({ where: { tokenHash }, select: { familyId: true } });
    if (!found) return null;
    await lockFamily(tx, found.familyId);
    const current = await tx.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, role: true } } },
    });
    const now = new Date();
    if (!current) return null;
    if (current.usedAt || current.revokedAt || current.expiresAt <= now) {
      await tx.refreshToken.updateMany({ where: { familyId: current.familyId, revokedAt: null }, data: { revokedAt: now } });
      return null;
    }

    // A conditional update ensures only one concurrent request consumes this token.
    const consumed = await tx.refreshToken.updateMany({
      where: { id: current.id, usedAt: null, revokedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) {
      await tx.refreshToken.updateMany({ where: { familyId: current.familyId, revokedAt: null }, data: { revokedAt: now } });
      return null;
    }

    const refreshToken = generateRefreshToken();
    const accessToken = await createAccessToken(current.user, current.familyId);
    await tx.refreshToken.create({
      data: { userId: current.userId, familyId: current.familyId, tokenHash: hashRefreshToken(refreshToken), expiresAt: current.expiresAt },
    });
    return { accessToken, refreshToken, tokenType: "Bearer" as const, expiresIn: ACCESS_TOKEN_SECONDS, refreshExpiresAt: current.expiresAt };
  }, { timeout: 10_000 });

  // Throw after commit so replay-triggered revocations aren't rolled back.
  if (!result) throw invalidRefreshToken();
  return result;
}

export async function revokeRefreshSession(token: string): Promise<void> {
  if (!isRefreshToken(token)) return;
  await prisma.$transaction(async (tx) => {
    const current = await tx.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(token) }, select: { familyId: true } });
    if (!current) return;
    await lockFamily(tx, current.familyId);
    await tx.refreshToken.updateMany({ where: { familyId: current.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
  }, { timeout: 10_000 });
}
