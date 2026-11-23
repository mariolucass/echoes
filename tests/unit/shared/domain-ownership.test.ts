import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../../../src/database/prisma.js";
import { NotFoundError } from "../../../src/errors/AppError.js";
import { TrackingService } from "../../../src/services/tracking/tracking.service.js";
import { LearningService } from "../../../src/services/learning/learning.service.js";
import { TagService } from "../../../src/services/classification/tag.service.js";

afterEach(() => vi.restoreAllMocks());

describe("domain ownership", () => {
  it("does not list checkpoints or outcomes for an unowned decision", async () => {
    vi.spyOn(prisma.decision, "findFirst").mockResolvedValue(null);
    const checkpoints = vi.spyOn(prisma.checkpoint, "findMany");
    const outcomes = vi.spyOn(prisma.outcome, "findMany");

    await expect(
      TrackingService.listCheckpoints("user", "decision"),
    ).rejects.toThrow(NotFoundError);
    await expect(
      LearningService.listOutcomes("user", "decision"),
    ).rejects.toThrow(NotFoundError);
    expect(checkpoints).not.toHaveBeenCalled();
    expect(outcomes).not.toHaveBeenCalled();
  });

  it("lists across all owned decisions without checking a single one", async () => {
    const owned = vi.spyOn(prisma.decision, "findFirst");
    vi.spyOn(prisma.reflection, "findMany").mockResolvedValue([
      {
        id: "r1",
        decisionId: "d1",
        content: "Aprendi",
        satisfactionScore: 8,
        regretScore: 2,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
        decision: { id: "d1", title: "Mudar", status: "ACTIVE" },
      },
    ] as never);

    const list = await LearningService.listReflections("user");

    expect(owned).not.toHaveBeenCalled();
    expect(list[0]).toMatchObject({ decision: { title: "Mudar" }, createdAt: "2026-01-01T00:00:00.000Z" });
  });

  it("does not attach a tag owned by another user", async () => {
    vi.spyOn(prisma.decision, "findFirst").mockResolvedValue({
      id: "decision",
      status: "DRAFT",
    } as never);
    vi.spyOn(prisma.tag, "findFirst").mockResolvedValue(null);
    const attach = vi.spyOn(prisma.decisionTag, "upsert");

    await expect(
      TagService.attach("user", "decision", "foreign-tag"),
    ).rejects.toThrow(NotFoundError);
    expect(attach).not.toHaveBeenCalled();
  });
});
