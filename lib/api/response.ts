import { ApiError } from "./errors";
import type { ApiFailure, ApiSuccess, FieldErrors } from "./types";

type SuccessOptions<M> = {
  status?: number;
  message?: string;
  meta?: M;
  headers?: HeadersInit;
};

type ErrorOptions = {
  status?: number;
  code?: string;
  details?: FieldErrors;
  headers?: HeadersInit;
};

export function successResponse<T, M = Record<string, unknown>>(
  data: T,
  { status = 200, message = "Success", meta, headers }: SuccessOptions<M> = {},
): Response {
  if (!Number.isInteger(status) || status < 200 || status > 299 || status === 204 || status === 205) {
    throw new RangeError("JSON success responses require a body-compatible 2xx status.");
  }

  const body: ApiSuccess<T, M> = { success: true, message, data };
  if (meta !== undefined) body.meta = meta;
  return Response.json(body, { status, headers });
}

export function errorResponse(
  message: string,
  { status = 400, code = "BAD_REQUEST", details, headers }: ErrorOptions = {},
): Response {
  if (!Number.isInteger(status) || status < 400 || status > 599) {
    throw new RangeError("JSON error responses require a 4xx or 5xx status.");
  }

  const body: ApiFailure = { success: false, error: { code, message } };
  if (details !== undefined) body.error.details = details;
  return Response.json(body, { status, headers });
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return errorResponse(error.message, {
      status: error.status,
      code: error.code,
      details: error.details,
    });
  }

  // Unexpected exceptions may contain connection strings or other private data.
  return errorResponse("Something went wrong. Please try again later.", {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
  });
}
