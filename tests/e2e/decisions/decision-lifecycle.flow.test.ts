import { randomUUID } from "node:crypto";
import { OpenAPIHono } from "@hono/zod-openapi";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import prisma from "../../../src/database/prisma.js";
import { errorHandler } from "../../../src/errors/errorHandler.js";
import type { AppEnv } from "../../../src/interfaces/hono.js";
import {
  decisionRoutes,
  expectationRoutes,
} from "../../../src/routes/decisions/index.js";
import { defaultHook } from "../../../src/utils/openapi-hook.js";
import { signAccessToken } from "../../../src/utils/jwt.js";
import { decisionDraft } from "../../support/builders/decision-draft.js";
import { resetTestData } from "../../support/database/reset-test-data.js";
import { authenticatedRequest } from "../../support/http/authenticated-request.js";

describe("decision flow with PostgreSQL", () => {
  const app = new OpenAPIHono<AppEnv>({ defaultHook });
  app.route("/decisions", decisionRoutes);
  app.route("/decisions", expectationRoutes);
  app.onError(errorHandler);

  beforeEach(resetTestData);
  afterEach(resetTestData);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("keeps the initial choice, enforces ownership and reviews the result", async () => {
    const ownerId = randomUUID();
    const otherId = randomUUID();
    await prisma.user.createMany({
      data: [ownerId, otherId].map((id) => ({
        id,
        name: "Flow test",
        email: `${id}@example.test`,
        passwordHash: "test",
      })),
    });
    const ownerToken = await signAccessToken(ownerId);
    const otherToken = await signAccessToken(otherId);
    const request = (
      path: string,
      token: string,
      method = "GET",
      body?: unknown,
    ) => authenticatedRequest(app, token, path, method, body);

    const draftRes = await request(
      "/decisions",
      ownerToken,
      "POST",
      decisionDraft({ title: "Trocar de emprego", context: "Oferta recebida" }),
    );
    expect(draftRes.status, await draftRes.clone().text()).toBe(201);
    const draft = (await draftRes.json()) as {
      id: string;
      title: string;
      context: string;
      status: string;
      alternatives: unknown[];
    };
    expect(draft.status).toBe("DRAFT");
    expect(draft).toMatchObject({
      title: "Trocar de emprego",
      context: "Oferta recebida",
      alternatives: [],
    });

    const alternativeRes = await request(
      `/decisions/${draft.id}/alternatives`,
      ownerToken,
      "POST",
      {
        title: "Aceitar oferta",
        pros: "Aprender mais",
      },
    );
    expect(alternativeRes.status).toBe(201);
    const alternative = (await alternativeRes.json()) as {
      id: string;
      title: string;
      pros: string;
      createdAt: string;
    };
    expect(alternative).toMatchObject({
      title: "Aceitar oferta",
      pros: "Aprender mais",
    });
    expect(alternative.createdAt).toBeTruthy();

    const metricRes = await request(
      `/decisions/${draft.id}/metrics`,
      ownerToken,
      "POST",
      { name: "Salário", unit: "BRL" },
    );
    expect(metricRes.status).toBe(201);
    const metric = (await metricRes.json()) as {
      id: string;
      name: string;
      unit: string;
      measurements: unknown[];
    };
    expect(metric).toMatchObject({
      name: "SalÃ¡rio",
      unit: "BRL",
      measurements: [],
    });

    const expectationRes = await request(
      `/decisions/${draft.id}/expectations`,
      ownerToken,
      "POST",
      {
        description: "Melhor remuneração",
        expectedImpact: 7.5,
        targets: [
          {
            metricId: metric.id,
            operator: "GTE",
            targetValue: "12000.00",
            baselineValue: "9000.00",
          },
        ],
      },
    );
    expect(expectationRes.status).toBe(201);
    const expectation = (await expectationRes.json()) as {
      id: string;
      description: string;
      expectedImpact: string;
      targets: { metricId: string; targetValue: string }[];
    };
    expect(expectation.description).toBe("Melhor remuneraÃ§Ã£o");
    expect(expectation.expectedImpact).toBe("7.5");
    expect(expectation.targets[0]).toMatchObject({
      metricId: metric.id,
      targetValue: "12000",
    });

    const foreignDraftRes = await request("/decisions", ownerToken, "POST", {
      title: "Outra decisão",
    });
    const foreignDraft = (await foreignDraftRes.json()) as { id: string };
    const foreignAltRes = await request(
      `/decisions/${foreignDraft.id}/alternatives`,
      ownerToken,
      "POST",
      { title: "Outra opção" },
    );
    const foreignAlt = (await foreignAltRes.json()) as { id: string };
    const foreignCommit = await request(
      `/decisions/${draft.id}/commit`,
      ownerToken,
      "POST",
      {
        chosenAlternativeId: foreignAlt.id,
        rationale: "Incorreta",
      },
    );
    expect(foreignCommit.status).toBe(422);

    const commitRes = await request(
      `/decisions/${draft.id}/commit`,
      ownerToken,
      "POST",
      {
        chosenAlternativeId: alternative.id,
        rationale: "Aprendizado e salário",
      },
    );
    expect(commitRes.status).toBe(200);
    const commit = (await commitRes.json()) as {
      id: string;
      revisionId: string;
      status: string;
      chosenAlternativeId: string;
      rationale: string;
      alternatives: { id: string }[];
      revisions: { id: string }[];
    };
    expect(commit.status).toBe("ACTIVE");
    expect(commit).toMatchObject({
      id: draft.id,
      chosenAlternativeId: alternative.id,
      rationale: "Aprendizado e salÃ¡rio",
    });
    expect(commit.alternatives[0]?.id).toBe(alternative.id);
    expect(commit.revisions[0]?.id).toBe(commit.revisionId);
    expect(
      (
        await request(`/decisions/${draft.id}/commit`, ownerToken, "POST", {
          chosenAlternativeId: alternative.id,
          rationale: "Outra justificativa",
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(
          `/decisions/${draft.id}/alternatives`,
          ownerToken,
          "POST",
          { title: "Tardia" },
        )
      ).status,
    ).toBe(409);

    const detailRes = await request(`/decisions/${draft.id}`, ownerToken);
    expect(detailRes.status).toBe(200);
    const detail = (await detailRes.json()) as {
      revisions: {
        id: string;
        snapshot: {
          chosenAlternativeId: string;
          expectations: { targets: { targetValue: string }[] }[];
        };
      }[];
    };
    expect(detail.revisions).toHaveLength(1);
    expect(detail.revisions[0]?.id).toBe(commit.revisionId);
    expect(detail.revisions[0]?.snapshot.chosenAlternativeId).toBe(
      alternative.id,
    );
    expect(
      detail.revisions[0]?.snapshot.expectations[0]?.targets[0]?.targetValue,
    ).toBe("12000");

    expect((await request(`/decisions/${draft.id}`, otherToken)).status).toBe(
      404,
    );
    expect(
      (
        await request(
          `/decisions/${draft.id}/alternatives`,
          otherToken,
          "POST",
          { title: "Intrusa" },
        )
      ).status,
    ).toBe(404);

    const foreignMetricRes = await request(
      `/decisions/${foreignDraft.id}/metrics`,
      ownerToken,
      "POST",
      { name: "Outra métrica" },
    );
    const foreignMetric = (await foreignMetricRes.json()) as { id: string };
    await expect(
      prisma.expectationTarget.create({
        data: {
          decisionId: draft.id,
          expectationId: expectation.id,
          metricId: foreignMetric.id,
          operator: "GTE",
          targetValue: "1",
        },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.decisionRevision.update({
        where: { id: commit.revisionId },
        data: { version: 2 },
      }),
    ).rejects.toThrow();

    const incompleteRes = await request(
      `/decisions/${draft.id}/reviews`,
      ownerToken,
      "POST",
      {
        outcome: { description: "Primeiro mês" },
        assessments: [{ expectationId: expectation.id, result: "MET" }],
        complete: true,
      },
    );
    expect(incompleteRes.status).toBe(409);
    expect(
      await prisma.outcome.count({ where: { decisionId: draft.id } }),
    ).toBe(0);

    const reviewRes = await request(
      `/decisions/${draft.id}/reviews`,
      ownerToken,
      "POST",
      {
        outcome: { description: "Salário aumentou", impact: 8 },
        measurements: [{ metricId: metric.id, value: "12500.00" }],
        assessments: [{ expectationId: expectation.id, result: "MET" }],
        reflection: {
          content: "Valeu a escolha",
          satisfactionScore: 9,
          regretScore: 1,
        },
        complete: true,
      },
    );
    expect(reviewRes.status).toBe(201);
    const review = (await reviewRes.json()) as {
      status: string;
      measurementIds: string[];
      assessmentIds: string[];
    };
    expect(review.status).toBe("COMPLETED");
    expect(review.measurementIds).toHaveLength(1);
    expect(review.assessmentIds).toHaveLength(1);
    expect(
      (
        await request(`/decisions/${draft.id}/reviews`, ownerToken, "POST", {
          outcome: { description: "Tardia" },
          assessments: [{ expectationId: expectation.id, result: "MET" }],
        })
      ).status,
    ).toBe(409);

    const completed = (await (
      await request(`/decisions/${draft.id}`, ownerToken)
    ).json()) as {
      status: string;
      outcomes: unknown[];
      reflections: unknown[];
      expectations: { assessments: unknown[] }[];
      metrics: { measurements: unknown[] }[];
    };
    expect(completed.status).toBe("COMPLETED");
    expect(completed.outcomes).toHaveLength(1);
    expect(completed.reflections).toHaveLength(1);
    expect(completed.expectations[0]?.assessments).toHaveLength(1);
    expect(completed.metrics[0]?.measurements).toHaveLength(1);
  });
});
