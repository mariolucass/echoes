import type { Prisma } from "../../generated/prisma/client.js";
import {
  requireRelatedIds,
  requireWritableDecision,
} from "../../middlewares/decisions/index.js";

export type Tx = Prisma.TransactionClient;
type WritableStatus = "DRAFT" | "ACTIVE";

export async function lockDecision(
  tx: Tx,
  userId: string,
  decisionId: string,
  status: WritableStatus,
) {
  const claimed = await tx.decision.updateMany({
    where: { id: decisionId, userId, deletedAt: null, status },
    data: { updatedAt: new Date() },
  });
  if (claimed.count === 1) return;

  const decision = await tx.decision.findFirst({
    where: { id: decisionId, userId, deletedAt: null },
    select: { id: true },
  });
  requireWritableDecision(Boolean(decision), status);
}

export async function assertRelatedIds(
  tx: Tx,
  decisionId: string,
  metricIds: string[],
  expectationIds: string[],
) {
  const uniqueMetricIds = [...new Set(metricIds)];
  const uniqueExpectationIds = [...new Set(expectationIds)];
  const metrics = await tx.metric.findMany({
    where: { decisionId, id: { in: uniqueMetricIds } },
    select: { id: true },
  });
  const expectations = await tx.expectation.findMany({
    where: { decisionId, id: { in: uniqueExpectationIds } },
    select: { id: true },
  });
  requireRelatedIds(metricIds, expectationIds, metrics.length, expectations.length);
}
