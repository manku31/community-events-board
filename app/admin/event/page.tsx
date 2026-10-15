import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { EventForm } from "@/components/admin/event-form";

export const metadata: Metadata = { title: "Add event | Community Events Board" };

export default function AddEventPage() {
  return <AdminShell loadingVariant="form"><EventForm /></AdminShell>;
}
