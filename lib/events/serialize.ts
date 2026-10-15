import "server-only";
import type { Prisma } from "@/generated/prisma/client";

type EventWithCategory = Prisma.EventGetPayload<{ include: { category: { select: { id: true; category: true } } } }>;

export function serializeEvent(event: EventWithCategory) {
  return { ...event, date: event.date.toISOString().slice(0, 10), time: event.time.toISOString().slice(11, 16), price: event.price.toFixed(2), createdAt: event.createdAt.toISOString(), updatedAt: event.updatedAt.toISOString() };
}
