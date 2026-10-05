import { z } from "@hono/zod-openapi";
import { text } from "./decision-fields.schema.js";

export const createAlternativeSchema = z
  .object({
    title: text(200),
    description: text(5000).optional(),
    pros: text(5000).optional(),
    cons: text(5000).optional(),
  })
  .strict()
  .openapi("CreateAlternative");

export const alternativeResponseSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  pros: z.string().nullable(),
  cons: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const alternativeParamsSchema = z.object({
  id: z.uuid(),
  alternativeId: z.uuid(),
});

export type CreateAlternativeInput = z.infer<typeof createAlternativeSchema>;
