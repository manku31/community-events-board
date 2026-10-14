import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiError, successResponse } from "@/lib/api";
import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from "@/lib/auth/cookies";
import { rotateRefreshToken } from "@/lib/auth/session";

function toNextResponse(response: Response) {
  const result = new NextResponse(response.body, { status: response.status, headers: response.headers });
  result.headers.set("Cache-Control", "no-store");
  return result;
}

export async function POST(request: NextRequest) {
  let cookieTransport = true;
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      throw new ApiError(403, "INVALID_ORIGIN", "This request is not allowed.");
    }

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
      if (refreshToken && origin !== request.nextUrl.origin) {
        throw new ApiError(403, "INVALID_ORIGIN", "This request is not allowed.");
      }
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
    if (cookieTransport) setRefreshCookie(response, tokens.refreshToken, tokens.refreshExpiresAt);
    return response;
  } catch (error) {
    const response = toNextResponse(handleApiError(error));
    if (cookieTransport && response.status === 401) clearRefreshCookie(response);
    return response;
  }
}
