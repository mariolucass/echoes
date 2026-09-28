import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError, z } from "zod";
import { AppError } from "./AppError.js";
import { ErrorCode, ERROR_STATUS } from "./errorCodes.js";

type MappedError = {
  code: ErrorCode;
  statusCode: ContentfulStatusCode;
  message: string;
  details?: unknown;
  isOperational: boolean;
};

const INTERNAL_MESSAGE = "An internal error occurred. Try again later.";

const HTTP_ERROR_CODES: Partial<Record<ContentfulStatusCode, ErrorCode>> = {
  400: ErrorCode.BAD_REQUEST,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  405: ErrorCode.METHOD_NOT_ALLOWED,
  409: ErrorCode.CONFLICT,
  413: ErrorCode.PAYLOAD_TOO_LARGE,
  422: ErrorCode.UNPROCESSABLE_ENTITY,
  429: ErrorCode.RATE_LIMITED,
};

function isPrismaKnownError(
  error: unknown,
): error is Error & { code: string; meta?: unknown } {
  return (
    error instanceof Error &&
    error.name === "PrismaClientKnownRequestError" &&
    typeof (error as Error & { code?: unknown }).code === "string"
  );
}

export function mapError(error: Error): MappedError {
  const isProduction = process.env.NODE_ENV === "production";

  if (error instanceof AppError) {
    const isOperational = error.isOperational;
    return {
      code: isOperational ? error.code : ErrorCode.INTERNAL_ERROR,
      statusCode: isOperational
        ? error.statusCode
        : ERROR_STATUS[ErrorCode.INTERNAL_ERROR],
      message:
        isOperational || !isProduction ? error.message : INTERNAL_MESSAGE,
      details: error.details,
      isOperational,
    };
  }

  if (error instanceof HTTPException) {
    if (error.status >= 500) {
      return {
        code: ErrorCode.INTERNAL_ERROR,
        statusCode: error.status,
        message: isProduction ? INTERNAL_MESSAGE : error.message,
        isOperational: false,
      };
    }
    return {
      code: HTTP_ERROR_CODES[error.status] ?? ErrorCode.HTTP_ERROR,
      statusCode: error.status,
      message:
        error.message ||
        (error.status === 413
          ? "Request body is too large."
          : "Invalid request."),
      isOperational: true,
    };
  }

  if (error instanceof ZodError) {
    return {
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: ERROR_STATUS[ErrorCode.VALIDATION_ERROR],
      message: "Invalid input. Review the submitted fields and try again.",
      details: z.treeifyError(error),
      isOperational: true,
    };
  }

  if (isPrismaKnownError(error)) {
    const mapped = {
      P2002: { code: ErrorCode.CONFLICT, message: "Resource already exists." },
      P2003: {
        code: ErrorCode.CONFLICT,
        message: "Resource is still referenced.",
      },
      P2025: { code: ErrorCode.NOT_FOUND, message: "Resource was not found." },
    } as const;
    const known = mapped[error.code as keyof typeof mapped];
    if (known) {
      return {
        code: known.code,
        statusCode: ERROR_STATUS[known.code],
        message: known.message,
        details: { prismaCode: error.code, meta: error.meta },
        isOperational: true,
      };
    }
  }

  return {
    code: ErrorCode.INTERNAL_ERROR,
    statusCode: ERROR_STATUS[ErrorCode.INTERNAL_ERROR],
    message: isProduction ? INTERNAL_MESSAGE : error.message,
    isOperational: false,
  };
}
