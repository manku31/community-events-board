import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiError, successResponse } from "@/lib/api";
import { clearAccessCookie, clearRefreshCookie, REFRESH_COOKIE_NAME, setAccessCookie, setRefreshCookie } from "@/lib/auth/cookies";
import { rotateRefreshToken } from "@/lib/auth/session";
import { assertAuthOrigin } from "@/lib/auth/origin";

function toNextResponse(response: Response) {
  const result = new NextResponse(response.body, { status: response.status, headers: response.headers });
  result.headers.set("Cache-Control", "no-store");
  return result;
}

export async function POST(request: NextRequest) {
  let cookieTransport = true;
  try {
    assertAuthOrigin(request);

    let refreshToken: string | undefined;
    const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (contentType === "application/json") {
      cookieTransport = false;
      let body: unknown;
      try { body = await request.json(); } catch {
        throw new ApiError(400, "INVALID_REQUEST", "Send a valid JSON request.");
      }
      if (!body || typeof body !== "object" || !("refreshToken" in body) || typeof body.refreshToken !== "string" || !body.refreshToken) {
        throw new ApiError(400, "INVALID_REQUEST", "A refresh token is required.");
      }
      refreshToken = body.refreshToken;
    } else {
      // HTTP servers can expose an empty POST body as a stream instead of null.
      if (request.body !== null && (await request.text()).length > 0) {
        throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Use application/json for the request body.");
      }
      refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
      if (refreshToken) assertAuthOrigin(request, true);
    }
    if (!refreshToken) throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Please sign in again.");

    const tokens = await rotateRefreshToken(refreshToken);
    const data = {
      accessToken: tokens.accessToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
      ...(!cookieTransport ? { refreshToken: tokens.refreshToken } : {}),
    };
    const response = toNextResponse(successResponse(data, { message: "Session refreshed" }));
    if (cookieTransport) {
      setAccessCookie(response, tokens.accessToken);
      setRefreshCookie(response, tokens.refreshToken, tokens.refreshExpiresAt);
    }
    return response;
  } catch (error) {
    const response = toNextResponse(handleApiError(error));
    if (cookieTransport && response.status === 401) {
      clearRefreshCookie(response);
      clearAccessCookie(response);
    }
    return response;
  }
}
