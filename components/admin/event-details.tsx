"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { EditEventButton } from "@/components/admin/edit-event-button";
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
  if (loading) return <p role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-secondary-foreground"><LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden="true" />Loading event…</p>;
  if (error || !event) return <div className="rounded-3xl border border-[#eadfd8] bg-white p-6"><p role="alert" className="text-sm leading-7">{error || "Event not found."}</p><div className="mt-4 flex flex-wrap gap-3"><button onClick={() => setRetry(value => value + 1)} className="min-h-12 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground">Try again</button><Link href="/admin" className="inline-flex min-h-12 items-center rounded-full px-5 text-sm font-semibold text-primary">All events</Link></div></div>;
  const date = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(event.date));
  const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(event.date));
  const price = event.price ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(event.price) : "Free";
  const details = [ { label: "Category", value: event.category }, { label: "City", value: event.city }, { label: "Date", value: date }, { label: "Time", value: `${time} IST` }, { label: "Price", value: price }, { label: "Status", value: event.active ? "Active" : "Inactive" } ];

  return (
    <>
      <Link href="/admin" className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-medium text-secondary-foreground hover:underline focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft className="size-4" aria-hidden="true" /> All events</Link>
      <div className="overflow-hidden rounded-3xl border border-[#eadfd8] bg-white">
        <header className="flex flex-col gap-5 bg-secondary/50 p-5 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <span className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${event.colour}`}><span aria-hidden="true">{event.emoji}</span>{event.category}</span>
            <h1 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight wrap-anywhere sm:text-4xl">{event.title}</h1>
            <p className="mt-3 text-sm text-secondary-foreground">Event details</p>
          </div>
          <EditEventButton />
        </header>
        <div className="space-y-8 p-5 sm:p-8">
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {details.map(({ label, value }) => <div key={label} className="min-w-0"><dt className="text-xs font-semibold text-[#756477]">{label}</dt><dd className="mt-2 text-sm font-medium leading-6 wrap-anywhere">{value}</dd></div>)}
          </dl>
          <section className="border-t border-[#eadfd8] pt-6"><h2 className="text-lg font-semibold">About this event</h2><p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-[#756477] wrap-anywhere">{event.description}</p></section>
          <section className="border-t border-[#eadfd8] pt-6"><h2 className="text-sm font-semibold">Image URL</h2><p className="mt-3 rounded-2xl bg-background p-4 text-sm leading-6 text-[#756477] wrap-anywhere">{event.imageUrl}</p></section>
        </div>
      </div>
    </>
  );
}
