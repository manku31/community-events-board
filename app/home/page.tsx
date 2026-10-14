import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Smile } from "lucide-react";
import { ApiError } from "@/lib/api";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/cookies";
import { getUserFromAccessToken } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Home | Community Events Board" };

async function WelcomeUser() {
  const token = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  let user;
  try { user = await getUserFromAccessToken(token); } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/signin");
    throw error;
  }
  const name = user.email.split("@")[0];
  return (
    <section className="w-full max-w-xl rounded-3xl border border-[#ddcee9] bg-secondary p-6 text-center sm:p-10">
      <span className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-white text-secondary-foreground"><Smile className="size-7" aria-hidden="true" /></span>
      <h1 className="text-3xl font-bold tracking-tight wrap-anywhere sm:text-4xl">Welcome, {name}!</h1>
      <p className="mt-4 text-secondary-foreground">Good to have you here.</p>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10 text-foreground sm:px-8">
      <Suspense fallback={<p role="status" className="text-secondary-foreground">Getting your welcome ready…</p>}>
        <WelcomeUser />
      </Suspense>
    </main>
  );
}
