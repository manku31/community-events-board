import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, UserRound } from "lucide-react";
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
  const details = [
    { label: "Name", value: name },
    { label: "Email address", value: user.email },
    { label: "Account ID", value: String(user.id) },
    { label: "Role", value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
    { label: "Account status", value: user.status ? "Active" : "Inactive" },
    { label: "Joined", value: formatDate.format(user.createdAt) },
    { label: "Last updated", value: formatDate.format(user.updatedAt) },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-8 sm:py-12">
        <Link href={getUserLandingPath(user)} className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><ArrowLeft className="size-4" aria-hidden="true" /> Back to home</Link>
        <section className="overflow-hidden rounded-3xl border border-[#ddcee9] bg-white">
          <div className="flex items-center gap-4 bg-secondary p-6 sm:gap-6 sm:p-8">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-secondary-foreground"><UserRound className="size-8" aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-secondary-foreground">My profile</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight wrap-anywhere sm:text-3xl">{name}</h1>
            </div>
          </div>
          <dl className="grid gap-6 p-6 sm:grid-cols-2 sm:gap-8 sm:p-8">
            {details.map(({ label, value }) => (
              <div key={label} className="min-w-0">
                <dt className="text-sm text-[#756477]">{label}</dt>
                <dd className="mt-2 font-medium wrap-anywhere">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <footer className="border-t border-[#eadfd8] px-4 py-6 text-center text-sm text-[#756477]">Made for good days and great company.</footer>
    </div>
  );
}

export default function ProfilePage() {
  return <Suspense fallback={<main className="flex min-h-dvh items-center justify-center bg-background px-4 text-secondary-foreground"><p role="status">Loading your profile…</p></main>}><ProfileContent /></Suspense>;
}
