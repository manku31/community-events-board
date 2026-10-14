import "server-only";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/cookies";
import { getUserFromAccessToken } from "@/lib/auth/guards";

export async function GuestOnly({ children }: { children: ReactNode }) {
  const token = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  if (!token) return children;

  try {
    await getUserFromAccessToken(token);
  } catch (error) {
    // Expired, invalid, or inactive sessions may access signin again.
    if (error instanceof ApiError && error.status === 401) return children;
    throw error;
  }

  redirect("/home");
}

export function AuthPageLoading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 text-secondary-foreground">
      <p role="status">Loading…</p>
    </main>
  );
}
