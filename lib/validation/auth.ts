import { z } from "zod";

const email = z.string().trim().min(1, "Enter your email address.").max(254, "Email address is too long.").pipe(z.email("Enter a valid email address.")).transform(value => value.toLowerCase());
const password = z.string().min(1, "Enter your password.").max(128, "Use no more than 128 characters.");
const client = z.enum(["browser", "native"]).default("browser");

export const signinSchema = z.strictObject({ email, password, client });
export const signupSchema = z.strictObject({
  email,
  password: password.min(8, "Use at least 8 characters for your password."),
  confirmPassword: z.string().optional(),
  client,
}).refine(value => value.confirmPassword === undefined || value.password === value.confirmPassword, {
  path: ["confirmPassword"], message: "Passwords don’t match. Please try again.",
});

export const signupFormSchema = signupSchema.refine(value => Boolean(value.confirmPassword), {
  path: ["confirmPassword"], message: "Please confirm your password.",
});

export function authFieldErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    (errors[field] ??= []).push(issue.message);
  }
  return errors;
}
