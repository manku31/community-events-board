import type { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { ApiError, successResponse } from "@/lib/api";
import { authorizeAdminRequest } from "@/lib/auth/admin-request";
import { authFailure, readAuthBody } from "@/lib/auth/http";
import { prisma } from "@/lib/db";
import { serializeEvent } from "@/lib/events/serialize";
import { authFieldErrors } from "@/lib/validation/auth";
import { updateEventSchema } from "@/lib/validation/event";

type Context = { params: Promise<{ id: string }> };
async function eventId(context: Context) {
  const { id } = await context.params;
  if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) throw new ApiError(400, "INVALID_ID", "Choose a valid event.");
  return Number(id);
}

export async function GET(request: NextRequest, context: Context) {
  try {
    await authorizeAdminRequest(request);
    const event = await prisma.event.findUnique({ where: { id: await eventId(context) }, include: { category: { select: { id: true, category: true } } } });
    if (!event) throw new ApiError(404, "NOT_FOUND", "Event not found.");
    return successResponse({ event: serializeEvent(event) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return authFailure(error); }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    await authorizeAdminRequest(request);
    const id = await eventId(context);
    const parsed = updateEventSchema.safeParse(await readAuthBody(request));
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Please check the event details.", authFieldErrors(parsed.error));
    const input = parsed.data;
    const event = await prisma.$transaction(async tx => {
      const existing = await tx.event.findUnique({ where: { id }, select: { categoryId: true } });
      if (!existing) throw new ApiError(404, "NOT_FOUND", "Event not found.");
      if (input.categoryId !== undefined && input.categoryId !== existing.categoryId) {
        const category = await tx.category.findUnique({ where: { id: input.categoryId }, select: { status: true } });
        if (!category?.status) throw new ApiError(422, "VALIDATION_ERROR", "Choose an existing active category.", { categoryId: ["Choose an existing active category."] });
      }
      return tx.event.update({ where: { id }, data: {
        ...input,
        ...(input.date !== undefined ? { date: new Date(`${input.date}T00:00:00.000Z`) } : {}),
        ...(input.time !== undefined ? { time: new Date(`1970-01-01T${input.time}:00.000Z`) } : {}),
        ...(input.price !== undefined ? { price: new Prisma.Decimal(input.price) } : {}),
      }, include: { category: { select: { id: true, category: true } } } });
    }, { timeout: 20_000 });
    return successResponse({ event: serializeEvent(event) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return authFailure(new ApiError(404, "NOT_FOUND", "Event not found."));
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return authFailure(new ApiError(422, "VALIDATION_ERROR", "Choose an existing active category.", { categoryId: ["Choose an existing active category."] }));
    return authFailure(error);
  }
}
