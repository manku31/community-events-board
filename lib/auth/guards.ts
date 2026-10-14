import "server-only";
import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { verifyAccessToken } from "./jwt";

async function verifiedUserId(token: string | undefined) {
  if (!token) throw new ApiError(401, "UNAUTHORIZED", "Please sign in.");
  const claims = await verifyAccessToken(token);
  return claims.userId;
}

export async function getUserFromAccessToken(token: string | undefined) {
  const userId = await verifiedUserId(token);
  const user = await prisma.user.findUnique({ where: { id: userId, status: true }, select: { id: true, name: true, email: true, role: true } });
  if (!user) throw new ApiError(401, "UNAUTHORIZED", "Please sign in again.");
  return user;
}

export async function getUserProfileFromAccessToken(token: string | undefined) {
  const userId = await verifiedUserId(token);
  const user = await prisma.user.findUnique({
    where: { id: userId, status: true },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, updatedAt: true },
  });
  if (!user) throw new ApiError(401, "UNAUTHORIZED", "Please sign in again.");
  return user;
}

export async function requireUser(request: Request) {
  const match = request.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i);
  return getUserFromAccessToken(match?.[1]);
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (user.role !== "admin") throw new ApiError(403, "FORBIDDEN", "Admin access is required.");
  return user;
}
