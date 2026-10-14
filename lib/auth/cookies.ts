import "server-only";
import type { NextResponse } from "next/server";
import { ACCESS_TOKEN_SECONDS } from "./config";

export const REFRESH_COOKIE_NAME = "refreshToken";
export const ACCESS_COOKIE_NAME = "accessToken";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/auth",
};

export function setRefreshCookie(response: NextResponse, token: string, expiresAt: Date): void {
  response.cookies.set(REFRESH_COOKIE_NAME, token, { ...cookieOptions, expires: expiresAt });
}

export function clearRefreshCookie(response: NextResponse): void {
  response.cookies.set(REFRESH_COOKIE_NAME, "", { ...cookieOptions, expires: new Date(0), maxAge: 0 });
}

export function setAccessCookie(response: NextResponse, token: string): void {
  response.cookies.set(ACCESS_COOKIE_NAME, token, { ...cookieOptions, path: "/", maxAge: ACCESS_TOKEN_SECONDS });
}

export function clearAccessCookie(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE_NAME, "", { ...cookieOptions, path: "/", maxAge: 0, expires: new Date(0) });
}
