import "server-only";
import type { Prisma } from "@/generated/prisma/client";

export function upcomingEventsWhere(now = new Date()): Prisma.EventWhereInput {
  const parts = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const part = (type: string) => parts.find(value => value.type === type)!.value;
  const date = new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00.000Z`);
  const time = new Date(`1970-01-01T${part("hour")}:${part("minute")}:${part("second")}.000Z`);
  return { status: true, category: { status: true }, OR: [{ date: { gt: date } }, { date, time: { gt: time } }] };
}
