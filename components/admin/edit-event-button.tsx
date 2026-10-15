import Link from "next/link";
import { Pencil } from "lucide-react";

export function EditEventButton({ eventId }: { eventId: number }) {
  return (
    <Link href={`/admin/event/${eventId}/edit`} className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:w-auto"><Pencil className="size-4" aria-hidden="true" /> Edit event</Link>
  );
}
