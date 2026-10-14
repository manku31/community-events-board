import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiError, successResponse } from "@/lib/api";
import type { AuthTokens } from "./session";
import type { AuthUser } from "./types";
import { setAccessCookie, setRefreshCookie } from "./cookies";
import { assertAuthOrigin } from "./origin";

export async function readAuthBody(request: NextRequest): Promise<unknown> {
  assertAuthOrigin(request);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Use application/json for the request body.");
  }
  try { return await request.json(); } catch {
    throw new ApiError(400, "INVALID_REQUEST", "Send a valid JSON request.");
  }
}

export function authSuccess(user: AuthUser, tokens: AuthTokens, client: "browser" | "native", status: number, message: string) {
  const json = successResponse({
    user, accessToken: tokens.accessToken, tokenType: tokens.tokenType, expiresIn: tokens.expiresIn,
    ...(client === "native" ? { refreshToken: tokens.refreshToken } : {}),
  }, { status, message, headers: { "Cache-Control": "no-store" } });
  const response = new NextResponse(json.body, { status: json.status, headers: json.headers });
  if (client === "browser") {
    setAccessCookie(response, tokens.accessToken);
    setRefreshCookie(response, tokens.refreshToken, tokens.refreshExpiresAt);
  }
  return response;
}

export function authFailure(error: unknown) {
  const json = handleApiError(error);
  const response = new NextResponse(json.body, { status: json.status, headers: json.headers });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
