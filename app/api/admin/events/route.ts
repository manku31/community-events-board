import type { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { ApiError, successResponse } from "@/lib/api";
import { authorizeAdminRequest } from "@/lib/auth/admin-request";
import { authFailure, readAuthBody } from "@/lib/auth/http";
import { prisma } from "@/lib/db";
import { authFieldErrors } from "@/lib/validation/auth";
import { createEventSchema } from "@/lib/validation/event";
import { serializeEvent } from "@/lib/events/serialize";

export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request);
    const events = await prisma.event.findMany({ include: { category: { select: { id: true, category: true } } }, orderBy: [{ date: "asc" }, { time: "asc" }, { id: "asc" }] });
    return successResponse({ events: events.map(serializeEvent) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return authFailure(error); }
}

function invalidCategory() {
  return new ApiError(422, "VALIDATION_ERROR", "Choose an existing active category.", { categoryId: ["Choose an existing active category."] });
}

export async function POST(request: NextRequest) {
  try {
    await authorizeAdminRequest(request);
    const parsed = createEventSchema.safeParse(await readAuthBody(request));
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Please check the event details.", authFieldErrors(parsed.error));
    const input = parsed.data;
    const event = await prisma.$transaction(async tx => {
      const category = await tx.category.findUnique({ where: { id: input.categoryId }, select: { status: true } });
      if (!category?.status) throw invalidCategory();
      return tx.event.create({
        data: {
          ...input,
          date: new Date(`${input.date}T00:00:00.000Z`),
          time: new Date(`1970-01-01T${input.time}:00.000Z`),
          price: new Prisma.Decimal(input.price),
        },
        include: { category: { select: { id: true, category: true } } },
      });
    }, { timeout: 20_000 });
    return successResponse({ event: serializeEvent(event) }, { status: 201, message: "Event created", headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return authFailure(invalidCategory());
    if (!(error instanceof ApiError)) {
      const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
      console.error("Event creation failed", { type: error instanceof Error ? error.name : "UnknownError", ...(code ? { code } : {}) });
    }
    return authFailure(error);
  }
}
