import type { Context } from "hono";
import type { z, ZodType } from "zod";
import { ValidationError } from "../../errors/AppError.js";
import type { AppEnv } from "../../interfaces/hono.js";

export async function parseAuthBody<S extends ZodType>(
  c: Context<AppEnv>,
  schema: S,
): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new ValidationError("Invalid JSON request body.");
  }
  return schema.parse(body) as z.output<S>;
}
