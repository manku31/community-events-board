import type { NextRequest } from "next/server";
import { ApiError, handleApiError, successResponse } from "@/lib/api";
import { prisma } from "@/lib/db";
import { serializeEvent } from "@/lib/events/serialize";
import { upcomingEventsWhere } from "@/lib/events/upcoming";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) throw new ApiError(400, "INVALID_ID", "Choose a valid event.");
    const event = await prisma.event.findFirst({ where: { ...upcomingEventsWhere(), id: Number(id) }, include: { category: { select: { id: true, category: true } } } });
    if (!event) throw new ApiError(404, "NOT_FOUND", "This event is no longer available.");
    return successResponse({ event: serializeEvent(event) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const response = handleApiError(error);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
