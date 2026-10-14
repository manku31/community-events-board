import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { EditEventButton } from "@/components/admin/edit-event-button";
import { sampleEvents } from "@/lib/events/sample-events";

export const metadata: Metadata = { title: "Event details | Community Events Board" };

async function EventDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = sampleEvents.find(item => String(item.id) === id);
  if (!event) notFound();
  const date = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(event.date));
  const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(event.date));
  const price = event.price ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(event.price) : "Free";
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
          <section className="border-t border-[#eadfd8] pt-6"><h2 className="text-lg font-semibold">About this event</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[#756477]">{event.description}</p></section>
          <section className="border-t border-[#eadfd8] pt-6"><h2 className="text-sm font-semibold">Image URL</h2><p className="mt-3 rounded-2xl bg-background p-4 text-sm leading-6 text-[#756477] wrap-anywhere">{event.imageUrl}</p><p className="mt-2 text-xs leading-6 text-[#756477]">Placeholder image URL for this sample event.</p></section>
          <p className="rounded-2xl bg-accent/60 px-4 py-3 text-xs leading-6 text-accent-foreground">Sample event details for this UI preview.</p>
        </div>
      </div>
    </>
  );
}

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return <AdminShell><EventDetails params={params} /></AdminShell>;
}
