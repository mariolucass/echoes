import prisma from "../../database/prisma.js";
import { ownedDecisionFilter } from "../decisions/owned-decision.repository.js";

export class ReflectionRepository {
  findManyOwned(userId: string, decisionId: string) {
    return prisma.reflection.findMany({
      where: { decisionId, decision: ownedDecisionFilter(userId) },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  }

  findOwned(userId: string, id: string) {
    return prisma.reflection.findFirst({
      where: { id, decision: ownedDecisionFilter(userId) },
    });
  }
}
