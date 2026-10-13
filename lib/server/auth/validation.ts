import "server-only";
import { z } from "zod";
import { VALIDATION } from "../errors";

export const credentialsSchema = z.strictObject({
  email: z.string({ error: VALIDATION.email }).trim().toLowerCase()
    .max(254, VALIDATION.email).email(VALIDATION.email),
  password: z.string({ error: VALIDATION.password })
    .min(12, VALIDATION.password).max(128, VALIDATION.password),
});

export const refreshSchema = z.strictObject({
  refreshToken: z.string({ error: VALIDATION.refreshToken })
    .regex(/^[A-Za-z0-9_-]{64}$/, VALIDATION.refreshToken),
});

export type Credentials = z.infer<typeof credentialsSchema>;
