"use client";

import { Button } from "@/components/ui/button";

export default function ProfileError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="max-w-md rounded-3xl border border-border bg-white p-6 text-center">
        <h1 className="text-2xl font-bold">We couldn’t load your profile.</h1>
        <p className="mt-3 text-sm text-muted-foreground">Please try again in a moment.</p>
        <Button onClick={reset} className="mt-6 h-12 rounded-full px-6">Try again</Button>
      </div>
    </main>
  );
}
