"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { EditEventButton } from "@/components/admin/edit-event-button";
import { EventDetailsSkeleton } from "@/components/admin/loading-skeletons";
import { EventPreview } from "@/components/admin/event-preview";
import { toEventView, type EventRecord, type EventView } from "@/lib/events/types";
import type { ApiResponse } from "@/lib/api/types";

export function EventDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventView | null>(null);
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
        if (!response.ok || !body.success) { setError(!body.success ? body.error.message : "Couldn’t load this event."); return; }
        setEvent(toEventView(body.data.event));
      } catch { if (!controller.signal.aborted) setError("Couldn’t load this event. Please try again."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [id, retry]);
  if (loading) return <EventDetailsSkeleton />;
  if (error || !event) return <div className="rounded-3xl border border-[#eadfd8] bg-white p-6"><p role="alert" className="text-sm leading-7">{error || "Event not found."}</p><div className="mt-4 flex flex-wrap gap-3"><button onClick={() => setRetry(value => value + 1)} className="min-h-12 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground">Try again</button><Link href="/admin" className="inline-flex min-h-12 items-center rounded-full px-5 text-sm font-semibold text-primary">All events</Link></div></div>;
  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link href="/admin" className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-medium text-secondary-foreground hover:underline focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft className="size-4" aria-hidden="true" /> All events</Link>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold text-secondary-foreground">Event details</p><EditEventButton eventId={event.id} /></div>
      <EventPreview variant="details" values={{ title: event.title, category: event.category, city: event.city, date: event.date.slice(0, 10), time: event.time, price: String(event.price), description: event.description, imageUrl: event.imageUrl, status: event.active ? "active" : "inactive" }} />
    </div>
  );
}
