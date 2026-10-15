import "server-only";
import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api";
import { ACCESS_COOKIE_NAME } from "./cookies";
import { getUserFromAccessToken, requireAdmin } from "./guards";
import { assertAuthOrigin } from "./origin";

export async function authorizeAdminRequest(request: NextRequest) {
  const bearer = request.headers.has("authorization");
  assertAuthOrigin(request, !bearer && !["GET", "HEAD"].includes(request.method));
  if (bearer) return requireAdmin(request);
  const user = await getUserFromAccessToken(request.cookies.get(ACCESS_COOKIE_NAME)?.value);
  if (user.role !== "admin") throw new ApiError(403, "FORBIDDEN", "Admin access is required.");
  return user;
}
