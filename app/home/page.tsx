import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CalendarDays, Music2, Palette, PartyPopper, Smile, Sparkles, Trophy, Utensils } from "lucide-react";
import { ApiError } from "@/lib/api";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/cookies";
import { getUserFromAccessToken } from "@/lib/auth/guards";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Home | Community Events Board",
  description: "Your home for local events and good times with your community.",
};

const categories = [
  { name: "Music", icon: Music2, colour: "bg-violet-100 text-violet-900" },
  { name: "Workshop", icon: Palette, colour: "bg-sky-100 text-sky-900" },
  { name: "Food", icon: Utensils, colour: "bg-orange-100 text-orange-900" },
  { name: "Sports", icon: Trophy, colour: "bg-lime-100 text-lime-900" },
  { name: "Kids", icon: PartyPopper, colour: "bg-pink-100 text-pink-900" },
];

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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 sm:py-12">
        <section className="grid items-center gap-8 rounded-3xl border border-[#ddcee9] bg-secondary p-6 sm:p-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="min-w-0">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-medium text-secondary-foreground sm:text-sm">
              <Sparkles className="size-4 shrink-0" aria-hidden="true" /> A good day starts close to home.
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight wrap-anywhere sm:text-5xl">Welcome, <span className="text-primary">{name}!</span></h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-secondary-foreground">A new experience, a familiar face, a reason to step out. Make a little room for something fun.</p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-white bg-white/70 p-5 lg:flex-col lg:gap-5 lg:p-8 lg:text-center">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground lg:size-20"><Smile className="size-8 lg:size-11" aria-hidden="true" /></span>
            <div>
              <p className="text-lg font-semibold">More little adventures.</p>
              <p className="mt-1 text-sm leading-6 text-secondary-foreground">More big smiles.</p>
            </div>
          </div>
        </section>

        <section className="mt-10 sm:mt-12" aria-labelledby="interests-heading">
          <h2 id="interests-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">Good times come in all kinds.</h2>
          <p className="mt-2 text-sm leading-6 text-[#6c5c70]">A little inspiration for your next outing.</p>
          <ul className="mt-5 flex flex-wrap gap-3">
            {categories.map(({ name: category, icon: Icon, colour }) => (
              <li key={category} className={`inline-flex items-center gap-2.5 rounded-2xl border border-black/5 px-4 py-3 text-sm font-semibold ${colour}`}>
                <Icon className="size-5" aria-hidden="true" /> {category}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 sm:mt-12" aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">Coming up in your community</h2>
          <div className="mt-5 rounded-3xl border border-dashed border-[#dfd4df] bg-white px-5 py-10 text-center sm:py-12">
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><CalendarDays className="size-7" aria-hidden="true" /></span>
            <h3 className="text-lg font-semibold">Good things are on the way.</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-[#6c5c70]">Events will appear here as they’re added. Come back soon for a little local inspiration.</p>
          </div>
        </section>
      </main>
      <footer className="mt-4 border-t border-[#eadfd8] px-4 py-6 text-center text-sm text-[#756477] sm:px-8">Made for good days and great company.</footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<main className="flex min-h-dvh items-center justify-center bg-background px-4 text-secondary-foreground"><p role="status">Getting your home ready…</p></main>}>
      <UserLanding />
    </Suspense>
  );
}
