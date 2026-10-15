"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ChevronDown, LoaderCircle, Pencil, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EventPreview, type EventPreviewValues } from "@/components/admin/event-preview";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import type { ApiResponse, FieldErrors } from "@/lib/api/types";
import type { EventRecord } from "@/lib/events/types";
import type { Category } from "@/lib/categories/types";
import { createEventSchema } from "@/lib/validation/event";
import { authFieldErrors } from "@/lib/validation/auth";

export function EventForm({ initial }: { initial?: EventRecord }) {
  const isEdit = Boolean(initial);
  const [categoryId, setCategoryId] = useState(initial ? String(initial.categoryId) : "");
  const { confirm, confirmationDialog } = useConfirmation();
  const formRef = useRef<HTMLFormElement>(null);
  const pending = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const categoryRequest = useRef<AbortController | null>(null);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<EventPreviewValues>({ title: initial?.title ?? "", category: initial?.category.category ?? "", city: initial?.city ?? "", date: initial?.date ?? "", time: initial?.time ?? "", price: initial?.price ?? "", description: initial?.description ?? "", imageUrl: initial?.image ?? "", status: initial?.status === false ? "inactive" : "active" });
  const inputClass = "mt-2 min-h-12 w-full min-w-0 rounded-2xl border border-[#dfd4df] bg-white px-4 py-3 text-base outline-none placeholder:text-[#9a8a9d] focus:border-primary focus:ring-3 focus:ring-primary/10 aria-invalid:border-destructive disabled:opacity-60";

  const loadCategories = useCallback(async () => {
    categoryRequest.current?.abort();
    const controller = new AbortController();
    categoryRequest.current = controller;
    setCategoriesLoading(true); setCategoriesError("");
    try {
      const response = await fetch("/api/admin/categories", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
      const body: ApiResponse<{ categories: Category[] }> = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || !body.success) { setCategoriesError(!body.success ? body.error.message : "Couldn’t load categories."); return; }
      setCategories(body.data.categories.filter(category => category.status || category.id === initial?.categoryId));
    } catch { if (!controller.signal.aborted) setCategoriesError("Couldn’t load categories. Please try again."); }
    finally { if (!controller.signal.aborted) setCategoriesLoading(false); }
  }, [initial?.categoryId]);

  useEffect(() => { void loadCategories(); return () => categoryRequest.current?.abort(); }, [loadCategories]);

  function showErrors(errors: FieldErrors) {
    setFieldErrors(errors);
    const field = ["title", "categoryId", "city", "date", "time", "price", "image", "description", "status"].find(key => errors[key]?.length);
    const element = field && formRef.current?.elements.namedItem(field === "image" ? "imageUrl" : field);
    if (element instanceof HTMLElement) element.focus();
  }

  function fieldError(field: string) {
    return fieldErrors[field]?.[0] && <p id={`event-${field}-error`} role="alert" className="mt-2 text-sm leading-6 text-destructive">{fieldErrors[field][0]}</p>;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || categoriesLoading || categoriesError || !categories.length) return;
    const data = new FormData(event.currentTarget);
    const parsed = createEventSchema.safeParse({
      title: data.get("title"), categoryId: Number(data.get("categoryId")), city: data.get("city"),
      date: data.get("date"), time: data.get("time"), price: data.get("price") === "" ? NaN : Number(data.get("price")),
      image: data.get("imageUrl"), description: data.get("description"), status: preview.status === "active",
    });
    setMessage("");
    if (!parsed.success) {
      const errors = authFieldErrors(parsed.error);
      if (data.get("price") === "") errors.price = ["Enter a price, or 0 for a free event."];
      showErrors(errors);
      return;
    }
    pending.current = true;
    if (initial && !await confirm({ description: `Save your changes to “${initial.title}”?` })) { pending.current = false; return; }
    setIsSubmitting(true); setFieldErrors({});
    let saved = false;
    try {
      const response = await fetch(initial ? `/api/admin/events/${initial.id}` : "/api/admin/events", { method: initial ? "PATCH" : "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const body: ApiResponse<{ event: { id: number } }> = await response.json();
      if (!response.ok || !body.success) {
        if (!body.success) { if (body.error.details) showErrors(body.error.details); setMessage(body.error.message); }
        else setMessage("Couldn’t save the event. Please try again.");
        return;
      }
      saved = true;
      window.location.replace(initial ? `/admin/event/${initial.id}` : "/admin");
    } catch { setMessage("Couldn’t connect. Please check your connection and try again."); }
    finally { if (!saved) { pending.current = false; setIsSubmitting(false); } }
  }

  function updatePreview(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    setPreview({
      title: String(data.get("title") ?? ""), category: categories.find(category => category.id === Number(data.get("categoryId")))?.category ?? "",
      city: String(data.get("city") ?? ""), date: String(data.get("date") ?? ""),
      time: String(data.get("time") ?? ""), price: String(data.get("price") ?? ""),
      description: String(data.get("description") ?? ""), imageUrl: String(data.get("imageUrl") ?? ""),
      status: preview.status,
    });
    setMessage("");
    const target = event.target as HTMLInputElement;
    if (target.name) setFieldErrors(current => ({ ...current, [target.name === "imageUrl" ? "image" : target.name]: [] }));
  }

  async function changeStatus(status: string) {
    if (pending.current || status === preview.status) return;
    if (await confirm({ description: `Set this event to ${status}?` })) {
      setPreview(current => ({ ...current, status }));
      setMessage("");
    }
  }

  return (
    <>
      <Link href="/admin" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-medium text-secondary-foreground hover:underline focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft className="size-4" aria-hidden="true" /> All events</Link>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{isEdit ? "Edit event" : "Add event"}</h1>
      <p className="mt-3 text-sm leading-7 text-[#756477]">{isEdit ? "Update the details and see your changes in the preview." : "Give your community something to look forward to."}</p>
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10">
      <form ref={formRef} noValidate aria-busy={isSubmitting} onSubmit={submit} onChange={updatePreview} className="min-w-0 overflow-hidden rounded-3xl border border-[#eadfd8] bg-white">
        <div className="flex items-center gap-3 border-b border-[#eadfd8] bg-secondary/50 px-5 py-5 sm:px-8">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-secondary-foreground"><Sparkles className="size-5" aria-hidden="true" /></span>
          <div><h2 className="font-semibold">The good-time details</h2><p className="mt-1 text-xs leading-5 text-[#756477]">A few details to help people find their next plan.</p></div>
        </div>
        <fieldset disabled={isSubmitting} className="min-w-0 space-y-7 p-5 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><label htmlFor="event-title" className="text-sm font-semibold">Event title</label><input id="event-title" name="title" defaultValue={initial?.title ?? ""} aria-invalid={Boolean(fieldErrors.title?.length)} aria-describedby={fieldErrors.title?.length ? "event-title-error" : undefined} required maxLength={200} placeholder="e.g. Under the stars: music night" className={inputClass} />{fieldError("title")}</div>
            <div><label htmlFor="event-category" className="text-sm font-semibold">Category</label><div className="relative mt-2" aria-busy={categoriesLoading}>{categoriesLoading && <Skeleton className="pointer-events-none absolute inset-0 z-10 rounded-2xl" />}<select id="event-category" name="categoryId" aria-invalid={Boolean(fieldErrors.categoryId?.length)} aria-describedby={fieldErrors.categoryId?.length ? "event-categoryId-error" : undefined} required value={categoryId} onChange={event => setCategoryId(event.target.value)} disabled={categoriesLoading || Boolean(categoriesError) || !categories.length} className={`${inputClass.replace("mt-2 ", "")} appearance-none pr-12`}><option value="" disabled>{categoriesLoading ? "Loading categories…" : "Choose a category"}</option>{categories.map(category => <option key={category.id} value={category.id}>{category.category}{category.status ? "" : " (inactive)"}</option>)}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-secondary-foreground" /></div>{fieldError("categoryId")}{categoriesError && <div role="alert" className="mt-2 text-sm leading-6 text-destructive">{categoriesError}<button type="button" onClick={() => void loadCategories()} className="ml-2 min-h-11 rounded-lg px-2 font-semibold underline">Retry</button></div>}{!categoriesLoading && !categoriesError && !categories.length && <p className="mt-2 text-sm leading-6 text-secondary-foreground">No active categories yet. <Link href="/admin" className="font-semibold underline">Add or activate one on the admin page</Link> first.</p>}</div>
            <div><label htmlFor="event-city" className="text-sm font-semibold">City</label><input id="event-city" name="city" defaultValue={initial?.city ?? ""} aria-invalid={Boolean(fieldErrors.city?.length)} aria-describedby={fieldErrors.city?.length ? "event-city-error" : undefined} required maxLength={100} placeholder="e.g. Coimbatore" className={inputClass} />{fieldError("city")}</div>
            <div><label htmlFor="event-date" className="text-sm font-semibold">Date</label><input id="event-date" name="date" defaultValue={initial?.date ?? ""} aria-invalid={Boolean(fieldErrors.date?.length)} aria-describedby={fieldErrors.date?.length ? "event-date-error" : undefined} type="date" required className={inputClass} />{fieldError("date")}</div>
            <div><label htmlFor="event-time" className="text-sm font-semibold">Time (IST)</label><input id="event-time" name="time" defaultValue={initial?.time ?? ""} aria-invalid={Boolean(fieldErrors.time?.length)} aria-describedby={fieldErrors.time?.length ? "event-time-error" : undefined} type="time" required className={inputClass} />{fieldError("time")}</div>
            <div><label htmlFor="event-price" className="text-sm font-semibold">Price (₹)</label><input id="event-price" name="price" defaultValue={initial?.price ?? ""} aria-invalid={Boolean(fieldErrors.price?.length)} aria-describedby={fieldErrors.price?.length ? "event-price-error" : undefined} type="number" inputMode="decimal" required min="0" step="0.01" placeholder="0" className={inputClass} />{fieldError("price")}<p className="mt-2 text-xs text-[#756477]">Enter 0 for a free event.</p></div>
            <div><label htmlFor="event-image" className="text-sm font-semibold">Image URL</label><input id="event-image" name="imageUrl" defaultValue={initial?.image ?? ""} aria-invalid={Boolean(fieldErrors.image?.length)} aria-describedby={fieldErrors.image?.length ? "event-image-error" : undefined} type="url" required placeholder="https://example.com/event.jpg" className={inputClass} />{fieldError("image")}</div>
            <div className="sm:col-span-2"><label htmlFor="event-description" className="text-sm font-semibold">Description</label><textarea id="event-description" name="description" defaultValue={initial?.description ?? ""} aria-invalid={Boolean(fieldErrors.description?.length)} aria-describedby={fieldErrors.description?.length ? "event-description-error" : undefined} required maxLength={5000} rows={5} placeholder="What’s happening? Tell people what they can look forward to." className={`${inputClass} resize-y leading-7`} />{fieldError("description")}</div>
          </div>
          <fieldset className="rounded-2xl border border-[#eadfd8] bg-background p-4 sm:p-5">
            <legend className="px-2 text-sm font-semibold">Event status</legend>
            <div className="flex flex-wrap gap-5">
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium"><input type="radio" name="status" value="active" checked={preview.status === "active"} onChange={() => void changeStatus("active")} className="size-4 accent-primary" />Active</label>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium"><input type="radio" name="status" value="inactive" checked={preview.status === "inactive"} onChange={() => void changeStatus("inactive")} className="size-4 accent-primary" />Inactive</label>
            </div>
            <p className="mt-1 text-xs leading-6 text-[#756477]">Active events appear to visitors. Keep it inactive until you’re ready.</p>
          </fieldset>
          {message && <p role="alert" className="rounded-2xl bg-secondary p-4 text-sm leading-7 text-secondary-foreground">{message}</p>}
          <div className="flex flex-col-reverse gap-3 border-t border-[#eadfd8] pt-6 sm:flex-row sm:justify-end">
            <Link href={initial ? `/admin/event/${initial.id}` : "/admin"} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#dfd4df] px-6 text-sm font-semibold text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary">Cancel</Link>
            <Button type="submit" disabled={isSubmitting || categoriesLoading || Boolean(categoriesError) || !categories.length} className="h-12 rounded-full px-6">{isSubmitting ? <><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" /> Saving event…</> : <>{isEdit ? <Pencil className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}{isEdit ? "Save changes" : "Add event"}</>}</Button>
          </div>
        </fieldset>
      </form>
      <EventPreview values={preview} />
      </div>
      {confirmationDialog}
    </>
  );
}
