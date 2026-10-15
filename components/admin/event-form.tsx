"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ChevronDown, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventPreview, type EventPreviewValues } from "@/components/admin/event-preview";
import { useConfirmation } from "@/components/ui/confirmation-dialog";

export function EventForm() {
  const { confirm, confirmationDialog } = useConfirmation();
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<EventPreviewValues>({ title: "", category: "", city: "", date: "", time: "", price: "", description: "", imageUrl: "", status: "active" });
  const inputClass = "mt-2 min-h-12 w-full min-w-0 rounded-2xl border border-[#dfd4df] bg-white px-4 py-3 text-base outline-none placeholder:text-[#9a8a9d] focus:border-primary focus:ring-3 focus:ring-primary/10";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Your details are ready. This is a UI preview, so the event hasn’t been saved yet.");
  }

  function updatePreview(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    setPreview({
      title: String(data.get("title") ?? ""), category: String(data.get("category") ?? ""),
      city: String(data.get("city") ?? ""), date: String(data.get("date") ?? ""),
      time: String(data.get("time") ?? ""), price: String(data.get("price") ?? ""),
      description: String(data.get("description") ?? ""), imageUrl: String(data.get("imageUrl") ?? ""),
      status: preview.status,
    });
    setMessage("");
  }

  async function changeStatus(status: string) {
    if (status === preview.status) return;
    if (await confirm({ description: `Set this event to ${status}?` })) {
      setPreview(current => ({ ...current, status }));
      setMessage("");
    }
  }

  return (
    <>
      <Link href="/admin" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-medium text-secondary-foreground hover:underline focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft className="size-4" aria-hidden="true" /> All events</Link>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Add event</h1>
      <p className="mt-3 text-sm leading-7 text-[#756477]">Give your community something to look forward to.</p>
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10">
      <form onSubmit={submit} onChange={updatePreview} className="min-w-0 overflow-hidden rounded-3xl border border-[#eadfd8] bg-white">
        <div className="flex items-center gap-3 border-b border-[#eadfd8] bg-secondary/50 px-5 py-5 sm:px-8">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-secondary-foreground"><Sparkles className="size-5" aria-hidden="true" /></span>
          <div><h2 className="font-semibold">The good-time details</h2><p className="mt-1 text-xs leading-5 text-[#756477]">A few details to help people find their next plan.</p></div>
        </div>
        <div className="space-y-7 p-5 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><label htmlFor="event-title" className="text-sm font-semibold">Event title</label><input id="event-title" name="title" required maxLength={200} placeholder="e.g. Under the stars: music night" className={inputClass} /></div>
            <div><label htmlFor="event-category" className="text-sm font-semibold">Category</label><div className="relative mt-2"><select id="event-category" name="category" required defaultValue="" className={`${inputClass.replace("mt-2 ", "")} appearance-none pr-12`}><option value="" disabled>Choose a category</option>{["Music", "Workshop", "Food", "Sports", "Kids"].map(category => <option key={category}>{category}</option>)}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-secondary-foreground" /></div></div>
            <div><label htmlFor="event-city" className="text-sm font-semibold">City</label><input id="event-city" name="city" required maxLength={100} placeholder="e.g. Coimbatore" className={inputClass} /></div>
            <div><label htmlFor="event-date" className="text-sm font-semibold">Date</label><input id="event-date" name="date" type="date" required className={inputClass} /></div>
            <div><label htmlFor="event-time" className="text-sm font-semibold">Time (IST)</label><input id="event-time" name="time" type="time" required className={inputClass} /></div>
            <div><label htmlFor="event-price" className="text-sm font-semibold">Price (₹)</label><input id="event-price" name="price" type="number" inputMode="decimal" required min="0" step="0.01" placeholder="0" className={inputClass} /><p className="mt-2 text-xs text-[#756477]">Enter 0 for a free event.</p></div>
            <div><label htmlFor="event-image" className="text-sm font-semibold">Image URL</label><input id="event-image" name="imageUrl" type="url" required placeholder="https://example.com/event.jpg" className={inputClass} /></div>
            <div className="sm:col-span-2"><label htmlFor="event-description" className="text-sm font-semibold">Description</label><textarea id="event-description" name="description" required maxLength={5000} rows={5} placeholder="What’s happening? Tell people what they can look forward to." className={`${inputClass} resize-y leading-7`} /></div>
          </div>
          <fieldset className="rounded-2xl border border-[#eadfd8] bg-background p-4 sm:p-5">
            <legend className="px-2 text-sm font-semibold">Event status</legend>
            <div className="flex flex-wrap gap-5">
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium"><input type="radio" name="status" value="active" checked={preview.status === "active"} onChange={() => void changeStatus("active")} className="size-4 accent-primary" />Active</label>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium"><input type="radio" name="status" value="inactive" checked={preview.status === "inactive"} onChange={() => void changeStatus("inactive")} className="size-4 accent-primary" />Inactive</label>
            </div>
            <p className="mt-1 text-xs leading-6 text-[#756477]">Active events appear to visitors. Keep it inactive until you’re ready.</p>
          </fieldset>
          <p className="text-xs leading-6 text-[#756477]">UI preview — submitting this form won’t save an event yet.</p>
          {message && <p role="status" className="rounded-2xl bg-secondary p-4 text-sm leading-7 text-secondary-foreground">{message}</p>}
          <div className="flex flex-col-reverse gap-3 border-t border-[#eadfd8] pt-6 sm:flex-row sm:justify-end">
            <Link href="/admin" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#dfd4df] px-6 text-sm font-semibold text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary">Cancel</Link>
            <Button type="submit" className="h-12 rounded-full px-6"><Plus className="size-4" aria-hidden="true" /> Add event</Button>
          </div>
        </div>
      </form>
      <EventPreview values={preview} />
      </div>
      {confirmationDialog}
    </>
  );
}
