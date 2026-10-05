import prisma from "../../database/prisma.js";

export const ownedDecisionFilter = (userId: string) => ({
  userId,
  deletedAt: null,
});

export class OwnedDecisionRepository {
  findOwned(userId: string, decisionId: string) {
    return prisma.decision.findFirst({
      where: { id: decisionId, ...ownedDecisionFilter(userId) },
      select: { id: true, status: true },
    });
  }
}
