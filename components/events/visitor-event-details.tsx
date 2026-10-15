"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { EventPreview } from "@/components/admin/event-preview";
import { EventDetailsSkeleton } from "@/components/admin/loading-skeletons";
import type { EventRecord } from "@/lib/events/types";
import type { ApiResponse } from "@/lib/api/types";

export function VisitorEventDetails({ params }: { params: Promise<{ id: string }> }) {
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
        const response = await fetch(`/api/events/${encodeURIComponent(id)}`, { cache: "no-store", signal: controller.signal });
        const body: ApiResponse<{ event: EventRecord }> = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || !body.success) { setError(!body.success ? body.error.message : "Couldn’t load the event."); return; }
        setEvent(body.data.event);
      } catch { if (!controller.signal.aborted) setError("We couldn’t load the event. Please try again."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [id, retry]);
  if (loading) return <EventDetailsSkeleton />;
  return <><Link href="/home#events" className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft className="size-4" aria-hidden="true" />Back to events</Link>{error || !event ? <div role="alert" className="rounded-3xl border border-[#eadfd8] bg-white p-6"><p className="text-sm leading-7">{error || "This event is no longer available."}</p><button onClick={() => setRetry(value => value + 1)} className="mt-4 min-h-12 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground">Try again</button></div> : <EventPreview variant="details" values={{ title: event.title, category: event.category.category, city: event.city, date: event.date, time: event.time, price: event.price, imageUrl: event.image, description: event.description, status: "active" }} />}</>;
}
