import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { EventsBoard } from "@/components/admin/events-board";

export const metadata: Metadata = { title: "All events | Community Events Board" };

export default function AdminPage() {
  return <AdminShell><EventsBoard /></AdminShell>;
}
