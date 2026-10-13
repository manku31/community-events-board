import "server-only";
import { randomUUID } from "node:crypto";
import type { ZodType } from "zod";
import { AUTH } from "./config";
import { ApiError, errorResponse, VALIDATION } from "./errors";

export function api(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const requestId = randomUUID();
    try {
      const response = await handler(request);
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("X-Request-Id", requestId);
      response.headers.set("X-Content-Type-Options", "nosniff");
      return response;
    } catch (error) {
      return errorResponse(error, requestId);
    }
  };
}

export async function jsonBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") throw new ApiError("UNSUPPORTED_MEDIA_TYPE");
  const length = Number(request.headers.get("content-length"));
  if (length > AUTH.maxBodyBytes) throw new ApiError("PAYLOAD_TOO_LARGE");
  if (!request.body) throw new ApiError("INVALID_JSON");

  // Bound actual streamed bytes as Content-Length may be absent or incorrect.
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > AUTH.maxBodyBytes) {
        await reader.cancel();
        throw new ApiError("PAYLOAD_TOO_LARGE");
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("INVALID_JSON");
  } finally {
    reader.releaseLock();
  }

  let input: unknown;
  try {
    input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
  } catch {
    throw new ApiError("INVALID_JSON");
  }
  const result = schema.safeParse(input);
  if (!result.success) {
    const fields: Record<string, string[]> = Object.create(null);
    for (const issue of result.error.issues) {
      const field = issue.path.join(".") || "_root";
      const message = issue.code === "unrecognized_keys" ? VALIDATION.unknownField
        : field === "_root" ? VALIDATION.object : issue.message;
      (fields[field] ??= []).push(message);
    }
    throw new ApiError("VALIDATION_ERROR", fields);
  }
  return result.data;
}
