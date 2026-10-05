import { z } from "@hono/zod-openapi";
import { ExpectationAssessmentResult } from "../../generated/prisma/enums.js";
import { decimal, impact, score, text } from "./decision-fields.schema.js";
import { decisionDetailSchema } from "./decision.schema.js";

export const commitDecisionSchema = z
  .object({
    chosenAlternativeId: z.uuid(),
    rationale: text(5000),
  })
  .strict()
  .openapi("CommitDecision");

const measurementSchema = z
  .object({
    metricId: z.uuid(),
    value: decimal,
    recordedAt: z.iso.datetime().optional(),
    notes: text(2000).optional(),
  })
  .strict();

const assessmentSchema = z
  .object({
    expectationId: z.uuid(),
    result: z.enum(ExpectationAssessmentResult),
    notes: text(2000).optional(),
  })
  .strict();

const reflectionSchema = z
  .object({
    content: text(5000),
    satisfactionScore: score.optional(),
    regretScore: score.optional(),
  })
  .strict();

export const createReviewSchema = z
  .object({
    outcome: z
      .object({
        description: text(5000),
        impact: impact.optional(),
        occurredAt: z.iso.datetime().optional(),
      })
      .strict(),
    measurements: z.array(measurementSchema).max(24).default([]),
    assessments: z.array(assessmentSchema).min(1).max(50),
    reflection: reflectionSchema.optional(),
    complete: z.boolean().default(false),
  })
  .strict()
  .refine(
    (data) =>
      new Set(data.assessments.map((item) => item.expectationId)).size ===
      data.assessments.length,
    {
      path: ["assessments"],
      error: "Uma expectativa só pode ser avaliada uma vez por resultado",
    },
  )
  .openapi("CreateDecisionReview");

export const reviewResponseSchema = z.object({
  outcomeId: z.uuid(),
  assessmentIds: z.array(z.uuid()),
  measurementIds: z.array(z.uuid()),
  reflectionId: z.uuid().nullable(),
  status: z.enum(["ACTIVE", "COMPLETED"]),
});

export const commitResponseSchema = decisionDetailSchema
  .extend({ revisionId: z.uuid() })
  .openapi("CommitDecisionResponse");

export type CommitDecisionInput = z.infer<typeof commitDecisionSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
