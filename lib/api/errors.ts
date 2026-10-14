import type { FieldErrors } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: FieldErrors;

  constructor(status: number, code: string, message: string, details?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    if (!Number.isInteger(status) || status < 400 || status > 599) {
      throw new RangeError("API error status must be between 400 and 599.");
    }
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
