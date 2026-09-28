import prisma from "../../database/prisma.js";
import {
  decisionCommitProjection,
  decisionDetailProjection,
} from "../../projections/decisions/index.js";
import { createDecisionSnapshot } from "../../transformers/decisions/index.js";
import {
  requireCommitReady,
  requireDecision,
  requireReviewComplete,
} from "../../middlewares/decisions/index.js";
import {
  lockDecision,
  assertRelatedIds,
} from "./decision-transaction.repository.js";
import type {
  CommitDecisionInput,
  CreateAlternativeInput,
  CreateDecisionInput,
  CreateMetricInput,
  CreateReviewInput,
} from "../../schemas/decisions/decision.schema.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { decisionListProjection } from "../../projections/decisions/index.js";
import {
  buildDecisionOrderByClause,
  buildDecisionWhereClause,
} from "../../helpers/decisions/decision.helper.js";
import type { DecisionQuery } from "../../interfaces/decision/decision.interface.js";
import { toOffset } from "../../utils/paginate.js";

interface FindManyArgs {
  where?: Prisma.DecisionWhereInput;
  orderBy?:
    | Prisma.DecisionOrderByWithRelationInput
    | Prisma.DecisionOrderByWithRelationInput[];
  skip?: number;
  take?: number;
  select: typeof decisionListProjection;
}

export class DecisionRepository {
  private pageQuery(userId: string, query: DecisionQuery) {
    const { page, limit, sortBy, order, ...filters } = query;
    const where = buildDecisionWhereClause(userId, filters);
    return {
      where,
      args: {
        where,
        orderBy: buildDecisionOrderByClause(sortBy, order),
        skip: toOffset(page, limit),
        take: limit,
        select: decisionListProjection,
      },
    };
  }

  async findPage(userId: string, query: DecisionQuery) {
    const { where, args } = this.pageQuery(userId, query);
    const [data, total] = await Promise.all([
      this.findMany(args),
      this.count(where),
    ]);
    return { data, total };
  }

  findPageWithoutCount(userId: string, query: DecisionQuery) {
    return this.findMany(this.pageQuery(userId, query).args);
  }

  private async count(where: Prisma.DecisionWhereInput): Promise<number> {
    return prisma.decision.count({ where });
  }
  private async findMany(args: FindManyArgs) {
    return prisma.decision.findMany(args);
  }

  async softDelete(userId: string, id: string): Promise<boolean> {
    const result = await prisma.decision.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count === 1;
  }
  async createDraft(userId: string, input: CreateDecisionInput) {
    const decision = await prisma.decision.create({
      data: { ...input, userId },
      include: decisionDetailProjection,
    });
    return decision;
  }

  async addAlternative(
    userId: string,
    decisionId: string,
    input: CreateAlternativeInput,
  ) {
    return prisma.$transaction(async (tx) => {
      await lockDecision(tx, userId, decisionId, "DRAFT");
      const alternative = await tx.decisionAlternative.create({
        data: { ...input, decisionId },
      });
      return alternative;
    });
  }

  async addMetric(
    userId: string,
    decisionId: string,
    input: CreateMetricInput,
  ) {
    return prisma.$transaction(async (tx) => {
      await lockDecision(tx, userId, decisionId, "DRAFT");
      return tx.metric.create({
        data: { ...input, decisionId },
        include: { measurements: true },
      });
    });
  }

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
          expectations.every((expectation) => expectation.assessments.length > 0),
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

  async getDetail(userId: string, decisionId: string) {
    const decision = await prisma.decision.findFirst({
      where: { id: decisionId, userId, deletedAt: null },
      include: decisionDetailProjection,
    });

    return requireDecision(decision);
  }
}
