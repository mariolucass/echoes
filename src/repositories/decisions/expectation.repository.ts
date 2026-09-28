import prisma from "../../database/prisma.js";
import {
  lockDecision,
} from "./decision-transaction.repository.js";
import { validateExpectationTargets } from "../../middlewares/decisions/index.js";
import type { CreateExpectationInput } from "../../schemas/decisions/expectation.schema.js";

export class ExpectationRepository {
  async addExpectation(
    userId: string,
    decisionId: string,
    input: CreateExpectationInput,
  ) {
    return prisma.$transaction(async (tx) => {
      await lockDecision(tx, userId, decisionId, "DRAFT");
      await validateExpectationTargets(
        tx,
        decisionId,
        input.targets.map((target) => target.metricId),
      );
      const expectation = await tx.expectation.create({
        data: {
          decisionId,
          description: input.description,
          expectedImpact: input.expectedImpact,
        },
        select: { id: true },
      });
      for (const target of input.targets) {
        await tx.expectationTarget.create({
          data: {
            decisionId,
            expectationId: expectation.id,
            metricId: target.metricId,
            operator: target.operator,
            targetValue: target.targetValue,
            baselineValue: target.baselineValue,
            evaluateAt: target.evaluateAt
              ? new Date(target.evaluateAt)
              : undefined,
          },
        });
      }
      return tx.expectation.findUniqueOrThrow({
        where: { id: expectation.id },
        include: { targets: true, assessments: true },
      });
    });
  }
}
