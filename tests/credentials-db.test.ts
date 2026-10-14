import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { verifyAccessToken } from "../lib/auth/jwt";
import { verifyPassword } from "../lib/auth/password";
import { POST as signup } from "../app/api/signup/route";
import { POST as signin } from "../app/api/signin/route";

const email = `credentials-test-${randomUUID()}@example.invalid`;
const password = "test password with spaces";

function request(path: string, data: unknown) {
  return new NextRequest(`http://localhost:3000/api/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
}

after(async () => {
  try { await prisma.user.deleteMany({ where: { email } }); }
  finally { await prisma.$disconnect(); }
});

test("signup creates a normal user, hashes the password and returns tokens", async () => {
  const response = await signup(request("signup", { email: ` ${email.toUpperCase()} `, password, confirmPassword: password }));
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.user.email, email);
  assert.equal(body.data.user.role, "user");
  assert.equal(body.data.user.password, undefined);
  assert.equal(body.data.refreshToken, undefined);
  assert.equal((await verifyAccessToken(body.data.accessToken)).userId, body.data.user.id);
  const cookies = response.headers.get("set-cookie") ?? "";
  assert.match(cookies, /accessToken=/);
  assert.match(cookies, /refreshToken=/);
  assert.match(cookies, /HttpOnly/);
  const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
  assert.notEqual(stored.password, password);
  assert.equal(await verifyPassword(password, stored.password), true);
});

test("duplicate normalized emails return a field-level conflict", async () => {
  const response = await signup(request("signup", { email: email.toUpperCase(), password }));
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.error.code, "EMAIL_IN_USE");
  assert.ok(body.error.details.email);
});

test("signin checks credentials and native clients receive both tokens", async () => {
  const response = await signin(request("signin", { email, password, client: "native" }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.data.accessToken);
  assert.ok(body.data.refreshToken);
  assert.equal(body.data.user.password, undefined);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("wrong passwords and unknown emails return the same generic credential error", async () => {
  const incorrect = await signin(request("signin", { email, password: "incorrect-password" }));
  const unknown = await signin(request("signin", { email: `unknown-${email}`, password }));
  assert.equal(incorrect.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(await incorrect.json(), await unknown.json());
});

test("signup and signin reject validation failures, role injection and malformed requests", async () => {
  const invalid = await signup(request("signup", { email: "invalid", password: "short", confirmPassword: "different" }));
  assert.equal(invalid.status, 422);
  const details = (await invalid.json()).error.details;
  assert.ok(details.email);
  assert.ok(details.password);
  assert.ok(details.confirmPassword);
  assert.equal((await signup(request("signup", { email, password, role: "admin" }))).status, 422);
  assert.equal((await signin(request("signin", { email, password: "" }))).status, 422);
  const malformed = new NextRequest("http://localhost/api/signin", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
  assert.equal((await signin(malformed)).status, 400);
  const crossOrigin = new NextRequest("http://localhost/api/signin", { method: "POST", headers: { Origin: "https://other.example", "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  assert.equal((await signin(crossOrigin)).status, 403);
});
