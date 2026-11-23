import prisma from "../../database/prisma.js";
import { ownedDecisionFilter } from "../decisions/owned-decision.repository.js";

/** Teto da listagem por usuário (sem decisionId); por decisão não há corte. */
const USER_LIST_LIMIT = 300;

export class OutcomeRepository {
  findManyOwned(userId: string, decisionId?: string) {
    return prisma.outcome.findMany({
      where: { decisionId, decision: ownedDecisionFilter(userId) },
      include: {
        decision: {
          select: {
            id: true,
            title: true,
            status: true,
            expectations: {
              select: { id: true, description: true, expectedImpact: true },
              orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            },
          },
        },
        assessments: { select: { expectationId: true, result: true, notes: true } },
      },
      orderBy: [{ createdAt: decisionId ? "asc" : "desc" }, { id: "asc" }],
      take: decisionId ? undefined : USER_LIST_LIMIT,
    });
  }

  findOwned(userId: string, id: string) {
    return prisma.outcome.findFirst({
      where: { id, decision: ownedDecisionFilter(userId) },
    });
  }

  findAssessmentsOwned(userId: string, outcomeId: string) {
    return prisma.expectationAssessment.findMany({
      where: { outcomeId, outcome: { decision: ownedDecisionFilter(userId) } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  }
}
