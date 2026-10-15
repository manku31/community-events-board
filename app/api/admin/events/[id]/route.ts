import type { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { ApiError, successResponse } from "@/lib/api";
import { authorizeAdminRequest } from "@/lib/auth/admin-request";
import { authFailure, readAuthBody } from "@/lib/auth/http";
import { prisma } from "@/lib/db";
import { serializeEvent } from "@/lib/events/serialize";
import { authFieldErrors } from "@/lib/validation/auth";

const statusSchema = z.strictObject({ status: z.boolean() });
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
    const parsed = statusSchema.safeParse(await readAuthBody(request));
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Choose a valid event status.", authFieldErrors(parsed.error));
    const event = await prisma.event.update({ where: { id }, data: parsed.data, include: { category: { select: { id: true, category: true } } } });
    return successResponse({ event: serializeEvent(event) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return authFailure(new ApiError(404, "NOT_FOUND", "Event not found."));
    return authFailure(error);
  }
}
