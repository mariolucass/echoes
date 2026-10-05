import { describe, expect, it } from "vitest";
import {
  analyzeDecision,
  compareTarget,
  latestAssessment,
} from "../../../src/helpers/decisions/decision-report.helper.js";
import { DecisionReportService } from "../../../src/services/decisions/decision-report.service.js";
import {
  decimal,
  reportDecision,
  reportNow,
} from "../../support/builders/report-decision.js";

const service = new DecisionReportService(
  undefined,
  "America/Sao_Paulo",
  () => reportNow,
);
const content = (report: unknown) =>
  JSON.stringify(report);

describe("decision report evidence", () => {
  it("renders a two-page decision and a one-page panorama", async () => {
    const decision = reportDecision();
    for (const [pdf, expected] of [
      [await service.createDecisionPdf(decision), 2],
      [await service.createPdf([decision], { page: 1, limit: 12 }), 1],
      [await service.createPdf([], { page: 1, limit: 12 }), 1],
    ] as const) {
      expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)).toHaveLength(expected);
    }
  });

  it("keeps every row when a requested page contains more than twelve decisions", async () => {
    const items = Array.from({ length: 48 }, (_, i) => ({
      ...reportDecision(),
      id: `${String(i).padStart(8, "0")}-5b6d-4f8e-9a1b-2c3d4e5f6a7b`,
    }));
    expect(service.buildListReport(items, { page: 1, limit: 48 }).rows).toHaveLength(48);
    const pdf = await service.createPdf(items, { page: 1, limit: 48 });
    expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)).toHaveLength(4);
  });

  it("renders three expectations with mixed states without dropping them from the report data", async () => {
    const decision = reportDecision();
    const original = decision.expectations[0]!;
    decision.expectations.push(
      { ...original, id: "second", description: "Segunda hipótese", targets: original.targets, assessments: [{ id: "met", decisionId: decision.id, expectationId: "second", outcomeId: "outcome", result: "MET", notes: null, createdAt: reportNow, updatedAt: reportNow }] },
      { ...original, id: "third", description: "Terceira hipótese", targets: original.targets, assessments: [{ id: "partial", decisionId: decision.id, expectationId: "third", outcomeId: "outcome", result: "PARTIALLY_MET", notes: null, createdAt: reportNow, updatedAt: reportNow }] },
    );
    decision.outcomes.push({ id: "outcome", decisionId: decision.id, description: "O deslocamento diminuiu.", impact: decimal("8"), occurredAt: reportNow, createdAt: reportNow, updatedAt: reportNow });
    decision.reflections.push({ id: "reflection", decisionId: decision.id, content: "Aprendi a reservar tempo de foco.", satisfactionScore: 9, regretScore: 1, createdAt: reportNow, updatedAt: reportNow });
    decision.revisions.push({ id: "revision", decisionId: decision.id, version: 1, createdAt: reportNow, snapshot: { schemaVersion: 1, chosenAlternativeId: "alternative-1", alternatives: [{ id: "alternative-1", title: "Trabalho híbrido" }], rationale: "Experimento de um mês." } });
    const report = service.buildDetailReport(decision);
    expect(report.expectations.map(e => e.state)).toEqual(["PENDING", "MET", "PARTIALLY_MET"]);
    const pdf = await service.createDecisionPdf(decision);
    expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)).toHaveLength(2);
  });
  it("does not satisfy an expired target using a measurement after its deadline", () => {
    const decision = reportDecision();
    const result = compareTarget(
      decision,
      decision.expectations[0]!.targets[0]!,
      reportNow,
    );
    expect(result.measurement?.id).toBe("measurement-1");
    expect(result.meets).toBe(false);
    expect(result.gap?.toString()).toBe("1");
    expect(analyzeDecision(decision, reportNow).pendingTargets).toHaveLength(1);
  });

  it.each(["GTE", "LTE", "EQ"] as const)(
    "compares %s using exact decimals without losing the fourth decimal place",
    (operator) => {
      const decision = reportDecision();
      const target = decision.expectations[0]!.targets[0]!;
      target.operator = operator;
      target.targetValue = decimal("99999999999999.9998");
      decision.metrics[0]!.measurements[1]!.value = decimal(
        "99999999999999.9997",
      );
      const result = compareTarget(decision, target, reportNow);
      expect(result.meets).toBe(operator === "LTE");
      expect(result.gap?.toString()).toBe(operator === "LTE" ? "0" : "0.0001");
    },
  );

  it("keeps missing and future evidence distinct from a negative result", () => {
    const decision = reportDecision();
    decision.metrics[0]!.measurements = [decision.metrics[0]!.measurements[0]!];
    expect(
      compareTarget(decision, decision.expectations[0]!.targets[0]!, reportNow)
        .meets,
    ).toBeNull();
    decision.expectations[0]!.targets[0]!.evaluateAt = null;
    decision.metrics[0]!.measurements[0]!.recordedAt = new Date("2027-01-01Z");
    expect(
      compareTarget(decision, decision.expectations[0]!.targets[0]!, reportNow)
        .meets,
    ).toBeNull();
    const report = service.buildDetailReport(decision);
    expect(report.expectations[0]?.state).toBe("PENDING");
    expect(report.expectations[0]?.goals[0]?.measured).toBeNull();
    expect(report.pending).toContain("1 expectativa sem avaliação");
  });

  it("counts each expectation once by the latest recorded assessment, regardless of input order", () => {
    const decision = reportDecision();
    const expectation = decision.expectations[0]!;
    const base = {
      decisionId: decision.id,
      expectationId: expectation.id,
      outcomeId: "outcome",
      notes: null,
      updatedAt: reportNow,
    };
    expectation.assessments = [
      { ...base, id: "old", createdAt: new Date("2026-09-05Z"), result: "MET" },
      {
        ...base,
        id: "future",
        createdAt: new Date("2027-01-01Z"),
        result: "NOT_MET",
      },
      {
        ...base,
        id: "latest",
        createdAt: new Date("2026-09-28Z"),
        result: "INCONCLUSIVE",
      },
    ];
    expect(latestAssessment(expectation, reportNow)?.id).toBe("latest");
    expect(analyzeDecision(decision, reportNow).counts).toEqual({
      MET: 0,
      PARTIALLY_MET: 0,
      NOT_MET: 0,
      INCONCLUSIVE: 1,
      pending: 0,
    });
  });

  it("shows scope, filters, missing snapshots and useful empty states", () => {
    const report = content(
      service.buildListReport([], {
        page: 4,
        limit: 12,
        status: "ACTIVE",
        search: "carreira",
        sortBy: "title",
        order: "asc",
      }),
    );
    expect(report).toContain("Página 4");
    expect(report).toContain("Página 4");
    expect(report).toContain("carreira");
    expect(report).toContain("título, crescente");
    expect(service.buildListReport([], { page: 4, limit: 12 }).rows).toHaveLength(0);
    expect(report).not.toMatch(/NaN|Infinity/);
    expect(service.buildDetailReport(reportDecision()).receipt).toBeUndefined();
  });

  it("gives lifecycle-appropriate guidance and preserves zero scores and negative impacts", () => {
    expect(
      analyzeDecision(
        reportDecision({ status: "COMPLETED" }),
        reportNow,
      ).actions.join(),
    ).not.toContain("Registre");
    const decision = reportDecision({
      status: "DRAFT",
      alternatives: [],
      expectations: [],
    });
    expect(analyzeDecision(decision, reportNow).actions.join()).toContain(
      "Registre ao menos uma alternativa",
    );
    decision.outcomes.push({
      id: "o",
      decisionId: decision.id,
      description: "Resultado",
      impact: decimal("-2.5"),
      occurredAt: null,
      createdAt: reportNow,
      updatedAt: reportNow,
    });
    decision.reflections.push({
      id: "r",
      decisionId: decision.id,
      content: "Aprendi a reservar tempo de foco.",
      satisfactionScore: 0,
      regretScore: 0,
      createdAt: reportNow,
      updatedAt: reportNow,
    });
    const report = service.buildDetailReport(decision);
    expect(report.stats.observed).toBe(-2.5);
    expect(report.stats.satisfaction).toBe(0);
    expect(report.stats.regret).toBe(0);
  });

  it("presents the immutable original choice without replacing it with current fields", () => {
    const decision = reportDecision();
    decision.revisions.push({
      id: "revision",
      decisionId: decision.id,
      version: 1,
      createdAt: reportNow,
      snapshot: {
        schemaVersion: 1,
        title: "Título original",
        context: "Contexto original",
        chosenAlternativeId: "original",
        rationale: "Motivação original",
        alternatives: [{ id: "original", title: "Opção original" }],
        expectations: [
          {
            description: "Hipótese original",
            expectedImpact: "0",
            targets: [],
          },
        ],
      },
    });
    const report = service.buildDetailReport(decision);
    expect(report.receipt?.fields).toContainEqual({ label: "Escolha original", value: "Opção original" });
    expect(report.receipt?.fields).toContainEqual({ label: "Justificativa original", value: "Motivação original" });
    expect(report.receipt?.checksum).toMatch(/^[0-9A-F]{8}$/);
    expect(service.buildDetailReport(decision).receipt?.checksum).toBe(report.receipt?.checksum);
    expect(report.choice).toBe("Trabalho híbrido");
  });
});
