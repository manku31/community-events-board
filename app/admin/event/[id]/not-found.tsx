import Link from "next/link";

export default function EventNotFound() {
  return <main className="flex min-h-dvh items-center justify-center bg-background px-4"><div className="max-w-md rounded-3xl border border-[#eadfd8] bg-white p-8 text-center"><h1 className="text-2xl font-bold">Event not found</h1><p className="mt-3 text-sm leading-7 text-secondary-foreground">This event isn’t available.</p><Link href="/admin" className="mt-5 inline-flex min-h-12 items-center rounded-full bg-primary px-6 text-sm font-semibold text-white">Back to all events</Link></div></main>;
}
