import { Suspense } from "react";
import { AuthPageLoading, GuestOnly } from "@/components/auth/guest-only";
import type { Metadata } from "next";
import {
  Bell,
  Heart,
  MapPin,
  Music2,
  Palette,
  PartyPopper,
  Sparkles,
  Smile,
  Trophy,
  Utensils,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Community Events Board | Find something local",
  description:
    "Discover local music nights, workshops, food fairs, sports, and activities for kids.",
};

const categories = [
  { name: "Music", icon: Music2, colour: "bg-violet-100 text-violet-900", description: "Live sounds and good company." },
  { name: "Workshop", icon: Palette, colour: "bg-sky-100 text-sky-900", description: "Learn something. Make something." },
  { name: "Food", icon: Utensils, colour: "bg-orange-100 text-orange-900", description: "New flavours, close to home." },
  { name: "Sports", icon: Trophy, colour: "bg-lime-100 text-lime-900", description: "Get moving with your community." },
  { name: "Kids", icon: PartyPopper, colour: "bg-pink-100 text-pink-900", description: "Little adventures for little people." },
];

const steps = [
  { icon: MapPin, title: "Find your next outing", description: "Explore events by city, category, and what interests you." },
  { icon: Heart, title: "Follow what you love", description: "Choose your favourite categories for a feed that feels like you." },
  { icon: Bell, title: "Keep it on your radar", description: "Save a reminder for the events you want to come back to." },
];

export default function Home() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <GuestOnly>
        <div className="min-h-dvh bg-[#fff9f2] text-[#30243b]">
          <SiteHeader />

          <main>
            <section className="mx-auto grid max-w-6xl items-center gap-9 px-4 py-10 sm:gap-12 sm:px-8 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
              <div className="min-w-0">
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#eadfd8] bg-white px-3 py-2 text-xs font-medium text-[#8c3a31] sm:px-4 sm:text-sm">
                  <Sparkles className="size-4" aria-hidden="true" />
                  Your next good day starts here.
                </p>
                <h1 className="max-w-xl text-[clamp(2rem,9vw,3.5rem)] font-bold leading-[1.08] tracking-tight lg:text-[clamp(2.75rem,4.2vw,3.5rem)]">
                  Go out.<br />Find your people.<br /><span className="text-[#be4336]">Feel good.</span>
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 sm:mt-6 sm:leading-8 text-[#6c5c70] sm:text-lg">
                  Sing a little louder. Try something new. Share a really good meal. Your next happy moment is happening close to home.
                </p>
              </div>

              <div className="relative min-w-0 rounded-3xl border border-[#ddcee9] bg-[#eee5f7] p-5 sm:rounded-[2rem] sm:p-8 lg:p-10">
                <div className="mb-6 flex items-center justify-between gap-3 text-[#59416d]">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.18em]">Good times, right around here</span>
                  <Smile className="size-6 shrink-0" aria-hidden="true" />
                </div>
                <div className="space-y-4">
                  {categories.slice(0, 3).map(({ name, icon: Icon, description, colour }) => (
                    <div key={name} className="flex items-center gap-3 rounded-2xl border border-white bg-white p-4 sm:gap-4 sm:p-5 shadow-[0_5px_0_#ddcee9] first:rotate-[-2deg] last:rotate-[2deg]">
                      <span className={`flex size-10 shrink-0 sm:size-12 items-center justify-center rounded-2xl ${colour}`}>
                        <Icon className="size-5 sm:size-6" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold">{name}</p>
                        <p className="mt-1 text-sm leading-6 text-[#756477]">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-center text-sm leading-6 text-[#59416d]">More little adventures. More big smiles.</p>
              </div>
            </section>

            <section id="categories" className="scroll-mt-8 border-y border-[#eadfd8] bg-white/60">
              <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-16">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#be4336]">Something for everyone</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">What are you in the mood for?</h2>
                <p className="mt-3 text-[#6c5c70]">Start with the things you love.</p>
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                  {categories.map(({ name, icon: Icon, description, colour }) => (
                    <div key={name} className={`min-w-0 rounded-2xl border border-black/5 p-4 last:col-span-2 sm:rounded-3xl sm:p-5 sm:last:col-span-1 ${colour}`}>
                      <Icon className="mb-4 size-6 sm:size-7" aria-hidden="true" />
                      <h3 className="font-semibold">{name}</h3>
                      <p className="mt-2 text-sm leading-6 opacity-85">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-10 sm:px-8 sm:py-16">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Make room for something fun.</h2>
              <div className="mt-7 grid gap-5 sm:mt-9 sm:grid-cols-3 sm:gap-8">
                {steps.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex items-start gap-4 sm:block">
                    <span className="flex size-11 shrink-0 items-center sm:mb-4 justify-center rounded-2xl border border-[#efd49f] bg-[#fff0c8] text-[#79541a]">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{title}</h3>
                      <p className="mt-2 max-w-xs text-sm leading-6 text-[#6c5c70] sm:leading-7">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <footer className="border-t border-[#eadfd8] px-4 py-6 sm:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 text-sm text-[#756477] sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium text-[#514158]">Community Events Board</p>
              <p>Made for good days and great company.</p>
            </div>
          </footer>
        </div>
      </GuestOnly>
    </Suspense>
  );
}
