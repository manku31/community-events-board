import { Skeleton } from "@/components/ui/skeleton";
import { BrowseCardsSkeleton } from "./events-browser";

export function HomeLoading() {
  return <div className="min-h-dvh bg-background"><header aria-hidden="true" className="border-b border-[#eadfd8]"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8 sm:py-5"><Skeleton className="h-10 w-40" /><Skeleton className="size-12 rounded-2xl" /></div></header><main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10"><div className="space-y-5 rounded-[2rem] bg-secondary/60 p-6 sm:p-10"><Skeleton className="h-7 w-60 max-w-full rounded-full" /><Skeleton className="h-12 w-3/4 max-w-lg" /><Skeleton className="h-12 w-2/3 max-w-md" /><Skeleton className="h-4 w-3/4 max-w-lg" /><Skeleton className="h-12 w-44 rounded-full" /></div><Skeleton className="mt-10 h-8 w-64 max-w-full" /><Skeleton className="mt-6 mb-6 h-16 w-full rounded-3xl" /><BrowseCardsSkeleton /></main></div>;
}
