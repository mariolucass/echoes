import { z } from "@hono/zod-openapi";
import { text } from "../decisions/decision-fields.schema.js";

export const tagInput = z.object({ name: text(100) }).strict();
export const tagResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const decisionTagParams = z.object({ id: z.uuid(), tagId: z.uuid() });
