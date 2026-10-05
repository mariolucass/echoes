import prisma from "../../database/prisma.js";
import {
  decisionDetailProjection,
  decisionListProjection,
} from "../../projections/decisions/index.js";
import { requireDecision } from "../../middlewares/decisions/index.js";
import { lockDecision } from "./decision-transaction.repository.js";
import type {
  CreateDecisionInput,
  CreateMetricInput,
} from "../../schemas/decisions/decision.schema.js";
import type { Prisma } from "../../generated/prisma/client.js";
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

  async getDetail(userId: string, decisionId: string) {
    const decision = await prisma.decision.findFirst({
      where: { id: decisionId, userId, deletedAt: null },
      include: decisionDetailProjection,
    });

    return requireDecision(decision);
  }
}
