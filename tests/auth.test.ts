import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "../lib/api";
import { ACCESS_TOKEN_SECONDS, getJwtKey, TOKEN_AUDIENCE, TOKEN_ISSUER } from "../lib/auth/config";
import { createAccessToken, verifyAccessToken } from "../lib/auth/jwt";
import { generateRefreshToken, hashRefreshToken, isRefreshToken } from "../lib/auth/refresh-token";
import { clearRefreshCookie, setRefreshCookie } from "../lib/auth/cookies";
import { assertAuthOrigin } from "../lib/auth/origin";

process.env.JWT_SECRET = randomBytes(32).toString("hex");

test("origin checks preserve the original loopback host and reject other origins", () => {
  const url = "http://127.0.0.1:3000/api/signin";
  assert.doesNotThrow(() => assertAuthOrigin(new NextRequest(url, { headers: { Host: "127.0.0.1:3000", Origin: "http://127.0.0.1:3000" } }), true));
  assert.throws(() => assertAuthOrigin(new NextRequest(url, { headers: { Host: "127.0.0.1:3000", Origin: "https://other.example" } })), error => error instanceof ApiError && error.status === 403);
  assert.throws(() => assertAuthOrigin(new NextRequest(url), true), error => error instanceof ApiError && error.status === 403);
});

function unauthorized(error: unknown) {
  return error instanceof ApiError && error.status === 401 && error.code === "INVALID_ACCESS_TOKEN";
}

test("access JWT round-trip yields only the intended identity claims", async () => {
  const sessionId = randomUUID();
  const token = await createAccessToken({ id: 42, role: "user" }, sessionId);
  assert.deepEqual(await verifyAccessToken(token), { userId: 42, role: "user", sessionId });
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  assert.equal(payload.exp - payload.iat, ACCESS_TOKEN_SECONDS);
  assert.equal(payload.password, undefined);
});

test("tampered signatures and malformed tokens are rejected", async () => {
  const token = await createAccessToken({ id: 42, role: "user" }, randomUUID());
  const parts = token.split(".");
  parts[2] = (parts[2][0] === "A" ? "B" : "A") + parts[2].slice(1);
  await assert.rejects(verifyAccessToken(parts.join(".")), unauthorized);
  await assert.rejects(verifyAccessToken("not-a-jwt"), unauthorized);
});

test("expiry, audience, issuer, algorithm and token type are enforced", async () => {
  const now = Math.floor(Date.now() / 1000);
  const variants = [
    { exp: now - 1 },
    { aud: "other-api" },
    { iss: "other-app" },
    { alg: "HS384" },
    { tokenUse: "refresh" },
    { sub: "0" },
    { role: "" },
    { sid: "" },
  ];
  for (const variant of variants) {
    const token = await new SignJWT({ role: variant.role ?? "user", sid: variant.sid ?? randomUUID(), tokenUse: variant.tokenUse ?? "access" })
      .setProtectedHeader({ alg: variant.alg ?? "HS256", typ: "JWT" })
      .setSubject(variant.sub ?? "42")
      .setIssuedAt(now)
      .setExpirationTime(variant.exp ?? now + 900)
      .setIssuer(variant.iss ?? TOKEN_ISSUER)
      .setAudience(variant.aud ?? TOKEN_AUDIENCE)
      .sign(getJwtKey());
    await assert.rejects(verifyAccessToken(token), unauthorized);
  }
});

test("refresh tokens have independent random values and one-way stored hashes", () => {
  const first = generateRefreshToken();
  const second = generateRefreshToken();
  assert.ok(isRefreshToken(first));
  assert.ok(isRefreshToken(second));
  assert.notEqual(first, second);
  assert.match(hashRefreshToken(first), /^[a-f0-9]{64}$/);
  assert.notEqual(hashRefreshToken(first), first);
  assert.equal(hashRefreshToken(first), hashRefreshToken(first));
  for (const invalid of [null, "", "short", "a".repeat(1000), "!".repeat(43)]) assert.equal(isRefreshToken(invalid), false);
});

test("refresh cookie is HttpOnly, same-site and scoped; clearing uses the same path", () => {
  const response = new NextResponse();
  setRefreshCookie(response, generateRefreshToken(), new Date(Date.now() + 100_000));
  const cookie = response.headers.get("set-cookie") ?? "";
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=strict/i);
  assert.match(cookie, /Path=\/api\/auth/i);
  clearRefreshCookie(response);
  assert.match(response.headers.get("set-cookie") ?? "", /Max-Age=0/i);
  assert.match(response.headers.get("set-cookie") ?? "", /Path=\/api\/auth/i);
});
