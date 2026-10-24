import axios from 'axios';

export interface ApiErrorBody {
  statusCode: number;
  code?: string;
  message: string | string[];
  requestId?: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (axios.isAxiosError<ApiErrorBody>(error)) {
      const body = error.response?.data;
      if (!error.response) {
        return new ApiError(0, 'Unable to reach the server. Check your connection and try again.');
      }
      const message = Array.isArray(body?.message)
        ? body.message.join(', ')
        : (body?.message ?? error.message);
      return new ApiError(error.response.status, message, body?.code, body?.requestId);
    }

    return new ApiError(0, error instanceof Error ? error.message : 'Something went wrong.');
  }
}

export const errorMessage = (error: unknown): string => ApiError.from(error).message;
