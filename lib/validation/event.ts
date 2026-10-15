import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date in YYYY-MM-DD format.").refine(value => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !value.startsWith("0000-") && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Choose a valid calendar date.");

export const createEventSchema = z.strictObject({
  title: z.string().trim().min(1, "Enter the event title.").max(200, "Use no more than 200 characters for the title."),
  categoryId: z.number().int().positive("Choose a category.").max(2147483647),
  city: z.string().trim().min(1, "Enter the city.").max(100, "Use no more than 100 characters for the city."),
  date,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a valid time in HH:mm format."),
  price: z.number().finite().min(0, "Price cannot be negative.").max(9999999999.99, "Price is too large.").refine(value => /^\d+(\.\d{1,2})?$/.test(String(value)), "Use no more than two decimal places for the price."),
  image: z.string().trim().min(1, "Enter the image URL.").max(2048, "Image URL is too long.").pipe(z.url({ protocol: /^https?$/, message: "Enter a valid HTTP or HTTPS image URL." })),
  description: z.string().trim().min(1, "Enter the event description.").max(5000, "Use no more than 5000 characters for the description."),
  status: z.boolean().default(true),
});
