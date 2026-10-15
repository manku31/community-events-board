import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import { EventDetailsSkeleton } from "@/components/admin/loading-skeletons";
import { VisitorEventDetails } from "@/components/events/visitor-event-details";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/cookies";
import { getUserFromAccessToken } from "@/lib/auth/guards";
import { ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Event | Community Events Board" };

async function EventPageContent({ params }: { params: Promise<{ id: string }> }) {
  let user;
  const token = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  if (token) {
    try { user = await getUserFromAccessToken(token); } catch (error) { if (!(error instanceof ApiError && error.status === 401)) throw error; }
  }
  return <div className="flex min-h-dvh flex-col bg-background"><SiteHeader user={user} /><main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 sm:py-10"><VisitorEventDetails params={params} /></main><footer className="border-t border-[#eadfd8] px-4 py-6 text-center text-sm text-[#756477]">Made for good days and great company.</footer></div>;
}

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="mx-auto max-w-5xl px-4 py-8"><EventDetailsSkeleton /></main>}><EventPageContent params={params} /></Suspense>;
}
