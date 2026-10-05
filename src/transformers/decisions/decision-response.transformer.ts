import type { Prisma } from "../../generated/prisma/client.js";
import type {
  decisionDetailProjection,
  decisionListProjection,
} from "../../projections/decisions/index.js";
import type {
  Decision,
  DecisionDetail,
} from "../../schemas/decisions/decision.schema.js";

type ListedDecision = Prisma.DecisionGetPayload<{
  select: typeof decisionListProjection;
}>;
type DetailedDecision = Prisma.DecisionGetPayload<{
  include: typeof decisionDetailProjection;
}>;

export function toDecisionListItem(decision: ListedDecision): Decision {
  return {
    id: decision.id,
    title: decision.title,
    description: decision.description,
    context: decision.context,
    status: decision.status,
    decidedAt: decision.decidedAt?.toISOString() ?? null,
    createdAt: decision.createdAt.toISOString(),
    updatedAt: decision.updatedAt.toISOString(),
  };
}

export function toAlternative(
  alternative: DetailedDecision["alternatives"][number],
): DecisionDetail["alternatives"][number] {
  return {
    id: alternative.id,
    title: alternative.title,
    description: alternative.description,
    pros: alternative.pros,
    cons: alternative.cons,
    createdAt: alternative.createdAt.toISOString(),
  };
}

export function toMetric(
  metric: DetailedDecision["metrics"][number],
): DecisionDetail["metrics"][number] {
  return {
    id: metric.id,
    name: metric.name,
    unit: metric.unit,
    measurements: metric.measurements.map((measurement) => ({
      id: measurement.id,
      value: measurement.value.toString(),
      recordedAt: measurement.recordedAt.toISOString(),
      notes: measurement.notes,
    })),
  };
}

export function toExpectation(
  expectation: DetailedDecision["expectations"][number],
): DecisionDetail["expectations"][number] {
  return {
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
    assessments: expectation.assessments.map((assessment) => ({
      id: assessment.id,
      outcomeId: assessment.outcomeId,
      result: assessment.result,
      notes: assessment.notes,
    })),
  };
}

export function toDecisionDetail(decision: DetailedDecision): DecisionDetail {
  return {
    id: decision.id,
    title: decision.title,
    description: decision.description,
    context: decision.context,
    status: decision.status,
    decidedAt: decision.decidedAt?.toISOString() ?? null,
    rationale: decision.rationale,
    chosenAlternativeId: decision.chosenAlternativeId,
    createdAt: decision.createdAt.toISOString(),
    updatedAt: decision.updatedAt.toISOString(),
    alternatives: decision.alternatives.map(toAlternative),
    metrics: decision.metrics.map(toMetric),
    expectations: decision.expectations.map(toExpectation),
    outcomes: decision.outcomes.map((outcome) => ({
      id: outcome.id,
      description: outcome.description,
      impact: outcome.impact?.toString() ?? null,
      occurredAt: outcome.occurredAt?.toISOString() ?? null,
    })),
    reflections: decision.reflections.map((reflection) => ({
      id: reflection.id,
      content: reflection.content,
      satisfactionScore: reflection.satisfactionScore,
      regretScore: reflection.regretScore,
    })),
    revisions: decision.revisions.map((revision) => ({
      id: revision.id,
      version: revision.version,
      snapshot: revision.snapshot as Record<string, unknown>,
      createdAt: revision.createdAt.toISOString(),
    })),
  };
}
