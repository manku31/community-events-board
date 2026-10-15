import { Skeleton } from "@/components/ui/skeleton";

export function ProfileLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading your profile" className="min-h-dvh bg-background">
      <span className="sr-only">Loading your profile…</span>
      <header aria-hidden="true" className="border-b border-[#eadfd8]"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8 sm:py-5"><div className="flex items-center gap-3"><Skeleton className="size-10 rounded-2xl" /><Skeleton className="h-8 w-28" /></div><Skeleton className="size-12 rounded-2xl" /></div></header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
        <Skeleton className="mb-6 h-11 w-36 rounded-full" />
        <div className="overflow-hidden rounded-[2rem] border border-[#e2d6e8] bg-white"><div className="space-y-4 bg-secondary/60 px-6 pt-8 pb-20 sm:px-8"><Skeleton className="h-3 w-28" /><Skeleton className="h-10 w-40" /><Skeleton className="h-4 w-3/4 max-w-sm" /></div><div className="px-6 pb-8 sm:px-8"><Skeleton className="relative -mt-11 mb-4 size-24 rounded-[1.7rem] border-[5px] border-white" /><Skeleton className="h-8 w-48" /><Skeleton className="mt-3 h-4 w-56 max-w-full" /></div></div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]"><div className="space-y-6 rounded-3xl border border-[#eadfd8] bg-white p-6"><Skeleton className="h-6 w-4/5" />{[0, 1, 2, 3].map(index => <div key={index} className="flex gap-3"><Skeleton className="size-10 shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-5 w-3/4" /></div></div>)}</div><div className="space-y-5 self-start rounded-3xl border border-[#eadfd8] bg-[#fff4df] p-6"><Skeleton className="size-11" /><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-28" /><Skeleton className="h-5 w-36" /><Skeleton className="h-4 w-2/3" /></div></div>
      </main>
    </div>
  );
}
