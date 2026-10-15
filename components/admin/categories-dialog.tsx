"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, Layers3, LoaderCircle, Pencil, Plus, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventsTableSkeleton } from "@/components/admin/loading-skeletons";
import type { ApiResponse } from "@/lib/api/types";
import type { Category } from "@/lib/categories/types";
import { createCategorySchema } from "@/lib/validation/category";
import { useConfirmation } from "@/components/ui/confirmation-dialog";

const popupClass = "modal-popup fixed top-1/2 left-1/2 z-[60] max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-[#eadfd8] bg-background p-5 shadow-xl outline-none sm:p-7";
const closeClass = "absolute top-3 right-3 flex size-11 items-center justify-center rounded-full text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";
const formatDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

function CategoryFormDialog({ open, onOpenChange, onSaved, initial, onClosed }: { open: boolean; onOpenChange: (open: boolean) => void; onSaved: (category: Category) => void; initial?: Category; onClosed?: () => void }) {
  const { confirm, confirmationDialog } = useConfirmation();
  const pending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial?.category ?? "");
  const [status, setStatus] = useState(initial?.status ?? true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function changeOpen(next: boolean) {
    if (pending.current) return;
    onOpenChange(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const parsed = createCategorySchema.safeParse({ category: name, status });
    if (!parsed.success) { setError(parsed.error.issues[0].message); input.current?.focus(); return; }
    pending.current = true;
    if (initial && !await confirm({ description: `Rename “${initial.category}” to “${parsed.data.category}”?` })) {
      pending.current = false;
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(initial ? `/api/admin/categories/${initial.id}` : "/api/admin/categories", { method: initial ? "PATCH" : "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(initial ? { category: parsed.data.category } : parsed.data) });
      const body: ApiResponse<{ category: Category }> = await response.json();
      if (!response.ok || !body.success) { setError(!body.success ? body.error.message : "Couldn’t create this category. Please try again."); return; }
      onSaved(body.data.category);
      onOpenChange(false);
    } catch { setError("We couldn’t connect. Please try again."); }
    finally { pending.current = false; setBusy(false); }
  }

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen} onOpenChangeComplete={next => { if (!next) { setName(initial?.category ?? ""); setStatus(initial?.status ?? true); setError(""); onClosed?.(); } }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="modal-backdrop fixed inset-0 z-[60] bg-[#302033]/35 backdrop-blur-sm" />
        <Dialog.Popup className={`${popupClass} max-w-md`} initialFocus={input}>
          <Dialog.Close disabled={busy} aria-label={initial ? "Close edit category" : "Close add category"} className={closeClass}><X className="size-5" aria-hidden="true" /></Dialog.Close>
          <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">{initial ? <Pencil className="size-6" aria-hidden="true" /> : <Plus className="size-6" aria-hidden="true" />}</span>
          <Dialog.Title className="pr-8 text-2xl font-bold">{initial ? "Edit category" : "Add category"}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-7 text-[#756477]">{initial ? "Give this category a new name." : "A new category for your community’s good times."}</Dialog.Description>
          <form onSubmit={submit} noValidate aria-busy={busy} className="mt-6 space-y-5">
            <div><label htmlFor="category-name" className="text-sm font-semibold">Category name</label><input ref={input} id="category-name" value={name} onChange={event => { setName(event.target.value); setError(""); }} required maxLength={100} disabled={busy} placeholder="e.g. Music" aria-invalid={Boolean(error)} aria-describedby={error ? "category-create-error" : undefined} className="mt-2 h-12 w-full rounded-2xl border border-[#dfd4df] bg-white px-4 text-base outline-none focus:border-primary focus:ring-3 focus:ring-primary/10" /></div>
            {!initial && <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-[#eadfd8] bg-white p-4 text-sm font-medium"><input type="checkbox" checked={status} disabled={busy} onChange={async event => { const next = event.target.checked; if (await confirm({ description: `Set this category to ${next ? "active" : "inactive"}?` })) setStatus(next); }} className="size-4 accent-primary" />Active category</label>}
            {error && <p id="category-create-error" role="alert" className="text-sm leading-6 text-destructive">{error}</p>}
            <Button type="submit" disabled={busy} className="h-12 w-full rounded-full">{busy ? <><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" /> {initial ? "Saving…" : "Creating…"}</> : initial ? "Save changes" : "Create category"}</Button>
          </form>
          {confirmationDialog}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function CategoriesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { confirm, confirmationDialog } = useConfirmation();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [mutationError, setMutationError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const filteredItems = items.filter(item => item.category.toLowerCase().includes(nameFilter.trim().toLowerCase()) && (!statusFilter || item.status === (statusFilter === "active")));
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const filterCount = Number(Boolean(nameFilter.trim())) + Number(Boolean(statusFilter));
  const filterInputClass = "mt-2 h-12 w-full min-w-0 rounded-xl border border-[#dfd4df] bg-white px-3 text-base outline-none focus:border-primary focus:ring-3 focus:ring-primary/10";
  const mutationPending = useRef(false);
  const request = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/categories", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
      const body: ApiResponse<{ categories: Category[] }> = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || !body.success) { setError(!body.success ? body.error.message : "Couldn’t load categories."); return; }
      setItems(body.data.categories);
    } catch { if (!controller.signal.aborted) setError("We couldn’t load categories. Please try again."); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);

  useEffect(() => { if (open) void load(); return () => request.current?.abort(); }, [load, open]);

  function created(category: Category) {
    setPage(1);
    request.current?.abort();
    setItems(current => [category, ...current.filter(item => item.id !== category.id)]);
    // Refresh the full list, including any categories added by another admin.
    void load();
  }

  function renamed(category: Category) {
    setItems(current => current.map(item => item.id === category.id ? category : item));
    setMutationError("");
  }

  async function toggle(category: Category) {
    if (mutationPending.current) return;
    mutationPending.current = true;
    if (!await confirm({ description: `Make “${category.category}” ${category.status ? "inactive" : "active"}?` })) {
      mutationPending.current = false;
      return;
    }
    setSavingId(category.id);
    setMutationError("");
    setItems(current => current.map(item => item.id === category.id ? { ...item, status: !category.status } : item));
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: !category.status }) });
      const body: ApiResponse<{ category: Category }> = await response.json();
      if (!response.ok || !body.success) {
        setItems(current => current.map(item => item.id === category.id ? category : item));
        setMutationError(!body.success ? body.error.message : "Couldn’t update the category status. Please try again.");
        return;
      }
      setItems(current => current.map(item => item.id === category.id ? body.data.category : item));
    } catch {
      setItems(current => current.map(item => item.id === category.id ? category : item));
      setMutationError("Couldn’t save the status. Your change has been reverted. Please try again.");
    } finally { mutationPending.current = false; setSavingId(null); }
  }

  return (
    <Dialog.Root open={open} onOpenChange={next => { if (!createOpen && !editOpen && !mutationPending.current) onOpenChange(next); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="modal-backdrop fixed inset-0 z-50 bg-[#302033]/35 backdrop-blur-sm" />
        <Dialog.Popup className={`${popupClass} z-50 max-w-4xl`}>
          <Dialog.Close disabled={savingId !== null} aria-label="Close categories" className={closeClass}><X className="size-5" aria-hidden="true" /></Dialog.Close>
          <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"><Layers3 className="size-6" aria-hidden="true" /></span>
          <Dialog.Title className="pr-10 text-2xl font-bold">Categories</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-7 text-[#756477]">All the ways your community comes together.</Dialog.Description>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#756477]">{filteredItems.length} {filterCount ? `of ${items.length} ` : ""}categories</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" aria-expanded={filterOpen} aria-controls="category-filters" onClick={() => setFilterOpen(value => !value)} className="h-12 rounded-full px-4"><SlidersHorizontal className="size-4" aria-hidden="true" />Filter{filterCount > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">{filterCount}</span>}</Button>
              <Button disabled={savingId !== null} onClick={() => { setCreateOpen(true); setMutationError(""); }} className="h-12 rounded-full px-5"><Plus className="size-4" aria-hidden="true" />Add category</Button>
            </div>
          </div>
          <div id="category-filters" hidden={!filterOpen} className="mt-4 rounded-2xl border border-[#eadfd8] bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="category-name-filter" className="text-xs font-semibold text-secondary-foreground">Category name</label><input id="category-name-filter" value={nameFilter} onChange={event => { setNameFilter(event.target.value); setPage(1); }} placeholder="Search category name…" className={filterInputClass} /></div>
              <div><label htmlFor="category-active-filter" className="text-xs font-semibold text-secondary-foreground">Active status</label><select id="category-active-filter" value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1); }} className={filterInputClass}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            </div>
            <button type="button" onClick={() => { setNameFilter(""); setStatusFilter(""); setPage(1); }} className="mt-3 min-h-11 rounded-full px-3 text-xs font-semibold text-primary hover:bg-secondary">Clear filters</button>
          </div>
          {mutationError && <p role="alert" className="mt-4 rounded-xl bg-white p-4 text-sm leading-6 text-destructive">{mutationError}</p>}
          {loading ? <EventsTableSkeleton categories /> : error ? <div role="alert" className="mt-5 rounded-2xl bg-white p-5 text-sm leading-7"><p>{error}</p><button onClick={() => void load()} className="mt-2 min-h-11 rounded-full px-4 font-semibold text-primary hover:bg-secondary">Try again</button></div> : (
            <div className="mt-5 overflow-hidden rounded-2xl border border-[#eadfd8] bg-white">
              <div role="region" aria-label="Categories table" tabIndex={0} className="max-h-[45dvh] overflow-auto focus-visible:outline-2 focus-visible:outline-primary">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <caption className="sr-only">Saved categories with status and name editing</caption>
                  <thead className="sticky top-0 bg-secondary text-xs text-secondary-foreground"><tr>{["Category", "Active", "Created", "Edit"].map(label => <th key={label} scope="col" className="px-4 py-4 font-semibold">{label}</th>)}</tr></thead>
                  <tbody className="divide-y divide-[#f0e7e1]">
                    {visibleItems.map(item => <tr key={item.id}>
                      <th scope="row" className="max-w-60 px-4 py-4 font-semibold wrap-anywhere">{item.category}</th>
                      <td className="px-4 py-3"><button type="button" role="switch" aria-checked={item.status} aria-label={`Active status for ${item.category}`} aria-busy={savingId === item.id} disabled={savingId !== null} onClick={() => void toggle(item)} className="flex min-h-11 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"><span className={`inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors motion-reduce:transition-none ${item.status ? "bg-primary" : "bg-[#d8cbdc]"}`}><span className={`size-5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${item.status ? "translate-x-5" : "translate-x-0"}`} /></span><span className="text-xs text-secondary-foreground">{item.status ? "Active" : "Inactive"}</span>{savingId === item.id && <LoaderCircle className="size-3.5 motion-safe:animate-spin" aria-hidden="true" />}</button></td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-[#756477]">{formatDate.format(new Date(item.createdAt))}</td>
                      <td className="px-4 py-3"><button type="button" disabled={savingId !== null} aria-label={`Edit ${item.category}`} onClick={() => { setEditing(item); setEditOpen(true); setMutationError(""); }} className="flex size-11 items-center justify-center rounded-xl text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40"><Pencil className="size-4" aria-hidden="true" /></button></td>
                    </tr>)}
                    {!filteredItems.length && <tr><td colSpan={4} className="px-5 py-12 text-center"><p className="font-semibold">{items.length ? "No matching categories." : "No categories yet."}</p><p className="mt-2 text-sm text-[#756477]">{items.length ? "Try another name or active status." : "Add your first category to get started."}</p>{filterCount > 0 && <button type="button" onClick={() => { setNameFilter(""); setStatusFilter(""); setPage(1); }} className="mt-3 min-h-11 rounded-full px-4 text-xs font-semibold text-primary hover:bg-secondary">Clear filters</button>}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {!loading && !error && <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#756477]"><label htmlFor="category-page-size" className="flex items-center gap-2">Rows per page<select id="category-page-size" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }} className="min-h-11 rounded-xl border border-[#dfd4df] bg-white px-3 text-base outline-none focus:border-primary"><option value={5}>5</option><option value={10}>10</option></select></label><span aria-live="polite">{filteredItems.length ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filteredItems.length)}` : "0"} of {filteredItems.length}</span></div>
            <nav aria-label="Category pagination" className="flex items-center gap-2"><button type="button" aria-label="Previous categories page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#eadfd8] bg-white px-3 text-xs font-semibold text-secondary-foreground hover:bg-secondary disabled:cursor-default disabled:opacity-40"><ChevronLeft className="size-4" aria-hidden="true" />Previous</button><span className="text-xs text-[#756477]">{currentPage} / {totalPages}</span><button type="button" aria-label="Next categories page" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#eadfd8] bg-white px-3 text-xs font-semibold text-secondary-foreground hover:bg-secondary disabled:cursor-default disabled:opacity-40">Next<ChevronRight className="size-4" aria-hidden="true" /></button></nav>
          </div>}
          <CategoryFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={created} />
          {editing && <CategoryFormDialog key={editing.id} open={editOpen} initial={editing} onOpenChange={setEditOpen} onClosed={() => setEditing(null)} onSaved={renamed} />}
          {confirmationDialog}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
