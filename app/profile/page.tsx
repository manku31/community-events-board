import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CalendarDays, Clock3, Hash, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { ProfileLoading } from "@/components/profile/profile-loading";
import { ApiError } from "@/lib/api";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/cookies";
import { getUserProfileFromAccessToken } from "@/lib/auth/guards";
import { SiteHeader } from "@/components/site-header";
import { getUserLandingPath } from "@/lib/auth/landing";

export const metadata: Metadata = { title: "My profile | Community Events Board" };

async function ProfileContent() {
  const token = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  let user;
  try { user = await getUserProfileFromAccessToken(token); } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/signin");
    throw error;
  }
  const name = user.name || user.email.split("@")[0];
  const formatDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join("").toUpperCase();
  const role = user.role === "admin" ? "Admin" : user.role === "user" ? "Community member" : user.role;
  const details = [
    { label: "Full name", value: name, icon: UserRound },
    { label: "Email address", value: user.email, icon: Mail },
    { label: "Account role", value: role, icon: ShieldCheck },
    { label: "Account ID", value: `#${user.id}`, icon: Hash },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <Link href={getUserLandingPath(user)} className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#eadfd8] bg-white px-4 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><ArrowLeft className="size-4" aria-hidden="true" />{user.role === "admin" ? "Back to admin" : "Back to home"}</Link>
        <section aria-labelledby="profile-heading" className="overflow-hidden rounded-[2rem] border border-[#e2d6e8] bg-white shadow-[0_6px_0_#f0e5dc]">
          <div className="relative isolate overflow-hidden bg-secondary px-6 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
            <div aria-hidden="true" className="pointer-events-none absolute -top-20 -right-12 -z-10 size-64 rounded-full border-[35px] border-[#ddcdeb]/60" />
            <div aria-hidden="true" className="pointer-events-none absolute right-36 -bottom-20 -z-10 size-40 rounded-full bg-[#f7e9ce]/70" />
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-foreground"><Sparkles className="size-4" aria-hidden="true" /> Your little corner</p>
            <h1 id="profile-heading" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">My profile<span className="text-primary">.</span></h1>
            <p className="mt-3 max-w-sm text-sm leading-7 text-secondary-foreground">Good days start with good company. Glad you’re here.</p>
          </div>
          <div className="relative px-6 pb-6 sm:px-8 sm:pb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <span aria-hidden="true" className="-mt-11 mb-4 flex size-22 items-center justify-center rounded-[1.7rem] border-[5px] border-white bg-[#ffe1cf] text-2xl font-bold text-[#a3372c] shadow-sm sm:size-24 sm:text-3xl">{initials}</span>
                <h2 className="text-2xl font-bold tracking-tight wrap-anywhere sm:text-3xl">{name}</h2>
                <p className="mt-2 text-sm leading-6 text-[#756477] wrap-anywhere">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:pb-1">
                <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-secondary/70 px-3 text-xs font-semibold text-secondary-foreground"><ShieldCheck className="size-3.5" aria-hidden="true" />{role}</span>
                <span className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold ${user.status ? "bg-[#edf4e7] text-[#4a6536]" : "bg-accent text-accent-foreground"}`}><span aria-hidden="true" className={`size-1.5 rounded-full ${user.status ? "bg-[#719252]" : "bg-amber-600"}`} />{user.status ? "Account active" : "Account inactive"}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <section aria-labelledby="account-details-heading" className="overflow-hidden rounded-3xl border border-[#eadfd8] bg-white">
            <div className="border-b border-[#f0e7e1] px-6 py-5 sm:px-7"><h2 id="account-details-heading" className="text-lg font-semibold tracking-tight">The details that make you, you</h2><p className="mt-1 text-xs leading-6 text-[#8b798b]">Your account information, all in one place.</p></div>
            <dl className="divide-y divide-[#f0e7e1] px-6 sm:px-7">
              {details.map(({ label, value, icon: Icon }) => <div key={label} className="flex min-w-0 items-start gap-3 py-5"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-secondary-foreground"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0"><dt className="text-xs text-[#8b798b]">{label}</dt><dd className="mt-1.5 text-sm font-semibold leading-6 wrap-anywhere">{value}</dd></div></div>)}
            </dl>
          </section>
          <section aria-labelledby="membership-heading" className="rounded-3xl border border-[#eadfd8] bg-[#fff4df] p-6 sm:p-7">
            <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-white/80 text-accent-foreground"><CalendarDays className="size-5" aria-hidden="true" /></span>
            <h2 id="membership-heading" className="text-lg font-semibold tracking-tight">Part of the community</h2>
            <dl className="mt-5 space-y-5"><div><dt className="text-xs text-[#84715a]">Member since</dt><dd className="mt-2 text-base font-semibold">{formatDate.format(user.createdAt)}</dd></div><div className="border-t border-[#ebdec5] pt-5"><dt className="flex items-center gap-1.5 text-xs text-[#84715a]"><Clock3 className="size-3.5" aria-hidden="true" />Profile last updated</dt><dd className="mt-2 text-sm font-medium">{formatDate.format(user.updatedAt)}</dd></div></dl>
          </section>
        </div>
      </main>
      <footer className="border-t border-[#eadfd8] px-4 py-6 text-center text-sm text-[#756477]">Made for good days and great company.</footer>
    </div>
  );
}

export default function ProfilePage() {
  return <Suspense fallback={<ProfileLoading />}><ProfileContent /></Suspense>;
}
