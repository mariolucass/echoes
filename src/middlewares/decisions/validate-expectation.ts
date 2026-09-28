import type { Prisma } from "../../generated/prisma/client.js";
import { requireRelatedIds } from "./validate-decision.js";

export async function validateExpectationTargets(
  tx: Prisma.TransactionClient,
  decisionId: string,
  metricIds: string[],
): Promise<void> {
  const uniqueMetricIds = [...new Set(metricIds)];
  const metrics = await tx.metric.findMany({
    where: { decisionId, id: { in: uniqueMetricIds } },
    select: { id: true },
  });
  requireRelatedIds(metricIds, [], metrics.length, 0);
}
