"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, MapPin, Search, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCover } from "./event-cover";
import { toEventView } from "@/lib/events/types";
import type { BrowseEventsResult } from "@/lib/events/browse-types";
import type { ApiResponse } from "@/lib/api/types";

const dateFormat = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const initialFilters = { categoryId: "", city: "", search: "", page: 1 };

export function BrowseCardsSkeleton() {
  return <div role="status" aria-label="Loading upcoming events" aria-busy="true" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><span className="sr-only">Loading upcoming events…</span>{[0, 1, 2, 3, 4, 5].map(index => <div key={index} className="overflow-hidden rounded-3xl border border-[#eadfd8] bg-white"><Skeleton className="aspect-[16/10] rounded-none" /><div className="space-y-4 p-5"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-5/6" /><Skeleton className="h-4 w-3/5" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-10 w-full" /></div></div>)}</div>;
}

export function EventsBrowser() {
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState("");
  const [data, setData] = useState<BrowseEventsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setFilters(current => current.search === searchInput.trim() ? current : { ...current, search: searchInput.trim(), page: 1 }), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    async function load() {
      const query = new URLSearchParams({ page: String(filters.page), pageSize: "6" });
      if (filters.categoryId) query.set("categoryId", filters.categoryId);
      if (filters.city) query.set("city", filters.city);
      if (filters.search) query.set("search", filters.search);
      try {
        const response = await fetch(`/api/events?${query}`, { cache: "no-store", signal: controller.signal });
        const body: ApiResponse<BrowseEventsResult> = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || !body.success) { setError(!body.success ? body.error.message : "Couldn’t load events."); return; }
        setData(body.data);
      } catch { if (!controller.signal.aborted) setError("We couldn’t load events. Check your connection and try again."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [filters, retry]);

  function clear() { setSearchInput(""); setFilters(initialFilters); }
  const hasFilters = Boolean(filters.categoryId || filters.city || filters.search);

  return (
    <section id="events" aria-labelledby="browse-heading" className="mt-9 scroll-mt-6 sm:mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Step out. Find your people.</p><h2 id="browse-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">What’s happening nearby</h2></div><span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs text-[#756477]"><CalendarDays className="size-3.5" aria-hidden="true" />Soonest first</span></div>
      <div className="mt-6 grid gap-3 rounded-3xl border border-[#eadfd8] bg-white p-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-4">
        <div className="relative min-w-0"><Search className="absolute top-4 left-4 size-5 text-[#8b798b]" aria-hidden="true" /><input aria-label="Search events" value={searchInput} maxLength={200} onChange={event => setSearchInput(event.target.value)} placeholder="Music nights, pottery, good food…" className="h-13 w-full rounded-2xl border border-[#eee6e0] bg-background/70 pr-4 pl-12 text-base outline-none focus:border-primary focus:ring-3 focus:ring-primary/10" /></div>
        <div className="relative min-w-0"><MapPin className="pointer-events-none absolute top-4 left-4 size-5 text-secondary-foreground" aria-hidden="true" /><select aria-label="Filter by city" value={filters.city} onChange={event => setFilters(current => ({ ...current, city: event.target.value, page: 1 }))} className="h-13 w-full appearance-none rounded-2xl border border-[#eee6e0] bg-background/70 pr-10 pl-12 text-base text-secondary-foreground outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"><option value="">All cities</option>{data?.cities.map(city => <option key={city}>{city}</option>)}</select><ChevronDown className="pointer-events-none absolute top-[18px] right-4 size-4 text-secondary-foreground" aria-hidden="true" /></div>
      </div>
      <div aria-label="Filter by category" className="mt-4 flex flex-wrap gap-2">
        <button type="button" aria-pressed={!filters.categoryId} onClick={() => setFilters(current => ({ ...current, categoryId: "", page: 1 }))} className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${!filters.categoryId ? "border-primary bg-primary text-white" : "border-[#eadfd8] bg-white text-secondary-foreground hover:bg-secondary"}`}><Sparkles className="size-3.5" aria-hidden="true" />All kinds of good</button>
        {data?.categories.map(category => <button key={category.id} type="button" aria-pressed={filters.categoryId === String(category.id)} onClick={() => setFilters(current => ({ ...current, categoryId: String(category.id), page: 1 }))} className={`min-h-11 rounded-full border px-4 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${filters.categoryId === String(category.id) ? "border-[#b9a3ce] bg-secondary text-secondary-foreground" : "border-[#eadfd8] bg-white text-[#756477] hover:bg-secondary/60"}`}>{category.category}</button>)}
      </div>
      <div className="mt-5 mb-4 flex min-h-6 items-center justify-between gap-3"><p role="status" className="text-xs text-[#756477]">{loading ? "Finding your next plan…" : !error && data ? `${data.pagination.total} upcoming ${data.pagination.total === 1 ? "event" : "events"}` : ""}</p>{hasFilters && <button type="button" onClick={clear} className="min-h-11 rounded-xl px-2 text-xs font-semibold text-primary hover:bg-secondary">Clear filters</button>}</div>
      {loading ? <BrowseCardsSkeleton /> : error ? <div role="alert" className="rounded-3xl border border-[#eadfd8] bg-white px-6 py-12 text-center"><p className="text-sm leading-7 text-secondary-foreground">{error}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-4 min-h-12 rounded-full bg-primary px-6 text-sm font-semibold text-white">Try again</button></div> : !data?.events.length ? <div className="rounded-3xl border border-dashed border-[#dfd4df] bg-white px-6 py-14 text-center"><span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><CalendarDays className="size-7" aria-hidden="true" /></span><h3 className="text-xl font-semibold">{hasFilters ? "No plans match just yet." : "Good things are on the way."}</h3><p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-[#756477]">{hasFilters ? "Try a different city or category, or give your search a fresh start." : "New events will appear here as your community adds them. Check back soon."}</p>{hasFilters && <button onClick={clear} className="mt-5 min-h-12 rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground">Clear filters</button>}</div> : <>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.events.map(record => { const event = toEventView(record); return <article key={event.id} className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[#eadfd8] bg-white shadow-[0_4px_0_#f0e5dc] transition-shadow hover:shadow-[0_8px_22px_-12px_#59416d45]"><Link href={`/events/${event.id}`} className="focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"><EventCover key={event.imageUrl} image={event.imageUrl} title={event.title} /></Link><div className="flex flex-1 flex-col p-5"><span className={`self-start rounded-full px-3 py-1.5 text-[11px] font-semibold ${event.colour}`}>{event.category}</span><h3 className="mt-3 text-lg font-bold leading-7 wrap-anywhere"><Link href={`/events/${event.id}`} className="rounded-lg hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">{event.title}</Link></h3><div className="mt-3 space-y-2 text-xs leading-6 text-[#756477]"><p className="flex items-start gap-2"><MapPin className="mt-1 size-3.5 shrink-0" aria-hidden="true" /><span className="min-w-0 wrap-anywhere">{event.city}</span></p><p className="flex items-start gap-2"><CalendarDays className="mt-1 size-3.5 shrink-0" aria-hidden="true" /><span>{dateFormat.format(new Date(event.date))}</span></p></div><p className="mt-3 line-clamp-2 text-xs leading-6 text-[#8b798b] wrap-anywhere">{event.description}</p><div className="mt-auto flex items-center justify-between gap-3 border-t border-[#f0e7e1] pt-4"><p className="pt-3 text-base font-bold text-primary">{event.price ? currency.format(event.price) : "Free"}</p><Link href={`/events/${event.id}`} aria-label={`View ${event.title}`} className="mt-3 inline-flex min-h-11 items-center gap-1 rounded-full bg-background px-3 text-xs font-semibold text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary">Take a look<ArrowUpRight className="size-3.5" aria-hidden="true" /></Link></div></div></article>; })}</div>
        <nav aria-label="Event pages" className="mt-8 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-[#756477]">{(data.pagination.page - 1) * data.pagination.pageSize + 1}–{Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)} of {data.pagination.total} events</span><div className="flex items-center gap-2"><button type="button" disabled={data.pagination.page <= 1} onClick={() => setFilters(current => ({ ...current, page: data.pagination.page - 1 }))} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#eadfd8] bg-white px-3 text-xs font-semibold text-secondary-foreground disabled:opacity-40"><ChevronLeft className="size-4" aria-hidden="true" />Previous</button><span className="px-1 text-xs text-[#756477]">{data.pagination.page} / {data.pagination.totalPages}</span><button type="button" disabled={data.pagination.page >= data.pagination.totalPages} onClick={() => setFilters(current => ({ ...current, page: data.pagination.page + 1 }))} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#eadfd8] bg-white px-3 text-xs font-semibold text-secondary-foreground disabled:opacity-40">Next<ChevronRight className="size-4" aria-hidden="true" /></button></div></nav>
      </>}
    </section>
  );
}
