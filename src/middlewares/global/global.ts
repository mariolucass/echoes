import type { MiddlewareHandler } from "hono";
import type { AnyZodObject } from "zod/v3";
import type { AppEnv } from "../../interfaces/hono.js";
import { validateBody } from "./zod.js";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_LIMIT = 12;
const MAX_PAGE_LIMIT = 48;

function positiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}

export class GlobalMiddleware {
  static validatePaginate: MiddlewareHandler<AppEnv> = async (c, next) => {
    const limit = Math.min(
      positiveInteger(c.req.query("limit"), DEFAULT_PAGE_LIMIT),
      MAX_PAGE_LIMIT,
    );
    const requestedPage = positiveInteger(
      c.req.query("page"),
      DEFAULT_PAGE_NUMBER,
    );
    const page =
      (requestedPage - 1) * limit <= Number.MAX_SAFE_INTEGER
        ? requestedPage
        : DEFAULT_PAGE_NUMBER;
    c.set("pagination", { page, limit, offset: (page - 1) * limit });
    await next();
  };
}
