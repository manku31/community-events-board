import "server-only";

export const ERRORS = {
  INVALID_JSON: { status: 400, message: "Request body must be valid JSON." },
  INVALID_CREDENTIALS: { status: 401, message: "Email or password is incorrect." },
  UNAUTHORIZED: { status: 401, message: "A valid access token is required." },
  INVALID_REFRESH_TOKEN: { status: 401, message: "Refresh token is invalid or expired. Please sign in again." },
  REFRESH_TOKEN_REUSED: { status: 401, message: "This refresh token was already used. Please sign in again." },
  FORBIDDEN: { status: 403, message: "You do not have permission to perform this action." },
  EMAIL_IN_USE: { status: 409, message: "An account with this email already exists." },
  PAYLOAD_TOO_LARGE: { status: 413, message: "Request body must not exceed 4 KB." },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, message: "Content-Type must be application/json." },
  VALIDATION_ERROR: { status: 422, message: "Please check the submitted fields." },
  TOO_MANY_REQUESTS: { status: 429, message: "Too many attempts. Please try again later." },
  INTERNAL_ERROR: { status: 500, message: "Something went wrong. Please try again later." },
  SERVICE_UNAVAILABLE: { status: 503, message: "Authentication is temporarily unavailable. Please try again later." },
} as const;

export const VALIDATION = {
  email: "Enter a valid email address of at most 254 characters.",
  password: "Password must contain between 12 and 128 characters.",
  refreshToken: "Provide a valid refresh token.",
  unknownField: "Unknown fields are not allowed.",
  object: "Provide a JSON object with the required fields.",
} as const;

export const MESSAGES = { signedOut: "Signed out successfully." } as const;
export type ErrorCode = keyof typeof ERRORS;

export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly fields?: Record<string, string[]>,
    public readonly retryAfter?: number,
  ) {
    super(ERRORS[code].message);
    this.name = "ApiError";
  }
}

const databaseFailures = new Set([
  "ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "ETIMEDOUT", "EPIPE",
  "53300", "53400", "57P01", "57P02", "57P03", "57014",
]);

export function errorResponse(error: unknown, requestId: string): Response {
  let safeError: ApiError;
  if (error instanceof ApiError) {
    safeError = error;
  } else {
    const code = error && typeof error === "object" && "code" in error
      ? String(error.code) : "UNKNOWN";
    safeError = new ApiError(databaseFailures.has(code) || code.startsWith("08")
      ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR");
    console.error("Authentication request failed", { requestId, code: safeError.code });
  }
  const definition = ERRORS[safeError.code];
  const headers = new Headers({
    "Cache-Control": "no-store", "X-Request-Id": requestId, "X-Content-Type-Options": "nosniff",
  });
  if (definition.status === 401) headers.set("WWW-Authenticate", "Bearer");
  if (safeError.retryAfter) headers.set("Retry-After", String(safeError.retryAfter));
  return Response.json({
    error: {
      code: safeError.code,
      message: definition.message,
      requestId,
      ...(safeError.fields ? { fields: safeError.fields } : {}),
    },
  }, { status: definition.status, headers });
}
