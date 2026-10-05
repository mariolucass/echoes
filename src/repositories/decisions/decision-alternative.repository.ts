import { NotFoundError } from "../../errors/AppError.js";
import prisma from "../../database/prisma.js";
import { requireDecision } from "../../middlewares/decisions/index.js";
import { lockDecision } from "./decision-transaction.repository.js";
import type { CreateAlternativeInput } from "../../schemas/decisions/decision-alternative.schema.js";

export class DecisionAlternativeRepository {
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

  async listAlternatives(userId: string, decisionId: string) {
    const decision = await prisma.decision.findFirst({
      where: { id: decisionId, userId, deletedAt: null },
      select: {
        alternatives: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      },
    });
    return requireDecision(decision).alternatives;
  }

  async getAlternative(
    userId: string,
    decisionId: string,
    alternativeId: string,
  ) {
    const alternative = await prisma.decisionAlternative.findFirst({
      where: {
        id: alternativeId,
        decisionId,
        decision: { userId, deletedAt: null },
      },
    });
    if (!alternative) throw new NotFoundError("Alternative");
    return alternative;
  }

  async deleteAlternative(
    userId: string,
    decisionId: string,
    alternativeId: string,
  ) {
    await prisma.$transaction(async (tx) => {
      await lockDecision(tx, userId, decisionId, "DRAFT");
      const result = await tx.decisionAlternative.deleteMany({
        where: { id: alternativeId, decisionId },
      });
      if (result.count !== 1) throw new NotFoundError("Alternative");
    });
  }
}
