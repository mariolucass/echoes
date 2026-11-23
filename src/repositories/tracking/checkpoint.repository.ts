import prisma from "../../database/prisma.js";
import { ownedDecisionFilter } from "../decisions/owned-decision.repository.js";
import type { z } from "@hono/zod-openapi";
import type { checkpointInput, checkpointPatch } from "../../schemas/tracking/tracking.schema.js";

/** Teto da listagem por usuário (sem decisionId); por decisão não há corte. */
const USER_LIST_LIMIT = 300;

export class CheckpointRepository {
  findManyOwned(userId: string, decisionId?: string) {
    return prisma.checkpoint.findMany({
      where: { decisionId, decision: ownedDecisionFilter(userId) },
      include: { decision: { select: { id: true, title: true, status: true } } },
      orderBy: [{ scheduledFor: "asc" }, { id: "asc" }],
      take: decisionId ? undefined : USER_LIST_LIMIT,
    });
  }

  findOwned(userId: string, id: string) {
    return prisma.checkpoint.findFirst({
      where: { id, decision: ownedDecisionFilter(userId) },
    });
  }

  create(input: z.infer<typeof checkpointInput>) {
    return prisma.checkpoint.create({
      data: {
        decisionId: input.decisionId,
        scheduledFor: new Date(input.scheduledFor),
        notes: input.notes,
      },
    });
  }

  update(id: string, input: z.infer<typeof checkpointPatch>) {
    return prisma.checkpoint.update({
      where: { id },
      data: {
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : undefined,
        completedAt: input.completedAt === null
          ? null
          : input.completedAt ? new Date(input.completedAt) : undefined,
        score: input.score,
        notes: input.notes,
      },
    });
  }

  delete(id: string) {
    return prisma.checkpoint.delete({ where: { id } });
  }
}
