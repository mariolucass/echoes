import prisma from "../../database/prisma.js";
import { ownedDecisionFilter } from "../decisions/owned-decision.repository.js";
import type { z } from "@hono/zod-openapi";
import type { measurementInput } from "../../schemas/tracking/tracking.schema.js";

export class MetricRepository {
  findManyOwned(userId: string, decisionId: string) {
    return prisma.metric.findMany({
      where: { decisionId, decision: ownedDecisionFilter(userId) },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  }

  findOwned(userId: string, id: string) {
    return prisma.metric.findFirst({
      where: { id, decision: ownedDecisionFilter(userId) },
    });
  }

  createMeasurement(metricId: string, input: z.infer<typeof measurementInput>) {
    return prisma.metricMeasurement.create({
      data: {
        metricId,
        value: input.value,
        recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
        notes: input.notes,
      },
    });
  }

  findMeasurementsOwned(userId: string, metricId: string) {
    return prisma.metricMeasurement.findMany({
      where: { metricId, metric: { decision: ownedDecisionFilter(userId) } },
      orderBy: [{ recordedAt: "asc" }, { id: "asc" }],
    });
  }
}
