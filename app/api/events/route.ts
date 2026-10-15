import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, handleApiError, successResponse } from "@/lib/api";
import { prisma } from "@/lib/db";
import { serializeEvent } from "@/lib/events/serialize";
import { upcomingEventsWhere } from "@/lib/events/upcoming";
import { authFieldErrors } from "@/lib/validation/auth";

const querySchema = z.strictObject({
  search: z.string().trim().max(200).optional(), city: z.string().trim().max(100).optional(),
  categoryId: z.coerce.number().int().positive().max(2147483647).optional(),
  page: z.coerce.number().int().positive().max(1000000).default(1),
  pageSize: z.coerce.number().int().min(1).max(24).default(6),
});

export async function GET(request: NextRequest) {
  try {
    const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Please check your filters.", authFieldErrors(parsed.error));
    const { search, city, categoryId, page, pageSize } = parsed.data;
    const base = upcomingEventsWhere();
    const where = { ...base, ...(categoryId ? { categoryId } : {}), ...(city ? { city: { equals: city, mode: "insensitive" as const } } : {}), ...(search ? { AND: [{ OR: [{ title: { contains: search, mode: "insensitive" as const } }, { description: { contains: search, mode: "insensitive" as const } }] }] } : {}) };
    const result = await prisma.$transaction(async tx => {
      const total = await tx.event.count({ where });
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const currentPage = Math.min(page, totalPages);
      const events = await tx.event.findMany({ where, include: { category: { select: { id: true, category: true } } }, orderBy: [{ date: "asc" }, { time: "asc" }, { id: "asc" }], skip: (currentPage - 1) * pageSize, take: pageSize });
      const categories = await tx.category.findMany({ where: { status: true }, select: { id: true, category: true }, orderBy: { category: "asc" } });
      const cities = await tx.event.findMany({ where: base, distinct: ["city"], select: { city: true }, orderBy: { city: "asc" } });
      return { events: events.map(serializeEvent), categories, cities: cities.map(item => item.city), pagination: { page: currentPage, pageSize, total, totalPages } };
    }, { timeout: 20000 });
    return successResponse(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const response = handleApiError(error);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
