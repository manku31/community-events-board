"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-xl px-4 py-16"><div className="rounded-3xl border border-[#eadfd8] bg-white p-6 text-center"><h1 className="text-2xl font-bold">We couldn’t load this event.</h1><p className="mt-3 text-sm leading-7 text-secondary-foreground">Please try again in a moment.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Button onClick={reset} className="h-12 rounded-full px-5">Try again</Button><Link href="/home" className="inline-flex min-h-12 items-center rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground">Back to events</Link></div></div></main>;
}
