import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ErrorCode, ERROR_STATUS } from "./errorCodes.js";

export interface AppErrorOptions {
  code?: ErrorCode;
  statusCode?: ContentfulStatusCode;
  details?: unknown;
  isOperational?: boolean;
  cause?: unknown;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: ContentfulStatusCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.code = options.code ?? ErrorCode.INTERNAL_ERROR;
    this.statusCode = options.statusCode ?? ERROR_STATUS[this.code];
    this.details = options.details;
    this.isOperational = options.isOperational ?? this.statusCode !== 500;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Invalid input. Review the submitted fields and try again.",
    details?: unknown,
  ) {
    super(message, { code: ErrorCode.VALIDATION_ERROR, details });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} was not found. Check the identifier and try again.`, {
      code: ErrorCode.NOT_FOUND,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = "Authentication required. Provide a valid access token and try again.",
  ) {
    super(message, { code: ErrorCode.UNAUTHORIZED });
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = "Access denied. Verify your permissions and try again.",
  ) {
    super(message, { code: ErrorCode.FORBIDDEN });
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "The request conflicts with the current resource state. Refresh the resource and try again.",
    details?: unknown,
  ) {
    super(message, { code: ErrorCode.CONFLICT, details });
  }
}

export class RateLimitedError extends AppError {
  constructor(message = "Too many requests. Try again later.") {
    super(message, { code: ErrorCode.RATE_LIMITED });
  }
}

export class InternalError extends AppError {
  constructor(
    message = "An internal error occurred. Try again later.",
    cause?: unknown,
  ) {
    super(message, {
      code: ErrorCode.INTERNAL_ERROR,
      isOperational: false,
      cause,
    });
  }
}
