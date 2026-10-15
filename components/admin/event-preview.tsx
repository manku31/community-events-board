"use client";

import Image from "next/image";
import { useState } from "react";
import { CalendarDays, Clock3, ImageIcon, MapPin, Sparkles } from "lucide-react";

export type EventPreviewValues = { title: string; category: string; city: string; date: string; time: string; price: string; description: string; imageUrl: string; status: string };

function PreviewImage({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  let valid = false;
  try { valid = ["http:", "https:"].includes(new URL(url).protocol); } catch { /* Show the placeholder while the URL is incomplete. */ }
  return (
    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#e7dbee]">
      {valid && !failed ? <Image src={url} alt="Event image preview" fill unoptimized sizes="(min-width: 1024px) 420px, 100vw" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="object-cover" /> : <>
        <div aria-hidden="true" className="absolute -top-14 -right-12 size-48 rounded-full bg-[#d9c4e4]" /><div aria-hidden="true" className="absolute -bottom-16 -left-10 size-52 rounded-full border-[30px] border-[#f7e8c7]" />
        <div className="relative max-w-64 px-5 text-center text-secondary-foreground"><span className="mx-auto flex size-16 -rotate-6 items-center justify-center rounded-[1.3rem] border border-white/80 bg-white/65 shadow-[0_5px_0_#cdb9d9]"><ImageIcon className="size-7" strokeWidth={1.5} aria-hidden="true" /></span><p className="mt-5 text-lg font-semibold tracking-tight">Picture the good times.</p><p className="mt-2 text-xs leading-6">{failed ? "Couldn’t load this image. Try another URL." : "Add your cover image to set the scene."}</p></div>
      </>}
    </div>
  );
}

export function EventPreview({ values }: { values: EventPreviewValues }) {
  const day = values.date ? new Date(`${values.date}T12:00:00+05:30`) : null;
  const time = values.time ? new Date(`2000-01-01T${values.time}:00+05:30`) : null;
  const dateLabel = day && !Number.isNaN(day.getTime()) ? new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(day) : "Pick a date";
  const timeLabel = time && !Number.isNaN(time.getTime()) ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(time) : "Pick a time";
  const price = Number(values.price);
  const priceLabel = values.price === "" || !Number.isFinite(price) || price < 0 ? "Price to be added" : price === 0 ? "Free" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(price);

  return (
    <aside aria-labelledby="event-preview-heading" className="min-w-0 rounded-[2rem] bg-[#f0e9f3]/65 p-4 sm:p-5 lg:sticky lg:top-6 lg:self-start">
      <div className="mb-5 flex items-center justify-between gap-3 px-1"><h2 id="event-preview-heading" className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-foreground">Your event, at a glance</h2><span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#ded2e6] bg-white/80 px-2.5 py-1.5 text-[10px] font-semibold text-secondary-foreground"><span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />Live</span></div>
      <article className="overflow-hidden rounded-[1.7rem] border border-white bg-white shadow-[0_10px_30px_-12px_#745a8860]">
        <PreviewImage key={values.imageUrl.trim()} url={values.imageUrl.trim()} />
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">{values.category || "Category"}</span><span className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${values.status === "active" ? "bg-emerald-50 text-emerald-800" : "bg-[#f3edf5] text-secondary-foreground"}`}>{values.status === "active" ? "Active" : "Inactive"}</span></div>
          <h3 className="mt-4 text-2xl font-bold leading-8 tracking-tight wrap-anywhere">{values.title.trim() || "Something good is on the way."}</h3>
          <dl className="mt-4 space-y-3 text-sm leading-6 text-[#756477]">
            <div className="flex items-start gap-2"><dt><span className="sr-only">City</span><MapPin className="mt-1 size-4" aria-hidden="true" /></dt><dd className="min-w-0 wrap-anywhere">{values.city.trim() || "Add your city"}</dd></div>
            <div className="flex items-start gap-2"><dt><span className="sr-only">Date</span><CalendarDays className="mt-1 size-4" aria-hidden="true" /></dt><dd className="min-w-0">{dateLabel}</dd></div>
            <div className="flex items-start gap-2"><dt><span className="sr-only">Time</span><Clock3 className="mt-1 size-4" aria-hidden="true" /></dt><dd className="min-w-0">{timeLabel}{values.time ? " IST" : ""}</dd></div>
          </dl>
          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#756477] wrap-anywhere">{values.description.trim() || "Tell people a little about the experience. Your description will appear here."}</p>
          <div className="relative -mx-5 mt-6 flex items-center justify-between gap-3 border-t border-dashed border-[#dfd4df] px-5 pt-5 sm:-mx-6 sm:px-6"><span aria-hidden="true" className="absolute top-0 left-0 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f0e9f3]" /><span aria-hidden="true" className="absolute top-0 right-0 size-5 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f0e9f3]" /><div><p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-[#8b798b]">Your way in</p><p className="text-lg font-bold text-primary">{priceLabel}</p></div><span className="flex size-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Sparkles className="size-5" aria-hidden="true" /></span></div>
        </div>
      </article>
      <p className="mt-5 px-2 text-center text-[11px] leading-6 text-[#8b798b]">{values.status === "inactive" ? "Just for you, until you’re ready to share." : "A little sneak peek of what’s coming."}</p>
    </aside>
  );
}
