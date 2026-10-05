import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../../../src/database/prisma.js";
import { CheckpointRepository } from "../../../src/repositories/tracking/checkpoint.repository.js";
import { MetricRepository } from "../../../src/repositories/tracking/metric.repository.js";
import { OutcomeRepository } from "../../../src/repositories/learning/outcome.repository.js";
import { TagRepository } from "../../../src/repositories/classification/tag.repository.js";

afterEach(() => vi.restoreAllMocks());

describe("domain repositories", () => {
  it("scopes tracking resources to non-deleted decisions of the owner", async () => {
    const checkpoint = vi
      .spyOn(prisma.checkpoint, "findFirst")
      .mockResolvedValue(null);
    const measurements = vi
      .spyOn(prisma.metricMeasurement, "findMany")
      .mockResolvedValue([]);

    await new CheckpointRepository().findOwned("user-1", "checkpoint-1");
    await new MetricRepository().findMeasurementsOwned("user-1", "metric-1");

    expect(checkpoint).toHaveBeenCalledWith({
      where: {
        id: "checkpoint-1",
        decision: { userId: "user-1", deletedAt: null },
      },
    });
    expect(measurements).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          metricId: "metric-1",
          metric: { decision: { userId: "user-1", deletedAt: null } },
        },
      }),
    );
  });

  it("scopes assessments through the outcome's decision", async () => {
    const assessments = vi
      .spyOn(prisma.expectationAssessment, "findMany")
      .mockResolvedValue([]);
    await new OutcomeRepository().findAssessmentsOwned("user-1", "outcome-1");
    expect(assessments).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          outcomeId: "outcome-1",
          outcome: { decision: { userId: "user-1", deletedAt: null } },
        },
      }),
    );
  });

  it("includes the owner in tag updates", async () => {
    const update = vi
      .spyOn(prisma.tag, "update")
      .mockResolvedValue({} as never);
    await new TagRepository().update("user-1", "tag-1", "Carreira");
    expect(update).toHaveBeenCalledWith({
      where: { id: "tag-1", userId: "user-1" },
      data: { name: "Carreira" },
    });
  });
});
