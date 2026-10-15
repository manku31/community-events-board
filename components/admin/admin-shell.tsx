import type { ReactNode } from "react";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ApiError } from "@/lib/api";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/cookies";
import { getUserFromAccessToken } from "@/lib/auth/guards";
import { AdminPageSkeleton, type AdminLoadingVariant } from "@/components/admin/loading-skeletons";

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

export function AdminShell({ children, loadingVariant = "events" }: { children: ReactNode; loadingVariant?: AdminLoadingVariant }) {
  return <Suspense fallback={<AdminPageSkeleton variant={loadingVariant} />}><ProtectedAdminShell>{children}</ProtectedAdminShell></Suspense>;
}
