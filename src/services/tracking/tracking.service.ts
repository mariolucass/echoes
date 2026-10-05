import type { z } from "@hono/zod-openapi";
import { ConflictError, NotFoundError } from "../../errors/AppError.js";
import {
  CheckpointRepository,
  MetricRepository,
} from "../../repositories/tracking/index.js";
import type {
  checkpointInput,
  checkpointPatch,
  measurementInput,
} from "../../schemas/tracking/tracking.schema.js";
import { requireOwnedDecision } from "../shared/owned-decision.js";

const checkpoints = new CheckpointRepository();
const metrics = new MetricRepository();

const checkpointView = (item: {
  id: string;
  decisionId: string;
  scheduledFor: Date;
  completedAt: Date | null;
  score: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  ...item,
  scheduledFor: item.scheduledFor.toISOString(),
  completedAt: item.completedAt?.toISOString() ?? null,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

const measurementView = (item: {
  id: string;
  metricId: string;
  value: { toString(): string };
  recordedAt: Date;
  notes: string | null;
  createdAt: Date;
}) => ({
  ...item,
  value: item.value.toString(),
  recordedAt: item.recordedAt.toISOString(),
  createdAt: item.createdAt.toISOString(),
});

async function ownedCheckpoint(userId: string, id: string) {
  const item = await checkpoints.findOwned(userId, id);
  if (!item) throw new NotFoundError("Checkpoint");
  return item;
}

async function ownedMetric(userId: string, id: string) {
  const item = await metrics.findOwned(userId, id);
  if (!item) throw new NotFoundError("Metric");
  return item;
}

async function requireCheckpointWritable(userId: string, decisionId: string) {
  const decision = await requireOwnedDecision(userId, decisionId);
  if (decision.status !== "DRAFT" && decision.status !== "ACTIVE") {
    throw new ConflictError("Checkpoints require a draft or active decision.");
  }
}

export const TrackingService = {
  async listCheckpoints(userId: string, decisionId: string) {
    await requireOwnedDecision(userId, decisionId);
    const data = await checkpoints.findManyOwned(userId, decisionId);

    return data.map(checkpointView);
  },

  async createCheckpoint(
    userId: string,
    input: z.infer<typeof checkpointInput>,
  ) {
    await requireCheckpointWritable(userId, input.decisionId);
    const data = await checkpoints.create(input);

    return checkpointView(data);
  },

  async getCheckpoint(userId: string, id: string) {
    const data = await ownedCheckpoint(userId, id);

    return checkpointView(data);
  },

  async patchCheckpoint(
    userId: string,
    id: string,
    input: z.infer<typeof checkpointPatch>,
  ) {
    const item = await ownedCheckpoint(userId, id);
    await requireCheckpointWritable(userId, item.decisionId);

    const data = await checkpoints.update(id, input);

    return checkpointView(data);
  },

  async deleteCheckpoint(userId: string, id: string) {
    const item = await ownedCheckpoint(userId, id);
    await requireCheckpointWritable(userId, item.decisionId);

    await checkpoints.delete(id);
  },

  async listMetrics(userId: string, decisionId: string) {
    await requireOwnedDecision(userId, decisionId);
    const data = await metrics.findManyOwned(userId, decisionId);

    return data.map(({ createdAt, updatedAt, ...item }) => ({
      ...item,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    }));
  },

  async getMetric(userId: string, id: string) {
    const { createdAt, updatedAt, ...item } = await ownedMetric(userId, id);

    return {
      ...item,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  },

  async createMeasurement(
    userId: string,
    id: string,
    input: z.infer<typeof measurementInput>,
  ) {
    const metric = await ownedMetric(userId, id);
    const decision = await requireOwnedDecision(userId, metric.decisionId);

    if (decision.status !== "ACTIVE") {
      throw new ConflictError("Decision must be ACTIVE for this operation.");
    }
    const data = await metrics.createMeasurement(id, input);

    return measurementView(data);
  },

  async listMeasurements(userId: string, id: string) {
    await ownedMetric(userId, id);
    const data = await metrics.findMeasurementsOwned(userId, id);

    return data.map(measurementView);
  },
};
