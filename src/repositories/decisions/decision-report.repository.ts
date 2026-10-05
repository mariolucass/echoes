import prisma from "../../database/prisma.js";
import type { DecisionQuery } from "../../interfaces/decision/decision.interface.js";
import {
  buildDecisionOrderByClause,
  buildDecisionWhereClause,
} from "../../helpers/decisions/decision.helper.js";
import { requireDecision } from "../../middlewares/decisions/validate-decision.js";
import { decisionReportProjection } from "../../projections/decisions/decision-report.projection.js";
import { toOffset } from "../../utils/paginate.js";

export class DecisionReportRepository {
  findPage(userId: string, query: DecisionQuery) {
    const { page, limit, sortBy, order, ...filters } = query;
    // One relation query for the selected page; no per-decision requests.
    return prisma.decision.findMany({
      where: buildDecisionWhereClause(userId, filters),
      orderBy: buildDecisionOrderByClause(sortBy, order),
      skip: toOffset(page, limit),
      take: limit,
      select: decisionReportProjection,
    });
  }

  async getDetail(userId: string, id: string) {
    return requireDecision(
      await prisma.decision.findFirst({
        where: { id, userId, deletedAt: null },
        select: decisionReportProjection,
      }),
    );
  }
}
