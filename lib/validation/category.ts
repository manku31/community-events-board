import { z } from "zod";

export const createCategorySchema = z.strictObject({
  category: z.string().trim().min(1, "Enter a category name.").max(100, "Use no more than 100 characters."),
  status: z.boolean().default(true),
});

export const updateCategorySchema = z.strictObject({
  category: createCategorySchema.shape.category.optional(),
  status: z.boolean().optional(),
}).refine(value => value.category !== undefined || value.status !== undefined, {
  message: "Provide a category name or status to update.",
});
