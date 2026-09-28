import prisma from "../../database/prisma.js";
import { ownedDecisionFilter } from "../decisions/owned-decision.repository.js";

export class OutcomeRepository {
  findManyOwned(userId: string, decisionId: string) {
    return prisma.outcome.findMany({
      where: { decisionId, decision: ownedDecisionFilter(userId) },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
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
