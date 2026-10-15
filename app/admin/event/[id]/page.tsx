import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { EventDetails } from "@/components/admin/event-details";

export const metadata: Metadata = { title: "Event details | Community Events Board" };

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return <AdminShell><EventDetails params={params} /></AdminShell>;
}
