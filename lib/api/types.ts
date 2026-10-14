export type FieldErrors = Record<string, string[]>;

export type ApiSuccess<T, M = Record<string, unknown>> = {
  success: true;
  message: string;
  data: T;
  meta?: M;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: FieldErrors;
  };
};

export type ApiResponse<T, M = Record<string, unknown>> =
  | ApiSuccess<T, M>
  | ApiFailure;
