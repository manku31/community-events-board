import "server-only";
import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api";

export function assertAuthOrigin(request: NextRequest, required = false): void {
  const origin = request.headers.get("origin");
  if (!origin && !required) return;
  // NextURL normalizes loopback hostnames; Host preserves the browser's actual host.
  const host = request.headers.get("host") ?? request.nextUrl.host;
  let expectedOrigin: string;
  try { expectedOrigin = new URL(`${request.nextUrl.protocol}//${host}`).origin; } catch {
    throw new ApiError(403, "INVALID_ORIGIN", "This request is not allowed.");
  }
  if (origin !== expectedOrigin) throw new ApiError(403, "INVALID_ORIGIN", "This request is not allowed.");
}
