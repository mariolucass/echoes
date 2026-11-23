import prisma from "../../database/prisma.js";
import { ownedDecisionFilter } from "../decisions/owned-decision.repository.js";

/** Teto da listagem por usuário (sem decisionId); por decisão não há corte. */
const USER_LIST_LIMIT = 300;

export class ReflectionRepository {
  findManyOwned(userId: string, decisionId?: string) {
    return prisma.reflection.findMany({
      where: { decisionId, decision: ownedDecisionFilter(userId) },
      include: { decision: { select: { id: true, title: true, status: true } } },
      orderBy: [{ createdAt: decisionId ? "asc" : "desc" }, { id: "asc" }],
      take: decisionId ? undefined : USER_LIST_LIMIT,
    });
  }

  findOwned(userId: string, id: string) {
    return prisma.reflection.findFirst({
      where: { id, decision: ownedDecisionFilter(userId) },
    });
  }
}
