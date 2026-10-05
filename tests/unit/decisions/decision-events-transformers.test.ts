import { describe, expect, it, vi } from "vitest";
import { logger } from "../../../src/config/logger.js";
import {
  DecisionEventBus,
  type DecisionEventPublisher,
} from "../../../src/events/index.js";
import { alternativeResponseSchema } from "../../../src/schemas/decisions/decision-alternative.schema.js";
import { commitResponseSchema } from "../../../src/schemas/decisions/decision-lifecycle.schema.js";
import {
  decisionDetailSchema,
  decisionSchema,
  draftResponseSchema,
  metricResponseSchema,
} from "../../../src/schemas/decisions/decision.schema.js";
import { expectationResponseSchema } from "../../../src/schemas/decisions/expectation.schema.js";
import { DecisionLifecycleService } from "../../../src/services/decisions/decision-lifecycle.service.js";
import { logDecisionActivity } from "../../../src/subscribers/decision-activity.subscriber.js";
import {
  createDecisionSnapshot,
  toDecisionDetail,
  toDecisionListItem,
} from "../../../src/transformers/decisions/index.js";
import { createDecisionLifecycleRepositoryFake } from "../../support/fakes/decision-lifecycle-repository.js";

const id = "32b55aa9-0df9-4a99-9e2a-68cda0e658de";
const timestamp = new Date("2026-09-25T12:00:00.000Z");
const decimal = (value: string) => ({ toString: () => value });

describe("decision transformers", () => {
  it("returns the documented list and detail formats without internal fields", () => {
    const listRecord = {
      id,
      title: "Trocar de emprego",
      description: null,
      context: null,
      status: "ACTIVE",
      decidedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      userId: "private-user-id",
    } as unknown as Parameters<typeof toDecisionListItem>[0];
    const item = toDecisionListItem(listRecord);
    expect(decisionSchema.parse(item)).toEqual(item);
    expect(item).not.toHaveProperty("userId");
    expect(item.decidedAt).toBe(timestamp.toISOString());

    const detailRecord = {
      ...listRecord,
      rationale: "Melhor oportunidade",
      chosenAlternativeId: id,
      alternatives: [
        {
          id,
          title: "Aceitar",
          description: null,
          pros: null,
          cons: null,
          createdAt: timestamp,
        },
      ],
      metrics: [
        {
          id,
          name: "Salário",
          unit: "BRL",
          measurements: [
            {
              id,
              value: decimal("12500.00"),
              recordedAt: timestamp,
              notes: null,
            },
          ],
        },
      ],
      expectations: [
        {
          id,
          description: "Ganhar mais",
          expectedImpact: decimal("7.50"),
          targets: [
            {
              id,
              metricId: id,
              operator: "GTE",
              targetValue: decimal("12000.00"),
              baselineValue: null,
              evaluateAt: timestamp,
            },
          ],
          assessments: [{ id, outcomeId: id, result: "MET", notes: null }],
        },
      ],
      outcomes: [
        {
          id,
          description: "Aumento",
          impact: decimal("8.00"),
          occurredAt: timestamp,
        },
      ],
      reflections: [
        {
          id,
          content: "Valeu a escolha",
          satisfactionScore: 9,
          regretScore: 1,
        },
      ],
      revisions: [
        {
          id,
          version: 1,
          snapshot: { schemaVersion: 1 },
          createdAt: timestamp,
        },
      ],
    } as unknown as Parameters<typeof toDecisionDetail>[0];
    const detail = toDecisionDetail(detailRecord);
    expect(decisionDetailSchema.parse(detail)).toEqual(detail);
    expect(detail).not.toHaveProperty("userId");
    expect(detail.metrics[0]?.measurements[0]?.value).toBe("12500.00");
    expect(detail.expectations[0]?.targets[0]?.evaluateAt).toBe(
      timestamp.toISOString(),
    );
    expect(alternativeResponseSchema.parse(detail.alternatives[0])).toEqual(
      detail.alternatives[0],
    );
    expect(metricResponseSchema.parse(detail.metrics[0])).toEqual(
      detail.metrics[0],
    );
    expect(expectationResponseSchema.parse(detail.expectations[0])).toEqual(
      detail.expectations[0],
    );
    expect(
      commitResponseSchema.parse({ ...detail, revisionId: id }).revisionId,
    ).toBe(id);
    expect(
      draftResponseSchema.parse({ ...detail, status: "DRAFT" }).status,
    ).toBe("DRAFT");
  });

  it("keeps the versioned snapshot independent from the HTTP detail", () => {
    const record = {
      title: "Trocar de emprego",
      description: null,
      context: null,
      alternatives: [
        { id, title: "Aceitar", description: null, pros: null, cons: null },
      ],
      metrics: [{ id, name: "Salário", unit: "BRL" }],
      expectations: [
        {
          id,
          description: "Ganhar mais",
          expectedImpact: decimal("7.50"),
          targets: [
            {
              id,
              metricId: id,
              operator: "GTE",
              targetValue: decimal("12000.00"),
              baselineValue: null,
              evaluateAt: timestamp,
            },
          ],
        },
      ],
    } as unknown as Parameters<typeof createDecisionSnapshot>[0];
    const snapshot = createDecisionSnapshot(record, id, "Melhor oportunidade");
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.expectations[0]?.targets[0]).toMatchObject({
      targetValue: "12000.00",
      evaluateAt: timestamp.toISOString(),
    });
  });
});

describe("decision events and subscriber", () => {
  const committed = {
    type: "decision.committed.v1" as const,
    decisionId: id,
    userId: id,
    occurredAt: timestamp.toISOString(),
    revisionId: id,
  };

  it("delivers to all subscribers and isolates a failing subscriber", async () => {
    const bus = new DecisionEventBus();
    const errorLog = vi.spyOn(logger, "error").mockImplementation(() => logger);
    const received = vi.fn();
    bus.subscribe(() => {
      throw new Error("log unavailable");
    });
    const unsubscribe = bus.subscribe(received);
    try {
      await expect(bus.publish(committed)).resolves.toBeUndefined();
      expect(received).toHaveBeenCalledWith(committed);
      expect(errorLog).toHaveBeenCalledOnce();
      unsubscribe();
      await bus.publish(committed);
      expect(received).toHaveBeenCalledOnce();
    } finally {
      errorLog.mockRestore();
    }
  });

  it("publishes only after successful persistence and logs the event without private content", async () => {
    const publish = vi
      .fn<DecisionEventPublisher["publish"]>()
      .mockResolvedValue(undefined);
    const committedDecision = {
      id,
      title: "Trocar de emprego",
      description: null,
      context: null,
      status: "ACTIVE",
      decidedAt: timestamp,
      rationale: "Private rationale",
      chosenAlternativeId: id,
      createdAt: timestamp,
      updatedAt: timestamp,
      alternatives: [],
      metrics: [],
      expectations: [],
      outcomes: [],
      reflections: [],
      revisions: [
        {
          id,
          version: 1,
          snapshot: { schemaVersion: 1 },
          createdAt: timestamp,
        },
      ],
    };
    const { fake, repository } = createDecisionLifecycleRepositoryFake();
    fake.commit.mockResolvedValue({
      decision: committedDecision,
      revisionId: id,
    } as never);
    fake.review.mockResolvedValue({
      outcomeId: id,
      assessmentIds: [],
      measurementIds: [],
      reflectionId: null,
      status: "COMPLETED",
    });
    const service = new DecisionLifecycleService(repository, { publish });

    const response = await service.commit(id, id, {
      chosenAlternativeId: id,
      rationale: "Private rationale",
    });
    expect(response).toMatchObject({
      id,
      status: "ACTIVE",
      revisionId: id,
      revisions: [{ id }],
    });
    expect(publish).toHaveBeenCalledWith(committed);
    await service.review(id, id, {
      outcome: { description: "Private outcome" },
      assessments: [],
      measurements: [],
      complete: true,
    });
    expect(publish).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: "decision.reviewed.v1",
        decisionId: id,
        outcomeId: id,
        status: "COMPLETED",
      }),
    );

    const infoLog = vi.spyOn(logger, "info").mockImplementation(() => logger);
    try {
      logDecisionActivity(committed);
      expect(infoLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: committed.type,
          decisionId: id,
          revisionId: id,
        }),
        "Decision committed",
      );
      expect(JSON.stringify(infoLog.mock.calls)).not.toContain(
        "Private rationale",
      );
    } finally {
      infoLog.mockRestore();
    }

    vi.mocked(repository.commit).mockRejectedValueOnce(
      new Error("transaction rolled back"),
    );
    await expect(
      service.commit(id, id, {
        chosenAlternativeId: id,
        rationale: "Private rationale",
      }),
    ).rejects.toThrow("transaction rolled back");
    expect(publish).toHaveBeenCalledTimes(2);
  });
});
