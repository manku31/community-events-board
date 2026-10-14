import "server-only";
import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { verifyAccessToken } from "./jwt";

export async function requireUser(request: Request) {
  const match = request.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i);
  if (!match) throw new ApiError(401, "UNAUTHORIZED", "Please sign in.");
  const claims = await verifyAccessToken(match[1]);
  const user = await prisma.user.findUnique({ where: { id: claims.userId }, select: { id: true, email: true, role: true } });
  if (!user) throw new ApiError(401, "UNAUTHORIZED", "Please sign in again.");
  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (user.role !== "admin") throw new ApiError(403, "FORBIDDEN", "Admin access is required.");
  return user;
}
