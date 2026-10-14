import { Suspense } from "react";
import { AuthPageLoading, GuestOnly } from "@/components/auth/guest-only";
import { Heart, Music2, Sparkles, Utensils } from "lucide-react";

import { SiteHeader } from "@/components/site-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <GuestOnly>
        <div className="flex min-h-dvh flex-col bg-background text-foreground">
          <SiteHeader auth />
          <main className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-10 px-4 py-7 sm:items-center sm:px-8 sm:py-12 lg:grid-cols-2 lg:gap-16">
            <aside className="hidden rounded-[2rem] border border-[#ddcee9] bg-secondary p-10 lg:block">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-secondary-foreground">
                <Sparkles className="size-4" aria-hidden="true" /> Your people are nearby.
              </span>
              <h2 className="mt-8 text-5xl font-bold leading-[1.12] tracking-tight">More plans.<br />More people.<br /><span className="text-primary">More happy.</span></h2>
              <p className="mt-5 max-w-sm leading-7 text-[#6c5c70]">Find the music, flavours, and little adventures that make your neighbourhood feel like home.</p>
              <div className="mt-10 space-y-4">
                {[
                  { icon: Music2, title: "Find your rhythm", colour: "bg-violet-100 text-violet-900" },
                  { icon: Utensils, title: "Share something delicious", colour: "bg-orange-100 text-orange-900" },
                  { icon: Heart, title: "Make a little memory", colour: "bg-pink-100 text-pink-900" },
                ].map(({ icon: Icon, title, colour }) => (
                  <div key={title} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_4px_0_#ddcee9]">
                    <span className={`flex size-10 items-center justify-center rounded-xl ${colour}`}><Icon className="size-5" aria-hidden="true" /></span>
                    <p className="text-sm font-medium">{title}</p>
                  </div>
                ))}
              </div>
            </aside>
            <div className="mx-auto w-full min-w-0 max-w-md">{children}</div>
          </main>
          <footer className="px-4 py-5 text-center text-sm text-[#756477]">Made for good days and great company.</footer>
        </div>
      </GuestOnly>
    </Suspense>
  );
}
