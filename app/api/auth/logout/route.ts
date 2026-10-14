import { NextRequest, NextResponse } from "next/server";
import { successResponse } from "@/lib/api";
import { clearAccessCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from "@/lib/auth/cookies";
import { authFailure } from "@/lib/auth/http";
import { assertAuthOrigin } from "@/lib/auth/origin";
import { revokeRefreshSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    assertAuthOrigin(request, true);
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
    if (refreshToken) await revokeRefreshSession(refreshToken);
    const json = successResponse(null, { message: "Logged out", headers: { "Cache-Control": "no-store" } });
    const response = new NextResponse(json.body, { status: json.status, headers: json.headers });
    clearRefreshCookie(response);
    clearAccessCookie(response);
    return response;
  } catch (error) { return authFailure(error); }
}
