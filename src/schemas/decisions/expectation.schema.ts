import { z } from "@hono/zod-openapi";
import {
  ExpectationAssessmentResult,
  TargetOperator,
} from "../../generated/prisma/enums.js";
import { text, decimal, impact } from "./decision-fields.schema.js";

const targetSchema = z
  .object({
    metricId: z.uuid(),
    operator: z.enum(TargetOperator),
    targetValue: decimal,
    baselineValue: decimal.optional(),
    evaluateAt: z.iso.datetime().optional(),
  })
  .strict();

export const createExpectationSchema = z
  .object({
    description: text(5000),
    expectedImpact: impact.optional(),
    targets: z.array(targetSchema).max(12).default([]),
  })
  .strict()
  .refine(
    (data) =>
      new Set(data.targets.map((target) => target.metricId)).size ===
      data.targets.length,
    {
      path: ["targets"],
      error: "Uma métrica só pode aparecer uma vez por expectativa",
    },
  )
  .openapi("CreateExpectation");

const targetResponseSchema = z.object({
  id: z.uuid(),
  metricId: z.uuid(),
  operator: z.enum(TargetOperator),
  targetValue: z.string(),
  baselineValue: z.string().nullable(),
  evaluateAt: z.iso.datetime().nullable(),
});
const assessmentResponseSchema = z.object({
  id: z.uuid(),
  outcomeId: z.uuid(),
  result: z.enum(ExpectationAssessmentResult),
  notes: z.string().nullable(),
});
export const expectationResponseSchema = z.object({
  id: z.uuid(),
  description: z.string(),
  expectedImpact: z.string().nullable(),
  targets: z.array(targetResponseSchema),
  assessments: z.array(assessmentResponseSchema),
});

export type CreateExpectationInput = z.infer<typeof createExpectationSchema>;
