import "server-only";
import { ApiError } from "@/lib/api";
import { authFailure } from "@/lib/auth/http";
export { authorizeAdminRequest as authorizeCategoryRequest } from "@/lib/auth/admin-request";

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
