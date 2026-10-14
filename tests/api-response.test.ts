import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, errorResponse, handleApiError, successResponse } from "../lib/api/index";

test("success responses preserve data, HTTP status, metadata and headers", async () => {
  const response = successResponse([{ id: "event-1" }], {
    status: 201,
    message: "Event created",
    meta: { total: 1 },
    headers: { "Cache-Control": "no-store" },
  });
  assert.equal(response.status, 201);
  assert.match(response.headers.get("content-type") ?? "", /application\/json/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    success: true,
    message: "Event created",
    data: [{ id: "event-1" }],
    meta: { total: 1 },
  });
});

test("empty success data stays explicit and optional metadata is omitted", async () => {
  assert.deepEqual(await successResponse(null).json(), {
    success: true, message: "Success", data: null,
  });
});

test("validation errors expose field messages in a consistent envelope", async () => {
  const response = errorResponse("Please check your input.", {
    status: 422, code: "VALIDATION_ERROR", details: { email: ["Enter a valid email."] },
  });
  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), {
    success: false,
    error: { code: "VALIDATION_ERROR", message: "Please check your input.", details: { email: ["Enter a valid email."] } },
  });
});

test("expected errors retain their status and public error code", async () => {
  const response = handleApiError(new ApiError(401, "UNAUTHORIZED", "Please sign in."));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    success: false, error: { code: "UNAUTHORIZED", message: "Please sign in." },
  });
});

test("unexpected errors never expose driver messages or credentials", async () => {
  for (const exception of [new Error("postgresql://admin:private-password@private-host/db"), "private-token", null]) {
    const response = handleApiError(exception);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "Something went wrong. Please try again later." },
    });
  }
});

test("JSON helpers reject bodyless and incorrect HTTP status ranges", () => {
  for (const status of [204, 205, 400]) assert.throws(() => successResponse({}, { status }), RangeError);
  assert.throws(() => errorResponse("Error", { status: 200 }), RangeError);
  assert.throws(() => new ApiError(200, "ERROR", "Error"), RangeError);
});
