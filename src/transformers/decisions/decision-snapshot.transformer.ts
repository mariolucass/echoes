import type { Prisma } from "../../generated/prisma/client.js";
import type { decisionCommitProjection } from "../../projections/decisions/index.js";

type CommitDecision = Prisma.DecisionGetPayload<{
  include: typeof decisionCommitProjection;
}>;

export function createDecisionSnapshot(
  decision: CommitDecision,
  chosenAlternativeId: string,
  rationale: string,
) {
  return {
    schemaVersion: 1,
    title: decision.title,
    description: decision.description,
    context: decision.context,
    chosenAlternativeId,
    rationale,
    alternatives: decision.alternatives.map(
      ({ id, title, description, pros, cons }) => ({
        id,
        title,
        description,
        pros,
        cons,
      }),
    ),
    metrics: decision.metrics.map(({ id, name, unit }) => ({
      id,
      name,
      unit,
    })),
    expectations: decision.expectations.map((expectation) => ({
      id: expectation.id,
      description: expectation.description,
      expectedImpact: expectation.expectedImpact?.toString() ?? null,
      targets: expectation.targets.map((target) => ({
        id: target.id,
        metricId: target.metricId,
        operator: target.operator,
        targetValue: target.targetValue.toString(),
        baselineValue: target.baselineValue?.toString() ?? null,
        evaluateAt: target.evaluateAt?.toISOString() ?? null,
      })),
    })),
  };
}
