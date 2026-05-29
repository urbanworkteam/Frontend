export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiError | null;
};

export type ApiError = {
  code: string;
  message: string;
  field?: string | null;
  details?: unknown;
};

export type PageResponse<T> = {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export class FarmilyApiError extends Error {
  code: string;
  field?: string | null;
  status: number;
  constructor(code: string, message: string, status: number, field?: string | null) {
    super(message);
    this.code = code;
    this.field = field;
    this.status = status;
  }
}
