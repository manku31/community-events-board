import type { Metadata } from "next";
import {
  ArrowRight,
  Bell,
  CalendarDays,
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
import { buttonVariants } from "@/components/ui/button";

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
    <div className="min-h-screen bg-[#fff9f2] text-[#30243b]">
      <header className="border-b border-[#eadfd8] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <a href="#" className="flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#be4336]" aria-label="Community Events Board home">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#be4336] text-white">
              <CalendarDays className="size-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold leading-tight sm:text-base">Community<br />Events Board</span>
          </a>
          <nav aria-label="Main navigation" className="flex items-center gap-5 text-sm font-medium sm:gap-8">
            <a href="#categories" className="text-[#6c5c70] transition-colors hover:text-[#be4336]">Explore</a>
            <a href="#how-it-works" className="hidden text-[#6c5c70] transition-colors hover:text-[#be4336] sm:block">How it works</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#eadfd8] bg-white px-4 py-2 text-sm font-medium text-[#8c3a31]">
              <Sparkles className="size-4" aria-hidden="true" />
              A little local. A lot of happy.
            </p>
            <h1 className="max-w-xl text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
              Go out.<br />Find your people.<br /><span className="text-[#be4336]">Feel good.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-[#6c5c70] sm:text-lg">
              Sing a little louder. Try something new. Share a really good meal. Your next happy moment is happening close to home.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#categories" className={buttonVariants({ className: "h-12 rounded-2xl bg-[#be4336] px-6 text-white hover:bg-[#a3372c]" })}>
                Explore categories <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a href="#how-it-works" className="rounded-md px-2 py-3 text-sm font-medium text-[#6c5c70] hover:text-[#be4336]">How it works</a>
            </div>
          </div>

          <div className="relative rounded-[2rem] border border-[#ddcee9] bg-[#eee5f7] p-6 sm:p-10">
            <div className="mb-8 flex items-center justify-between gap-3 text-[#59416d]">
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">Good times, right around here</span>
              <Smile className="size-6 shrink-0" aria-hidden="true" />
            </div>
            <div className="space-y-4">
              {categories.slice(0, 3).map(({ name, icon: Icon, description, colour }) => (
                <div key={name} className="flex items-center gap-4 rounded-2xl border border-white bg-white p-5 shadow-[0_5px_0_#ddcee9] first:rotate-[-2deg] last:rotate-[2deg]">
                  <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${colour}`}>
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold">{name}</p>
                    <p className="mt-1 text-sm leading-6 text-[#756477]">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-7 text-center text-sm text-[#59416d]">More little adventures. More big smiles.</p>
          </div>
        </section>

        <section id="categories" className="scroll-mt-8 border-y border-[#eadfd8] bg-white/60">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#be4336]">Something for everyone</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">What are you in the mood for?</h2>
            <p className="mt-3 text-[#6c5c70]">Start with the things you love.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {categories.map(({ name, icon: Icon, description, colour }) => (
                <div key={name} className={`rounded-3xl border border-black/5 p-5 ${colour}`}>
                  <Icon className="mb-5 size-7" aria-hidden="true" />
                  <h3 className="font-semibold">{name}</h3>
                  <p className="mt-2 text-sm leading-6 opacity-85">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-8 px-5 py-14 sm:px-8 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Make room for something fun.</h2>
          <div className="mt-9 grid gap-8 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, description }) => (
              <div key={title}>
                <span className="mb-4 flex size-11 items-center justify-center rounded-2xl border border-[#efd49f] bg-[#fff0c8] text-[#79541a]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-7 text-[#6c5c70]">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#eadfd8] px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-sm text-[#756477] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-[#514158]">Community Events Board</p>
          <p>Made for good days and great company.</p>
        </div>
      </footer>
    </div>
  );
}
