import { z } from "@hono/zod-openapi";
import { text } from "../decisions/decision-fields.schema.js";

export const updateProfileSchema = z.object({ name: text(100) }).strict();
