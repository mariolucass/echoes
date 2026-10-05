import type { ReportDecision } from "../../../src/projections/decisions/decision-report.projection.js";
import { Prisma } from "../../../src/generated/prisma/client.js";

export const reportNow = new Date("2026-09-29T15:00:00Z");
const createdAt = new Date("2026-09-01T12:00:00Z");
export const decimal = (value: string) => new Prisma.Decimal(value);

export function reportDecision(
  overrides: Partial<ReportDecision> = {},
): ReportDecision {
  return {
    id: "9f1c2e4a-5b6d-4f8e-9a1b-2c3d4e5f6a7b",
    title: "Reduzir o tempo de deslocamento",
    status: "ACTIVE",
    description: "Avaliar a mudança para o trabalho híbrido.",
    context:
      "Preservar tempo para estudo sem reduzir a colaboração com a equipe.",
    rationale: "Testar três dias de trabalho remoto por semana durante um mês.",
    chosenAlternativeId: "alternative-1",
    decidedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    alternatives: [
      {
        id: "alternative-1",
        decisionId: "decision",
        title: "Trabalho híbrido",
        description: null,
        pros: "Menos deslocamento",
        cons: "Exige organização",
        createdAt,
      },
    ],
    expectations: [
      {
        id: "expectation-1",
        decisionId: "decision",
        description: "Reduzir o deslocamento semanal para até 4 horas.",
        expectedImpact: decimal("7.5"),
        createdAt,
        updatedAt: createdAt,
        targets: [
          {
            id: "target-1",
            decisionId: "decision",
            expectationId: "expectation-1",
            metricId: "metric-1",
            operator: "LTE",
            targetValue: decimal("4"),
            baselineValue: decimal("10"),
            evaluateAt: new Date("2026-09-20T15:00:00Z"),
            createdAt,
          },
        ],
        assessments: [],
      },
    ],
    metrics: [
      {
        id: "metric-1",
        decisionId: "decision",
        name: "Deslocamento semanal",
        unit: "h",
        createdAt,
        updatedAt: createdAt,
        measurements: [
          {
            id: "measurement-2",
            metricId: "metric-1",
            value: decimal("3"),
            recordedAt: new Date("2026-09-25T12:00:00Z"),
            createdAt,
            notes: "Semana com menos reuniões presenciais.",
          },
          {
            id: "measurement-1",
            metricId: "metric-1",
            value: decimal("5"),
            recordedAt: new Date("2026-09-19T12:00:00Z"),
            createdAt,
            notes: null,
          },
        ],
      },
    ],
    checkpoints: [
      {
        id: "checkpoint-1",
        decisionId: "decision",
        scheduledFor: new Date("2026-09-22T12:00:00Z"),
        completedAt: null,
        score: 0,
        notes: "Rever a agenda de reuniões",
        createdAt,
        updatedAt: createdAt,
      },
    ],
    outcomes: [],
    reflections: [],
    revisions: [],
    tags: [],
    ...overrides,
  };
}
