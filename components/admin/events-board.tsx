"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Layers3, LoaderCircle, MapPin, Plus, Search, SlidersHorizontal, UserPlus } from "lucide-react";
import { AddUserDialog } from "@/components/auth/add-user-dialog";
import { CategoriesDialog } from "@/components/admin/categories-dialog";
import { useConfirmation } from "@/components/ui/confirmation-dialog";

import { toEventView, type EventRecord, type EventView } from "@/lib/events/types";
import type { ApiResponse } from "@/lib/api/types";

const dateFormat = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const priceFormat = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const emptyFilters = { category: "", city: "", dateFrom: "", dateTo: "", minPrice: "", maxPrice: "", status: "" };

function ActiveSwitch({ title, active, onToggle, disabled }: { title: string; active: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" disabled={disabled} aria-checked={active} aria-label={`Active status for ${title}`} onClick={onToggle} className="flex min-h-11 min-w-14 items-center justify-center rounded-lg disabled:cursor-wait disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
      <span className={`inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors motion-reduce:transition-none ${active ? "bg-primary" : "bg-[#d8cbdc]"}`}><span className={`size-5 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none ${active ? "translate-x-5" : "translate-x-0"}`} /></span>
      <span className="sr-only">{active ? "On" : "Off"}</span>
    </button>
  );
}

export function EventsBoard() {
  const { confirm, confirmationDialog } = useConfirmation();
  const [events, setEvents] = useState<EventView[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const mutationPending = useRef(false);
  const request = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setLoadError("");
    try {
      const response = await fetch("/api/admin/events", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
      const body: ApiResponse<{ events: EventRecord[] }> = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || !body.success) { setLoadError(!body.success ? body.error.message : "Couldn’t load events."); return; }
      setEvents(body.data.events.map(toEventView));
    } catch { if (!controller.signal.aborted) setLoadError("We couldn’t load events. Please try again."); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => request.current?.abort(); }, [load]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(emptyFilters);
  const [draft, setDraft] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterError, setFilterError] = useState("");
  const filterCount = Object.values(filters).filter(Boolean).length;
  const cities = [...new Set(events.map(event => event.city))].sort();
  const categories = [...new Set(events.map(event => event.category))].sort();
  async function toggleEvent(id: number) {
    if (mutationPending.current) return;
    const selected = events.find(event => event.id === id);
    if (!selected) return;
    mutationPending.current = true;
    if (!await confirm({ description: `Make “${selected.title}” ${selected.active ? "inactive" : "active"}?` })) { mutationPending.current = false; return; }
    setSavingId(id); setSaveError("");
    setEvents(current => current.map(event => event.id === id ? { ...event, active: !selected.active } : event));
    try {
      const response = await fetch(`/api/admin/events/${id}`, { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: !selected.active }) });
      const body: ApiResponse<{ event: EventRecord }> = await response.json();
      if (!response.ok || !body.success) {
        setEvents(current => current.map(event => event.id === id ? selected : event));
        setSaveError(!body.success ? body.error.message : "Couldn’t save the status. Please try again.");
        return;
      }
      setEvents(current => current.map(event => event.id === id ? toEventView(body.data.event) : event));
    } catch {
      setEvents(current => current.map(event => event.id === id ? selected : event));
      setSaveError("Couldn’t save the status. Your change has been reverted.");
    } finally { mutationPending.current = false; setSavingId(null); }
  }
  const filtered = events.filter(event => {
    const date = event.date.slice(0, 10);
    return (!filters.category || event.category === filters.category)
      && (!filters.city || event.city === filters.city)
      && (!filters.status || event.active === (filters.status === "active"))
      && (!filters.dateFrom || date >= filters.dateFrom)
      && (!filters.dateTo || date <= filters.dateTo)
      && (filters.minPrice === "" || event.price >= Number(filters.minPrice))
      && (filters.maxPrice === "" || event.price <= Number(filters.maxPrice))
      && `${event.title} ${event.city}`.toLowerCase().includes(search.trim().toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, totalPages);
  const visibleEvents = filtered.slice((currentPage - 1) * 10, currentPage * 10);

  function clearFilters() {
    setPage(1);
    setFilters(emptyFilters);
    setDraft(emptyFilters);
    setFilterError("");
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo) {
      setFilterError("The end date must be on or after the start date.");
      return;
    }
    if (draft.minPrice !== "" && draft.maxPrice !== "" && Number(draft.minPrice) > Number(draft.maxPrice)) {
      setFilterError("The maximum price must be at least the minimum price.");
      return;
    }
    setPage(1);
    setFilters(draft);
    setFilterError("");
    setIsFilterOpen(false);
  }
  const selectClass = "h-12 min-w-0 max-w-full rounded-2xl border border-[#eadfd8] bg-white px-3 text-base outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 sm:text-sm";
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">All events</h1><p className="mt-3 text-sm leading-7 text-[#756477]">Little plans. Big community energy.</p></div>
        <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
          <button type="button" onClick={() => setIsCategoryOpen(true)} className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#ddcee9] bg-white px-5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:col-span-1"><Layers3 className="size-4" aria-hidden="true" />Category</button>
          <button type="button" onClick={() => setIsAddUserOpen(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"><UserPlus className="size-4" aria-hidden="true" /> Add user</button>
          <Link href="/admin/event" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"><Plus className="size-4" aria-hidden="true" /> Add event</Link>
        </div>
      </div>
      {saveError && <p role="alert" className="mt-5 rounded-2xl bg-white p-4 text-sm text-destructive">{saveError}</p>}
      <div className="mt-6 flex gap-3">
        <div className="relative min-w-0 flex-1"><Search className="absolute top-4 left-4 size-4 text-[#756477]" aria-hidden="true" /><input aria-label="Search events by title or city" placeholder="Search events or cities…" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className={`${selectClass} w-full pr-4 pl-11`} /></div>
        <button type="button" aria-expanded={isFilterOpen} aria-controls="event-filter-panel" onClick={() => { if (!isFilterOpen) { setDraft(filters); setFilterError(""); } setIsFilterOpen(current => !current); }} className={`inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${isFilterOpen || filterCount ? "border-[#ddcee9] bg-secondary text-secondary-foreground" : "border-[#eadfd8] bg-white text-secondary-foreground hover:bg-secondary/50"}`}><SlidersHorizontal className="size-4" aria-hidden="true" />Filter{filterCount > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-white" aria-label={`${filterCount} applied conditions`}>{filterCount}</span>}</button>
      </div>
      <form id="event-filter-panel" hidden={!isFilterOpen} onSubmit={applyFilters} className="mt-3 rounded-3xl border border-[#eadfd8] bg-white p-5 sm:p-6">
        <h2 className="font-semibold">Filter events</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div><label htmlFor="filter-category" className="text-xs font-semibold text-secondary-foreground">Category</label><select id="filter-category" value={draft.category} onChange={event => setDraft(current => ({ ...current, category: event.target.value }))} className={`${selectClass} mt-2 w-full`}><option value="">All categories</option>{categories.map(value => <option key={value}>{value}</option>)}</select></div>
          <div><label htmlFor="filter-city" className="text-xs font-semibold text-secondary-foreground">City</label><select id="filter-city" value={draft.city} onChange={event => setDraft(current => ({ ...current, city: event.target.value }))} className={`${selectClass} mt-2 w-full`}><option value="">All cities</option>{cities.map(value => <option key={value}>{value}</option>)}</select></div>
          <div><label htmlFor="filter-status" className="text-xs font-semibold text-secondary-foreground">Active status</label><select id="filter-status" value={draft.status} onChange={event => setDraft(current => ({ ...current, status: event.target.value }))} className={`${selectClass} mt-2 w-full`}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          {([{ key: "dateFrom", label: "Date from", type: "date" }, { key: "dateTo", label: "Date to", type: "date" }, { key: "minPrice", label: "Minimum price (₹)", type: "number" }, { key: "maxPrice", label: "Maximum price (₹)", type: "number" }] as const).map(({ key, label, type }) => (
            <div key={key}><label htmlFor={`filter-${key}`} className="text-xs font-semibold text-secondary-foreground">{label}</label><input id={`filter-${key}`} type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "0.01" : undefined} placeholder={type === "number" ? "Any price" : undefined} value={draft[key]} onChange={event => { setDraft(current => ({ ...current, [key]: event.target.value })); setFilterError(""); }} className={`${selectClass} mt-2 w-full`} /></div>
          ))}
        </div>
        {filterError && <p role="alert" className="mt-4 text-sm text-destructive">{filterError}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#eadfd8] pt-4 sm:flex sm:justify-end"><button type="button" onClick={clearFilters} className="min-h-12 rounded-full px-3 text-sm font-semibold text-secondary-foreground hover:bg-secondary sm:px-5">Clear filters</button><button type="submit" className="min-h-12 rounded-full bg-primary px-3 text-sm font-semibold text-white hover:bg-primary/90 sm:px-5">Apply filters</button></div>
      </form>
      {loading ? <p role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-secondary-foreground"><LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden="true" />Loading events…</p> : loadError ? <div role="alert" className="mt-6 rounded-3xl border border-[#eadfd8] bg-white p-6 text-center"><p className="text-sm leading-7 text-secondary-foreground">{loadError}</p><button type="button" onClick={() => void load()} className="mt-3 min-h-12 rounded-full px-5 text-sm font-semibold text-primary hover:bg-secondary">Try again</button></div> : <>
      <p className="mt-5 text-xs font-medium text-[#756477]">{filtered.length} events</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:hidden">
        {visibleEvents.map(event => (
          <article key={event.id} className="flex min-w-0 flex-col rounded-3xl border border-[#eadfd8] bg-white p-5">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl ${event.colour}`}>{event.emoji}</span>
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${event.colour}`}>{event.category}</span>
            </div>
            <h2 className="mt-4 text-lg font-semibold leading-7 wrap-anywhere"><Link href={`/admin/event/${event.id}`} className="rounded-md underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{event.title}</Link></h2>
            <dl className="mt-4 space-y-3 text-sm text-[#756477]">
              <div className="flex items-start gap-2"><dt className="shrink-0"><span className="sr-only">City</span><MapPin className="mt-0.5 size-4" aria-hidden="true" /></dt><dd className="min-w-0 wrap-anywhere">{event.city}</dd></div>
              <div className="flex items-start gap-2"><dt className="shrink-0"><span className="sr-only">Date and time</span><CalendarDays className="mt-0.5 size-4" aria-hidden="true" /></dt><dd className="min-w-0 leading-6">{dateFormat.format(new Date(event.date))}</dd></div>
            </dl>
            <div className="mt-auto flex items-center justify-between gap-3 pt-5">
              <p className="text-base font-semibold text-primary">{event.price ? priceFormat.format(event.price) : "Free"}</p>
              <div className="flex items-center gap-2"><span className="text-xs font-medium text-secondary-foreground">{event.active ? "Active" : "Inactive"}</span><ActiveSwitch title={event.title} active={event.active} disabled={savingId !== null} onToggle={() => void toggleEvent(event.id)} /></div>
            </div>
          </article>
        ))}
        {!filtered.length && <div className="rounded-3xl border border-dashed border-[#dfd4df] bg-white px-5 py-10 text-center sm:col-span-2"><CalendarDays className="mx-auto mb-4 size-8 text-secondary-foreground" aria-hidden="true" /><h2 className="text-lg font-semibold">{events.length ? "No events match just yet." : "Your first event starts here."}</h2><p className="mt-2 text-sm leading-6 text-[#756477]">{events.length ? "Try another search or clear your filters." : "Add an event to bring your community together."}</p><button onClick={() => { setSearch(""); clearFilters(); }} className="mt-4 min-h-12 rounded-full px-5 text-sm font-semibold text-primary hover:bg-secondary">Clear filters</button></div>}
      </div>
      <div className="mt-3 hidden overflow-hidden rounded-3xl border border-[#eadfd8] bg-white lg:block">
        <div role="region" aria-label="Events table, scroll horizontally on smaller screens" tabIndex={0} className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-primary">
          <table className="w-full min-w-[860px] text-left text-sm">
            <caption className="sr-only">All events and their active status</caption>
            <thead className="border-b border-[#eadfd8] bg-secondary/50 text-xs text-secondary-foreground"><tr>{["Event", "Category", "City", "Date", "Price", "Active"].map(heading => <th key={heading} scope="col" className="px-5 py-4 font-semibold">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#f0e7e1]">
              {visibleEvents.map(event => (
                <tr key={event.id} className="transition-colors hover:bg-background/70">
                  <th scope="row" className="min-w-56 max-w-80 px-5 py-5 font-semibold leading-6"><Link href={`/admin/event/${event.id}`} className="rounded-md underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{event.title}</Link></th>
                  <td className="px-5 py-5"><span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${event.colour}`}>{event.category}</span></td>
                  <td className="px-5 py-5 text-[#756477]">{event.city}</td>
                  <td className="whitespace-nowrap px-5 py-5 text-[#756477]">{dateFormat.format(new Date(event.date))}</td>
                  <td className="whitespace-nowrap px-5 py-5 font-semibold text-primary">{event.price ? priceFormat.format(event.price) : "Free"}</td>
                  <td className="px-5 py-3">
                    <ActiveSwitch title={event.title} active={event.active} disabled={savingId !== null} onToggle={() => void toggleEvent(event.id)} />
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={6} className="px-5 py-12 text-center"><CalendarDays className="mx-auto mb-4 size-8 text-secondary-foreground" aria-hidden="true" /><h2 className="text-lg font-semibold">{events.length ? "No events match just yet." : "Your first event starts here."}</h2><p className="mt-2 text-sm text-[#756477]">{events.length ? "Try another search or clear your filters." : "Add an event to bring your community together."}</p><button onClick={() => { setSearch(""); clearFilters(); }} className="mt-4 min-h-11 rounded-full px-5 text-sm font-semibold text-primary hover:bg-secondary">Clear filters</button></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <nav aria-label="Events pagination" className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-xs leading-6 text-[#756477]">{filtered.length ? `${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, filtered.length)}` : "0"} of {filtered.length} events</p>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous events page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#eadfd8] bg-white px-3 text-xs font-semibold text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-default disabled:opacity-40"><ChevronLeft className="size-4" aria-hidden="true" />Previous</button>
          <span className="px-1 text-xs text-[#756477]">{currentPage} / {totalPages}</span>
          <button type="button" aria-label="Next events page" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#eadfd8] bg-white px-3 text-xs font-semibold text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-default disabled:opacity-40">Next<ChevronRight className="size-4" aria-hidden="true" /></button>
        </div>
      </nav>
      </>}
      <AddUserDialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen} />
      <CategoriesDialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen} />
      {confirmationDialog}
    </>
  );
}
