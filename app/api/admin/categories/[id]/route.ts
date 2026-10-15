import type { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { ApiError, successResponse } from "@/lib/api";
import { prisma } from "@/lib/db";
import { readAuthBody } from "@/lib/auth/http";
import { authorizeCategoryRequest, categoryFailure } from "@/lib/categories/http";
import { authFieldErrors } from "@/lib/validation/auth";
import { updateCategorySchema } from "@/lib/validation/category";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authorizeCategoryRequest(request);
    const { id } = await params;
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) > 2147483647) throw new ApiError(400, "INVALID_ID", "Choose a valid category.");
    const parsed = updateCategorySchema.safeParse(await readAuthBody(request));
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Please check the category details.", authFieldErrors(parsed.error));
    const category = await prisma.category.update({ where: { id: Number(id) }, data: parsed.data });
    return successResponse({ category }, { message: "Category updated", headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return categoryFailure(new ApiError(404, "NOT_FOUND", "This category no longer exists."), "update");
    return categoryFailure(error, "update");
  }
}
