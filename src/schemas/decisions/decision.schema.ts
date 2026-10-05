import {
  paginationQuerySchema,
  paginationResponseSchema,
} from "../shared/index.js";
import {
  decisionSortableFields,
  DecisionStatus,
} from "../../interfaces/decision/decision.interface.js";
import { z } from "@hono/zod-openapi";
import { text, score } from "./decision-fields.schema.js";
import { alternativeResponseSchema } from "./decision-alternative.schema.js";
import { expectationResponseSchema } from "./expectation.schema.js";

export const decisionQuerySchema = z
  .object({
    status: z.enum(DecisionStatus).optional(),
    sortBy: z.enum(decisionSortableFields).optional(),
    order: z.enum(["asc", "desc"]).optional(),
    search: z.string().trim().max(200).optional(),
    decidedAtFrom: z.iso.datetime().optional(),
    decidedAtTo: z.iso.datetime().optional(),
    createdAtFrom: z.iso.datetime().optional(),
    createdAtTo: z.iso.datetime().optional(),
  })
  .extend(paginationQuerySchema.shape)
  .strict()
  .refine(
    (data) =>
      !data.decidedAtFrom ||
      !data.decidedAtTo ||
      Date.parse(data.decidedAtFrom) <= Date.parse(data.decidedAtTo),
    {
      error: "decidedAtFrom deve ser anterior a decidedAtTo",
      path: ["decidedAtTo"],
    },
  )
  .refine(
    (data) =>
      !data.createdAtFrom ||
      !data.createdAtTo ||
      Date.parse(data.createdAtFrom) <= Date.parse(data.createdAtTo),
    {
      error: "createdAtFrom deve ser anterior a createdAtTo",
      path: ["createdAtTo"],
    },
  )
  .openapi("DecisionQuery");

export type DecisionQuery = z.infer<typeof decisionQuerySchema>;

export const decisionIdParamsSchema = z.object({
  id: z.uuid(),
});

export const decisionSchema = z
  .object({
    id: z.uuid().openapi({ example: "9f1c2e4a-5b6d-4f8e-9a1b-2c3d4e5f6a7b" }),
    title: z.string(),
    description: z.string().nullable(),
    context: z.string().nullable(),
    status: z.enum(DecisionStatus),
    decidedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .openapi("Decision");

export type Decision = z.infer<typeof decisionSchema>;

export const decisionListResponseSchema = z
  .object({
    data: z.array(decisionSchema),
  })
  .extend(paginationResponseSchema.shape)
  .openapi("DecisionListResponse");

export type DecisionListResponse = z.infer<typeof decisionListResponseSchema>;

export const createDecisionSchema = z
  .object({
    title: text(200),
    description: text(5000).optional(),
    context: text(10000).optional(),
  })
  .strict()
  .openapi("CreateDecision");

export const createMetricSchema = z
  .object({
    name: text(100),
    unit: text(32).optional(),
  })
  .strict()
  .openapi("CreateMetric");

const measurementResponseSchema = z.object({
  id: z.uuid(),
  value: z.string(),
  recordedAt: z.iso.datetime(),
  notes: z.string().nullable(),
});
export const metricResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  unit: z.string().nullable(),
  measurements: z.array(measurementResponseSchema),
});
const outcomeResponseSchema = z.object({
  id: z.uuid(),
  description: z.string(),
  impact: z.string().nullable(),
  occurredAt: z.iso.datetime().nullable(),
});
const reflectionResponseSchema = z.object({
  id: z.uuid(),
  content: z.string(),
  satisfactionScore: score.nullable(),
  regretScore: score.nullable(),
});
const revisionResponseSchema = z.object({
  id: z.uuid(),
  version: z.number().int().positive(),
  snapshot: z.record(z.string(), z.unknown()),
  createdAt: z.iso.datetime(),
});
export const decisionDetailSchema = z
  .object({
    id: z.uuid(),
    title: z.string(),
    description: z.string().nullable(),
    context: z.string().nullable(),
    status: z.enum(DecisionStatus),
    decidedAt: z.iso.datetime().nullable(),
    rationale: z.string().nullable(),
    chosenAlternativeId: z.uuid().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    alternatives: z.array(alternativeResponseSchema),
    metrics: z.array(metricResponseSchema),
    expectations: z.array(expectationResponseSchema),
    outcomes: z.array(outcomeResponseSchema),
    reflections: z.array(reflectionResponseSchema),
    revisions: z.array(revisionResponseSchema),
  })
  .openapi("DecisionDetail");

export const draftResponseSchema = decisionDetailSchema.openapi(
  "CreateDraftResponse",
);
export type DecisionDetail = z.infer<typeof decisionDetailSchema>;

export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
export type CreateMetricInput = z.infer<typeof createMetricSchema>;
