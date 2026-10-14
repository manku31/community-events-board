import type { ReactNode } from "react";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ApiError } from "@/lib/api";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/cookies";
import { getUserFromAccessToken } from "@/lib/auth/guards";

async function ProtectedAdminShell({ children }: { children: ReactNode }) {
  const token = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  let user;
  try { user = await getUserFromAccessToken(token); } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/signin");
    throw error;
  }
  if (user.role !== "admin") redirect("/home");
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader user={user} />
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
      <footer className="border-t border-[#eadfd8] px-4 py-6 text-center text-sm text-[#756477]">Made for good days and great company.</footer>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return <Suspense fallback={<main className="flex min-h-dvh items-center justify-center bg-background px-4"><p role="status">Getting your admin space ready…</p></main>}><ProtectedAdminShell>{children}</ProtectedAdminShell></Suspense>;
}
