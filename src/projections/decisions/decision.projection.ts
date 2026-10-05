export const decisionListProjection = {
  id: true,
  title: true,
  description: true,
  context: true,
  status: true,
  decidedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;
export const decisionCommitProjection = {
  alternatives: { orderBy: { createdAt: "asc" as const } },
  expectations: {
    include: { targets: true },
    orderBy: { createdAt: "asc" as const },
  },
  metrics: { orderBy: { createdAt: "asc" as const } },
} as const;

export const decisionDetailProjection = {
  alternatives: { orderBy: { createdAt: "asc" as const } },
  metrics: {
    include: { measurements: { orderBy: { recordedAt: "asc" as const } } },
  },
  expectations: { include: { targets: true, assessments: true } },
  outcomes: { orderBy: { occurredAt: "asc" as const } },
  reflections: { orderBy: { createdAt: "asc" as const } },
  revisions: { orderBy: { version: "asc" as const } },
} as const;
