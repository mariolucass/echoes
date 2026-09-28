import type { MiddlewareHandler } from "hono";
import { AppError } from "../../errors/AppError.js";
import { ErrorCode } from "../../errors/errorCodes.js";

export const validateRequestLogDate: MiddlewareHandler = async (c, next) => {
  const date = c.req.query("date") ?? "";
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T00:00:00.000Z`)
    : null;

  if (
    !parsed ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new AppError("date must be a valid YYYY-MM-DD date", {
      statusCode: 400,
      code: ErrorCode.BAD_REQUEST,
    });
  }

  await next();
};
