import type { MiddlewareHandler } from "hono";
import type { AnyZodObject } from "zod/v3";

export const validateBody =
  (schema: AnyZodObject): MiddlewareHandler =>
  async (c, next) => {
    await schema.parseAsync(await c.req.json());
    await next();
  };
