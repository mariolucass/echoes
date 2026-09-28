import { z } from "@hono/zod-openapi";

export const text = (max: number) => z.string().trim().min(1).max(max);
export const decimal = z
  .string()
  .regex(/^-?(?:0|[1-9]\d{0,13})(?:\.\d{1,4})?$/);
export const impact = z
  .number()
  .min(-10)
  .max(10)
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8);
export const score = z.number().int().min(0).max(10);
