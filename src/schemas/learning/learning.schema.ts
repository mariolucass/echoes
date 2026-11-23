import { z } from "@hono/zod-openapi";
import { ExpectationAssessmentResult } from "../../generated/prisma/enums.js";
import { score } from "../decisions/decision-fields.schema.js";

export const outcomeResponse = z.object({
  id: z.uuid(), decisionId: z.uuid(), description: z.string(), impact: z.string().nullable(),
  occurredAt: z.iso.datetime().nullable(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
});
export const reflectionResponse = z.object({
  id: z.uuid(), decisionId: z.uuid(), content: z.string(),
  satisfactionScore: score.nullable(), regretScore: score.nullable(),
  createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
});
export const decisionRef = z.object({
  id: z.uuid(), title: z.string(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ABANDONED", "ARCHIVED"]),
});
export const outcomeListItem = outcomeResponse.extend({
  decision: decisionRef,
  /** Expectativas da decisão: o "esperado" para comparar com o resultado. */
  expectations: z.array(z.object({ id: z.uuid(), description: z.string(), expectedImpact: z.string().nullable() })),
  assessments: z.array(z.object({
    expectationId: z.uuid(), result: z.enum(ExpectationAssessmentResult), notes: z.string().nullable(),
  })),
});
export const reflectionListItem = reflectionResponse.extend({ decision: decisionRef });
export const assessmentResponse = z.object({
  id: z.uuid(), decisionId: z.uuid(), expectationId: z.uuid(), outcomeId: z.uuid(),
  result: z.enum(ExpectationAssessmentResult), notes: z.string().nullable(),
  createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
});
