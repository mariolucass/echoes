import type { Prisma } from "../../generated/prisma/client.js";
import { decisionListProjection } from "./decision.projection.js";

// Reports need event dates and checkpoints that are absent from the HTTP list DTO.
export const decisionReportProjection = {
  ...decisionListProjection,
  rationale: true,
  chosenAlternativeId: true,
  alternatives: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
  expectations: {
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      targets: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      assessments: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] },
    },
  },
  metrics: {
    orderBy: [{ name: "asc" }, { id: "asc" }],
    include: {
      measurements: { orderBy: [{ recordedAt: "desc" }, { id: "desc" }] },
    },
  },
  outcomes: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
  reflections: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
  checkpoints: { orderBy: [{ scheduledFor: "asc" }, { id: "asc" }] },
  revisions: { orderBy: { version: "asc" } },
  tags: { include: { tag: true }, orderBy: { tagId: "asc" } },
} as const satisfies Prisma.DecisionSelect;

export type ReportDecision = Prisma.DecisionGetPayload<{
  select: typeof decisionReportProjection;
}>;
