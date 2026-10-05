import prisma from "../../database/prisma.js";
import {
  decisionCommitProjection,
  decisionDetailProjection,
} from "../../projections/decisions/index.js";
import { createDecisionSnapshot } from "../../transformers/decisions/index.js";
import {
  requireCommitReady,
  requireReviewComplete,
} from "../../middlewares/decisions/index.js";
import {
  lockDecision,
  assertRelatedIds,
} from "./decision-transaction.repository.js";
import type {
  CommitDecisionInput,
  CreateReviewInput,
} from "../../schemas/decisions/decision-lifecycle.schema.js";

export class DecisionLifecycleRepository {
  async commit(userId: string, decisionId: string, input: CommitDecisionInput) {
    return prisma.$transaction(async (tx) => {
      await lockDecision(tx, userId, decisionId, "DRAFT");
      const decision = await tx.decision.findUniqueOrThrow({
        where: { id: decisionId },
        include: decisionCommitProjection,
      });
      requireCommitReady(
        decision.alternatives.map((alternative) => alternative.id),
        decision.expectations.length,
        input.chosenAlternativeId,
      );

      const decidedAt = new Date();
      const snapshot = createDecisionSnapshot(
        decision,
        input.chosenAlternativeId,
        input.rationale,
      );
      await tx.decision.update({
        where: { id: decisionId },
        data: {
          status: "ACTIVE",
          decidedAt,
          chosenAlternativeId: input.chosenAlternativeId,
          rationale: input.rationale,
        },
      });
      const revision = await tx.decisionRevision.create({
        data: { decisionId, version: 1, snapshot },
        select: { id: true },
      });
      const committed = await tx.decision.findUniqueOrThrow({
        where: { id: decisionId },
        include: decisionDetailProjection,
      });
      return { decision: committed, revisionId: revision.id };
    });
  }

  async review(userId: string, decisionId: string, input: CreateReviewInput) {
    return prisma.$transaction(async (tx) => {
      await lockDecision(tx, userId, decisionId, "ACTIVE");
      await assertRelatedIds(
        tx,
        decisionId,
        input.measurements.map((item) => item.metricId),
        input.assessments.map((item) => item.expectationId),
      );

      const outcome = await tx.outcome.create({
        data: {
          decisionId,
          description: input.outcome.description,
          impact: input.outcome.impact,
          occurredAt: input.outcome.occurredAt
            ? new Date(input.outcome.occurredAt)
            : new Date(),
        },
        select: { id: true },
      });
      const measurementIds: string[] = [];
      for (const item of input.measurements) {
        const measurement = await tx.metricMeasurement.create({
          data: {
            metricId: item.metricId,
            value: item.value,
            recordedAt: item.recordedAt
              ? new Date(item.recordedAt)
              : new Date(),
            notes: item.notes,
          },
          select: { id: true },
        });
        measurementIds.push(measurement.id);
      }
      const assessmentIds: string[] = [];
      for (const item of input.assessments) {
        const assessment = await tx.expectationAssessment.create({
          data: {
            decisionId,
            expectationId: item.expectationId,
            outcomeId: outcome.id,
            result: item.result,
            notes: item.notes,
          },
          select: { id: true },
        });
        assessmentIds.push(assessment.id);
      }
      const reflection = input.reflection
        ? await tx.reflection.create({
            data: { decisionId, ...input.reflection },
            select: { id: true },
          })
        : null;

      if (input.complete) {
        const expectations = await tx.expectation.findMany({
          where: { decisionId },
          select: { id: true, assessments: { select: { id: true }, take: 1 } },
        });
        const hasReflection =
          reflection !== null ||
          (await tx.reflection.count({ where: { decisionId } })) > 0;
        requireReviewComplete(
          expectations.every(
            (expectation) => expectation.assessments.length > 0,
          ),
          hasReflection,
        );
        await tx.decision.update({
          where: { id: decisionId },
          data: { status: "COMPLETED" },
        });
      }
      return {
        outcomeId: outcome.id,
        assessmentIds,
        measurementIds,
        reflectionId: reflection?.id ?? null,
        status: input.complete ? ("COMPLETED" as const) : ("ACTIVE" as const),
      };
    });
  }
}
