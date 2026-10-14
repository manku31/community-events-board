import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CalendarDays, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ApiError } from "@/lib/api";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/cookies";
import { getUserFromAccessToken } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Admin | Community Events Board" };

async function AdminLanding() {
  const token = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  let user;
  try {
    user = await getUserFromAccessToken(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/signin");
    throw error;
  }
  if (user.role !== "admin") redirect("/home");

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 sm:py-12">
        <section className="rounded-3xl border border-[#ddcee9] bg-secondary p-6 sm:p-10">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-secondary-foreground sm:text-sm">
            <ShieldCheck className="size-4" aria-hidden="true" /> Admin space
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight wrap-anywhere sm:text-5xl">Welcome, <span className="text-primary">{user.name || user.email.split("@")[0]}!</span></h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-secondary-foreground">Here’s where good community plans begin.</p>
        </section>
        <section className="mt-8 rounded-3xl border border-[#eadfd8] bg-white px-5 py-10 text-center sm:mt-10 sm:py-12">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><CalendarDays className="size-7" aria-hidden="true" /></span>
          <h2 className="text-xl font-semibold">Your events, all in one place.</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-[#6c5c70]">Event management will be available here soon.</p>
        </section>
      </main>
      <footer className="border-t border-[#eadfd8] px-4 py-6 text-center text-sm text-[#756477]">Made for good days and great company.</footer>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<main className="flex min-h-dvh items-center justify-center bg-background px-4 text-secondary-foreground"><p role="status">Getting your admin space ready…</p></main>}>
      <AdminLanding />
    </Suspense>
  );
}
