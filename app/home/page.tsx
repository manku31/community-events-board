import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowDownRight, CalendarDays, Music2, Sparkles } from "lucide-react";
import { EventsBrowser } from "@/components/events/events-browser";
import { HomeLoading } from "@/components/events/home-loading";
import { ApiError } from "@/lib/api";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/cookies";
import { getUserFromAccessToken } from "@/lib/auth/guards";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Home | Community Events Board",
  description: "Your home for local events and good times with your community.",
};

async function UserLanding() {
  const token = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  let user;
  try { user = await getUserFromAccessToken(token); } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/signin");
    throw error;
  }
  if (user.role === "admin") redirect("/admin");
  const name = user.name || user.email.split("@")[0];

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <section className="relative isolate overflow-hidden rounded-[2rem] border border-[#ddcee9] bg-secondary p-6 sm:p-10 lg:grid lg:grid-cols-[1.5fr_1fr] lg:items-center lg:gap-8">
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-12 -z-10 size-80 rounded-full border-[45px] border-[#dfcdec]/70" />
          <div className="min-w-0">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-2 text-[10px] font-semibold tracking-wide text-secondary-foreground sm:text-xs"><Sparkles className="size-3.5" aria-hidden="true" /> Your neighbourhood. Your kind of good time.</p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight wrap-anywhere sm:text-5xl">Hey, <span className="text-primary">{name}.</span><br />Let’s make some plans.</h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-secondary-foreground sm:text-base">An evening of music. A new little skill. A reason to get out and meet your people.</p>
            <a href="#events" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-[0_3px_0_#96352b] hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Find your next plan<ArrowDownRight className="size-4" aria-hidden="true" /></a>
          </div>
          <div aria-hidden="true" className="relative mx-auto mt-9 hidden w-full max-w-xs sm:block lg:mt-0">
            <div className="absolute -top-5 right-0 rotate-12 rounded-2xl border border-white bg-[#fff0c8] p-4 text-accent-foreground shadow-sm"><Music2 className="size-8" strokeWidth={1.5} /></div>
            <div className="-rotate-3 rounded-[1.7rem] border border-white bg-[#fffaf5] p-6 shadow-[0_9px_0_#d6c5e3]"><span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#ffe3d1] text-primary"><CalendarDays className="size-7" strokeWidth={1.5} /></span><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b798b]">Save a little space for</p><p className="mt-3 text-3xl font-bold leading-9 tracking-tight">Something<br /><span className="text-primary">worth going to.</span></p><div className="mt-5 flex items-center gap-2 border-t border-dashed border-[#dfd4df] pt-4 text-xs font-medium text-[#756477]"><Sparkles className="size-4 text-accent-foreground" />Good company included.</div></div>
          </div>
        </section>
        <EventsBrowser />
      </main>
      <footer className="mt-4 border-t border-[#eadfd8] px-4 py-6 text-center text-sm text-[#756477] sm:px-8">Made for good days and great company.</footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <UserLanding />
    </Suspense>
  );
}
