import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../database/prisma.js";
import { NotFoundError } from "../errors/AppError.js";
import { TrackingService } from "../services/tracking/tracking.service.js";
import { LearningService } from "../services/learning/learning.service.js";
import { TagService } from "../services/classification/tag.service.js";

afterEach(() => vi.restoreAllMocks());

describe("domain ownership", () => {
  it("does not list checkpoints or outcomes for an unowned decision", async () => {
    vi.spyOn(prisma.decision, "findFirst").mockResolvedValue(null);
    const checkpoints = vi.spyOn(prisma.checkpoint, "findMany");
    const outcomes = vi.spyOn(prisma.outcome, "findMany");

    await expect(TrackingService.listCheckpoints("user", "decision")).rejects.toThrow(NotFoundError);
    await expect(LearningService.listOutcomes("user", "decision")).rejects.toThrow(NotFoundError);
    expect(checkpoints).not.toHaveBeenCalled();
    expect(outcomes).not.toHaveBeenCalled();
  });

  it("does not attach a tag owned by another user", async () => {
    vi.spyOn(prisma.decision, "findFirst").mockResolvedValue({ id: "decision", status: "DRAFT" } as never);
    vi.spyOn(prisma.tag, "findFirst").mockResolvedValue(null);
    const attach = vi.spyOn(prisma.decisionTag, "upsert");

    await expect(TagService.attach("user", "decision", "foreign-tag")).rejects.toThrow(NotFoundError);
    expect(attach).not.toHaveBeenCalled();
  });
});
