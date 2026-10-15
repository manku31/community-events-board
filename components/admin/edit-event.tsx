"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { EventFormSkeleton } from "@/components/admin/loading-skeletons";
import { EventForm } from "@/components/admin/event-form";
import type { EventRecord } from "@/lib/events/types";
import type { ApiResponse } from "@/lib/api/types";

export function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setEvent(null);
    async function load() {
      try {
        const response = await fetch(`/api/admin/events/${encodeURIComponent(id)}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal });
        const body: ApiResponse<{ event: EventRecord }> = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || !body.success) { setError(!body.success ? body.error.message : "Couldn’t load the event."); return; }
        setEvent(body.data.event);
      } catch { if (!controller.signal.aborted) setError("Couldn’t load the event. Please try again."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [id, retry]);

  if (loading) return <EventFormSkeleton />;
  if (error || !event) return <div className="rounded-3xl border border-[#eadfd8] bg-white p-6"><p role="alert" className="text-sm leading-7">{error || "Event not found."}</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setRetry(value => value + 1)} className="min-h-12 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground">Try again</button><Link href="/admin" className="inline-flex min-h-12 items-center rounded-full px-5 text-sm font-semibold text-primary">All events</Link></div></div>;
  return <EventForm key={event.id} initial={event} />;
}
