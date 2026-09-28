import type { ErrorHandler } from "hono";
import { logger } from "../config/logger.js";
import { mapError } from "./errorMapper.js";
import { ErrorCode } from "./errorCodes.js";

export const errorHandler: ErrorHandler = (error, c) => {
  const mapped = mapError(error);
  const requestId = c.get("requestId") || undefined;
  const context = {
    requestId,
    path: c.req.path,
    method: c.req.method,
    code: mapped.code,
    statusCode: mapped.statusCode,
    ...(!mapped.isOperational && { err: error }),
  };

  logger[mapped.isOperational ? "warn" : "error"](context, mapped.message);

  const isProduction = process.env.NODE_ENV === "production";
  return c.json(
    {
      success: false as const,
      error: {
        code: mapped.code,
        message: mapped.message,
        ...((!isProduction || mapped.code === ErrorCode.VALIDATION_ERROR) &&
          mapped.details !== undefined && { details: mapped.details }),
        ...(requestId && { requestId }),
        timestamp: new Date().toISOString(),
      },
    },
    mapped.statusCode,
  );
};
