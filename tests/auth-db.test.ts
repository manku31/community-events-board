import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { ApiError } from "../lib/api";
import { issueAuthTokens, revokeRefreshSession, rotateRefreshToken } from "../lib/auth/session";
import { hashRefreshToken } from "../lib/auth/refresh-token";
import { verifyAccessToken } from "../lib/auth/jwt";
import { requireAdmin, requireUser } from "../lib/auth/guards";
import { POST } from "../app/api/auth/refresh/route";

let userId: number;
const email = `token-test-${randomUUID()}@example.invalid`;

before(async () => {
  const user = await prisma.user.create({ data: { email, password: "!test-only-unusable-password", role: "user" } });
  userId = user.id;
});

after(async () => {
  try {
    if (userId) await prisma.user.deleteMany({ where: { id: userId, email } });
  } finally { await prisma.$disconnect(); }
});

function refreshDenied(error: unknown) {
  return error instanceof ApiError && error.code === "INVALID_REFRESH_TOKEN" && error.status === 401;
}

function nativeRequest(token: string) {
  return new NextRequest("http://localhost:3000/api/auth/refresh", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: token }),
  });
}

test("issued tokens store only hashes and rotation preserves the session deadline", async () => {
  const initial = await issueAuthTokens(userId);
  const stored = await prisma.refreshToken.findUniqueOrThrow({ where: { tokenHash: hashRefreshToken(initial.refreshToken) } });
  assert.notEqual(stored.tokenHash, initial.refreshToken);
  const rotated = await rotateRefreshToken(initial.refreshToken);
  assert.notEqual(rotated.refreshToken, initial.refreshToken);
  assert.equal(rotated.refreshExpiresAt.getTime(), initial.refreshExpiresAt.getTime());
  const claims = await verifyAccessToken(rotated.accessToken);
  assert.equal(claims.userId, userId);
  assert.equal(claims.sessionId, stored.familyId);
});

test("reusing a consumed token commits revocation of its replacement", async () => {
  const initial = await issueAuthTokens(userId);
  const rotated = await rotateRefreshToken(initial.refreshToken);
  await assert.rejects(rotateRefreshToken(initial.refreshToken), refreshDenied);
  await assert.rejects(rotateRefreshToken(rotated.refreshToken), refreshDenied);
});

test("concurrent refreshes cannot both succeed and revoke the winning replacement", async () => {
  const initial = await issueAuthTokens(userId);
  const results = await Promise.allSettled([rotateRefreshToken(initial.refreshToken), rotateRefreshToken(initial.refreshToken)]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  const winner = results.find(result => result.status === "fulfilled");
  assert.ok(winner && winner.status === "fulfilled");
  await assert.rejects(rotateRefreshToken(winner.value.refreshToken), refreshDenied);
});

test("expired and explicitly revoked sessions cannot refresh", async () => {
  const expired = await issueAuthTokens(userId);
  await prisma.refreshToken.update({ where: { tokenHash: hashRefreshToken(expired.refreshToken) }, data: { expiresAt: new Date(0) } });
  await assert.rejects(rotateRefreshToken(expired.refreshToken), refreshDenied);
  const revoked = await issueAuthTokens(userId);
  await revokeRefreshSession(revoked.refreshToken);
  await assert.rejects(rotateRefreshToken(revoked.refreshToken), refreshDenied);
});

test("replay racing a replacement token cannot leave an active descendant", async () => {
  const initial = await issueAuthTokens(userId);
  const replacement = await rotateRefreshToken(initial.refreshToken);
  const outcomes = await Promise.allSettled([
    rotateRefreshToken(replacement.refreshToken),
    rotateRefreshToken(initial.refreshToken),
  ]);
  const winner = outcomes[0];
  if (winner.status === "fulfilled") await assert.rejects(rotateRefreshToken(winner.value.refreshToken), refreshDenied);
  else assert.ok(refreshDenied(winner.reason));
  assert.equal(outcomes[1].status, "rejected");
});

test("guards require a token and check current database role", async () => {
  await assert.rejects(requireUser(new Request("http://localhost/api")), error => error instanceof ApiError && error.status === 401);
  await prisma.user.update({ where: { id: userId }, data: { role: "admin" } });
  const tokens = await issueAuthTokens(userId);
  const request = new Request("http://localhost/api", { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
  assert.equal((await requireAdmin(request)).id, userId);
  await prisma.user.update({ where: { id: userId }, data: { role: "user" } });
  await assert.rejects(requireAdmin(request), error => error instanceof ApiError && error.status === 403);
  assert.deepEqual(await requireUser(request), { id: userId, email, role: "user" });
});

test("native refresh route returns both tokens without cookies", async () => {
  const initial = await issueAuthTokens(userId);
  const response = await POST(nativeRequest(initial.refreshToken));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("set-cookie"), null);
  const body = await response.json();
  assert.equal(body.data.tokenType, "Bearer");
  assert.ok(body.data.refreshToken);
  assert.notEqual(body.data.refreshToken, initial.refreshToken);
  assert.equal((await verifyAccessToken(body.data.accessToken)).userId, userId);
});

test("browser refresh route keeps refresh tokens in cookies and rejects cross-origin use", async () => {
  const initial = await issueAuthTokens(userId);
  const url = "http://localhost:3000/api/auth/refresh";
  const cookie = `refreshToken=${initial.refreshToken}`;
  const blocked = await POST(new NextRequest(url, { method: "POST", headers: { Cookie: cookie, Origin: "https://other.example" } }));
  assert.equal(blocked.status, 403);
  const noOrigin = await POST(new NextRequest(url, { method: "POST", headers: { Cookie: cookie } }));
  assert.equal(noOrigin.status, 403);
  const response = await POST(new NextRequest(url, { method: "POST", headers: { Cookie: cookie, Origin: "http://localhost:3000" } }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie") ?? "", /HttpOnly/i);
  assert.equal((await response.json()).data.refreshToken, undefined);
  const replay = await POST(new NextRequest(url, { method: "POST", headers: { Cookie: cookie, Origin: "http://localhost:3000" } }));
  assert.equal(replay.status, 401);
  assert.match(replay.headers.get("set-cookie") ?? "", /Max-Age=0/i);
});

test("refresh route rejects missing tokens, bad JSON and non-JSON bodies", async () => {
  const url = "http://localhost:3000/api/auth/refresh";
  assert.equal((await POST(new NextRequest(url, { method: "POST" }))).status, 401);
  assert.equal((await POST(new NextRequest(url, { method: "POST", body: "" }))).status, 401);
  assert.equal((await POST(new NextRequest(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }))).status, 400);
  assert.equal((await POST(new NextRequest(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }))).status, 400);
  assert.equal((await POST(new NextRequest(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: "token" }))).status, 415);
});
