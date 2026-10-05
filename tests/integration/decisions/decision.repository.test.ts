import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import prisma from "../../../src/database/prisma.js";
import { DecisionRepository } from "../../../src/repositories/decisions/decision.repository.js";
import { decisionDraft } from "../../support/builders/decision-draft.js";
import { resetTestData } from "../../support/database/reset-test-data.js";

describe("DecisionRepository with PostgreSQL", () => {
  beforeEach(resetTestData);
  afterEach(resetTestData);
  afterAll(async () => prisma.$disconnect());

  it("lists only the owner's active records and excludes soft-deleted decisions", async () => {
    const ownerId = randomUUID();
    const otherId = randomUUID();
    await prisma.user.createMany({
      data: [ownerId, otherId].map((id) => ({
        id,
        name: "Repository test",
        email: `${id}@example.test`,
        passwordHash: "test",
      })),
    });

    const visible = await prisma.decision.create({
      data: { ...decisionDraft({ title: "Visível" }), userId: ownerId },
    });
    await prisma.decision.create({
      data: {
        ...decisionDraft({ title: "Excluída" }),
        userId: ownerId,
        deletedAt: new Date(),
      },
    });
    await prisma.decision.create({
      data: { ...decisionDraft({ title: "De outra pessoa" }), userId: otherId },
    });

    const page = await new DecisionRepository().findPage(ownerId, {
      page: 1,
      limit: 10,
    });
    expect(page.total).toBe(1);
    expect(page.data.map(({ id }) => id)).toEqual([visible.id]);
  });
});
