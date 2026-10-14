import assert from "node:assert/strict";
import { test } from "node:test";
import { signinSchema, signupSchema, signupFormSchema, authFieldErrors } from "../lib/validation/auth";
import { hashPassword, verifyPassword } from "../lib/auth/password";

test("credentials normalize email and preserve password whitespace", () => {
  const parsed = signinSchema.parse({ email: "  Person@Example.com ", password: " pass phrase " });
  assert.equal(parsed.email, "person@example.com");
  assert.equal(parsed.password, " pass phrase ");
});

test("signup rejects invalid email, weak password, mismatch and role injection", () => {
  for (const input of [
    { email: "bad", password: "good-password" },
    { email: "test@example.com", password: "short" },
    { email: "test@example.com", password: "good-password", confirmPassword: "different" },
    { email: "test@example.com", password: "good-password", role: "admin" },
  ]) assert.equal(signupSchema.safeParse(input).success, false);
  const missingConfirmation = signupFormSchema.safeParse({ email: "test@example.com", password: "good-password" });
  assert.equal(missingConfirmation.success, false);
  if (!missingConfirmation.success) assert.ok(authFieldErrors(missingConfirmation.error).confirmPassword);
});

test("signin validates required fields and bounded password length", () => {
  assert.equal(signinSchema.safeParse({ email: "", password: "" }).success, false);
  assert.equal(signinSchema.safeParse({ email: "test@example.com", password: "x".repeat(129) }).success, false);
});

test("password hashes are salted; correct passwords verify and wrong values fail", async () => {
  const password = "a long test password 🔑";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.ok(!first.includes(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("incorrect", first), false);
  assert.equal(await verifyPassword(password, undefined), false);
  assert.equal(await verifyPassword(password, "broken-hash"), false);
});
