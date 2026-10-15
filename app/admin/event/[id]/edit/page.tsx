import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { EditEvent } from "@/components/admin/edit-event";

export const metadata: Metadata = { title: "Edit event | Community Events Board" };

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  return <AdminShell loadingVariant="form"><EditEvent params={params} /></AdminShell>;
}
