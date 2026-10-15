import "server-only";
import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/cookies";
import { getUserFromAccessToken, requireAdmin } from "@/lib/auth/guards";
import { assertAuthOrigin } from "@/lib/auth/origin";
import { authFailure } from "@/lib/auth/http";

export async function authorizeCategoryRequest(request: NextRequest) {
  const bearer = request.headers.has("authorization");
  assertAuthOrigin(request, !bearer && request.method !== "GET");
  if (bearer) return requireAdmin(request);
  const user = await getUserFromAccessToken(request.cookies.get(ACCESS_COOKIE_NAME)?.value);
  if (user.role !== "admin") throw new ApiError(403, "FORBIDDEN", "Admin access is required.");
  return user;
}

export function categoryFailure(error: unknown, operation: "list" | "create" | "update") {
  if (!(error instanceof ApiError)) {
    const rawCode = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    console.error("Category request failed", {
      operation,
      type: error instanceof Error ? error.name : "UnknownError",
      ...(typeof rawCode === "string" && /^P\d{4}$/.test(rawCode) ? { code: rawCode } : {}),
    });
  }
  return authFailure(error);
}
