import type { NextRequest } from "next/server";
import { ApiError, successResponse } from "@/lib/api";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/cookies";
import { createAdminWithPassword } from "@/lib/auth/credentials";
import { getUserFromAccessToken, requireAdmin } from "@/lib/auth/guards";
import { authFailure, readAuthBody } from "@/lib/auth/http";
import { assertAuthOrigin } from "@/lib/auth/origin";
import { authFieldErrors, createAdminSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  try {
    if (request.headers.has("authorization")) {
      await requireAdmin(request);
    } else {
      assertAuthOrigin(request, true);
      const admin = await getUserFromAccessToken(request.cookies.get(ACCESS_COOKIE_NAME)?.value);
      if (admin.role !== "admin") throw new ApiError(403, "FORBIDDEN", "Admin access is required.");
    }
    const parsed = createAdminSchema.safeParse(await readAuthBody(request));
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Please check your details.", authFieldErrors(parsed.error));
    const { name, email, password } = parsed.data;
    const user = await createAdminWithPassword(name, email, password);
    return successResponse({ user }, { status: 201, message: "Admin account created", headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authFailure(error);
  }
}
