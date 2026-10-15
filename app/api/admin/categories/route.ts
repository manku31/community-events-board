import type { NextRequest } from "next/server";
import { ApiError, successResponse } from "@/lib/api";
import { prisma } from "@/lib/db";
import { authorizeCategoryRequest, categoryFailure } from "@/lib/categories/http";
import { readAuthBody } from "@/lib/auth/http";
import { authFieldErrors } from "@/lib/validation/auth";
import { createCategorySchema } from "@/lib/validation/category";

export async function GET(request: NextRequest) {
  try {
    await authorizeCategoryRequest(request);
    const categories = await prisma.category.findMany({ orderBy: { id: "desc" } });
    return successResponse({ categories }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return categoryFailure(error, "list"); }
}

export async function POST(request: NextRequest) {
  try {
    await authorizeCategoryRequest(request);
    const parsed = createCategorySchema.safeParse(await readAuthBody(request));
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Please check the category details.", authFieldErrors(parsed.error));
    const category = await prisma.category.create({ data: parsed.data });
    return successResponse({ category }, { status: 201, message: "Category created", headers: { "Cache-Control": "no-store" } });
  } catch (error) { return categoryFailure(error, "create"); }
}
