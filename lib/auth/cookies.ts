import "server-only";
import type { NextResponse } from "next/server";

export const REFRESH_COOKIE_NAME = "refreshToken";

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
