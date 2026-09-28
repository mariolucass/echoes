import { z } from "@hono/zod-openapi";
import { decimal, score, text } from "../decisions/decision-fields.schema.js";
import { dateTime } from "../../routes/shared/domain-routes.js";

export const checkpointInput = z.object({
  decisionId: z.uuid(),
  scheduledFor: dateTime,
  notes: text(2000).optional(),
}).strict();

export const checkpointPatch = z.object({
  scheduledFor: dateTime.optional(),
  completedAt: dateTime.nullable().optional(),
  score: score.nullable().optional(),
  notes: text(2000).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

export const checkpointResponse = z.object({
  id: z.uuid(),
  decisionId: z.uuid(),
  scheduledFor: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
  score: score.nullable(),
  notes: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const measurementInput = z.object({
  value: decimal,
  recordedAt: dateTime.optional(),
  notes: text(2000).optional(),
}).strict();

export const measurementResponse = z.object({
  id: z.uuid(),
  metricId: z.uuid(),
  value: z.string(),
  recordedAt: z.iso.datetime(),
  notes: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const metricDetailResponse = z.object({
  id: z.uuid(),
  decisionId: z.uuid(),
  name: z.string(),
  unit: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
