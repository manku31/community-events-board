import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export type AdminLoadingVariant = "events" | "form" | "details";

function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return <div role="status" aria-label={label} aria-busy="true"><span className="sr-only">{label}</span>{children}</div>;
}

function CardSkeleton({ horizontal = false }: { horizontal?: boolean }) {
  return <div className={`overflow-hidden rounded-3xl border border-[#eadfd8] bg-white ${horizontal ? "md:grid md:grid-cols-[1fr_1.2fr]" : ""}`}>
    <Skeleton className={`aspect-[4/3] rounded-none ${horizontal ? "md:aspect-auto md:min-h-96" : ""}`} />
    <div className="space-y-5 p-5 sm:p-6"><div className="flex gap-2"><Skeleton className="h-7 w-20 rounded-full" /><Skeleton className="h-7 w-16 rounded-full" /></div><Skeleton className="h-7 w-5/6" /><Skeleton className="h-7 w-3/5" /><div className="space-y-3">{["w-2/3", "w-3/4", "w-1/2"].map(width => <Skeleton key={width} className={`h-4 ${width}`} />)}</div><div className="space-y-2 border-t border-[#eadfd8] pt-5"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-5/6" /><Skeleton className="h-3 w-2/3" /></div><div className="border-t border-dashed border-[#eadfd8] pt-5"><Skeleton className="h-7 w-24" /></div></div>
  </div>;
}

export function EventsTableSkeleton({ categories = false }: { categories?: boolean }) {
  return <LoadingRegion label={categories ? "Loading categories…" : "Loading events…"}>
    {!categories && <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:hidden">{[0, 1, 2, 3].map(index => <div key={index} className="space-y-4 rounded-3xl border border-[#eadfd8] bg-white p-5"><Skeleton className="h-10 w-24" /><Skeleton className="h-6 w-5/6" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-3/4" /><div className="flex justify-between pt-2"><Skeleton className="h-6 w-20" /><Skeleton className="h-7 w-12 rounded-full" /></div></div>)}</div>}
    <div className={`mt-5 overflow-hidden rounded-3xl border border-[#eadfd8] bg-white ${categories ? "" : "hidden lg:block"}`}>
      <div aria-hidden="true" className="overflow-x-auto"><div className={categories ? "min-w-[480px]" : "min-w-[860px]"}><div className={`grid gap-5 bg-secondary/60 px-5 py-4 ${categories ? "grid-cols-4" : "grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1fr]"}`}>{Array.from({ length: categories ? 4 : 6 }, (_, index) => <Skeleton key={index} className="h-3 w-3/4 bg-[#d9cbe3]" />)}</div>{Array.from({ length: 5 }, (_, index) => <div key={index} className={`grid items-center gap-5 border-t border-[#f0e7e1] px-5 py-5 ${categories ? "grid-cols-4" : "grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1fr]"}`}>{Array.from({ length: categories ? 4 : 6 }, (_, column) => <Skeleton key={column} className={column === 1 ? "h-7 w-14 rounded-full" : "h-4 w-4/5"} />)}</div>)}</div></div>
    </div>
    <div className="mt-5 flex justify-between gap-4"><Skeleton className="h-4 w-28" /><Skeleton className="h-11 w-44 rounded-xl" /></div>
  </LoadingRegion>;
}

function EventsPageContent() {
  return <><div className="flex flex-wrap justify-between gap-5"><div className="space-y-3"><Skeleton className="h-9 w-40" /><Skeleton className="h-4 w-56" /></div><div className="flex gap-3"><Skeleton className="h-12 w-24 rounded-full" /><Skeleton className="h-12 w-24 rounded-full" /><Skeleton className="hidden h-12 w-28 rounded-full sm:block" /></div></div><div className="mt-6 flex gap-3"><Skeleton className="h-12 flex-1 rounded-2xl" /><Skeleton className="h-12 w-24 rounded-2xl" /></div><EventsTableSkeleton /></>;
}

export function EventFormSkeleton() {
  return <LoadingRegion label="Loading event form…"><Skeleton className="mb-5 h-10 w-28" /><Skeleton className="h-9 w-44" /><Skeleton className="mt-3 h-4 w-3/4 max-w-sm" /><div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10"><div className="overflow-hidden rounded-3xl border border-[#eadfd8] bg-white"><div className="flex items-center gap-3 bg-secondary/50 p-5 sm:px-8"><Skeleton className="size-10 bg-[#d9cbe3]" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-4/5" /></div></div><div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-8">{Array.from({ length: 7 }, (_, index) => <div key={index} className={`space-y-2 ${index === 0 ? "sm:col-span-2" : ""}`}><Skeleton className="h-3 w-20" /><Skeleton className="h-12 w-full rounded-2xl" /></div>)}<div className="space-y-2 sm:col-span-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-32 w-full rounded-2xl" /></div><Skeleton className="h-28 sm:col-span-2" /><div className="flex justify-end gap-3 sm:col-span-2"><Skeleton className="h-12 w-24 rounded-full" /><Skeleton className="h-12 w-32 rounded-full" /></div></div></div><div className="rounded-[2rem] bg-secondary/50 p-5"><Skeleton className="mb-5 h-4 w-40" /><CardSkeleton /></div></div></LoadingRegion>;
}

export function EventDetailsSkeleton() {
  return <LoadingRegion label="Loading event details…"><div className="mx-auto max-w-5xl"><Skeleton className="mb-5 h-10 w-28" /><div className="mb-6 flex justify-between gap-4"><Skeleton className="h-5 w-24" /><Skeleton className="h-12 w-36 rounded-full" /></div><div className="rounded-[2rem] bg-secondary/50 p-5"><Skeleton className="mb-5 h-4 w-40" /><CardSkeleton horizontal /></div></div></LoadingRegion>;
}

export function AdminPageSkeleton({ variant = "events" }: { variant?: AdminLoadingVariant }) {
  return <div className="flex min-h-dvh flex-col bg-background"><header aria-hidden="true" className="border-b border-[#eadfd8]"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8 sm:py-5"><div className="flex items-center gap-3"><Skeleton className="size-10 rounded-2xl" /><div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-20" /></div></div><Skeleton className="size-12 rounded-2xl" /></div></header><main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-10">{variant === "form" ? <EventFormSkeleton /> : variant === "details" ? <EventDetailsSkeleton /> : <EventsPageContent />}</main></div>;
}
