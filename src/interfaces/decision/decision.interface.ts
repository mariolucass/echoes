import type { DecisionStatus } from "../../generated/prisma/enums.js";
import type { decisionQuerySchema } from "../../schemas/decisions/index.js";
import type { z } from "@hono/zod-openapi";

export { DecisionStatus } from "../../generated/prisma/enums.js";

export const decisionSortableFields = [
  "title",
  "description",
  "context",
  "status",
  "decidedAt",
  "createdAt",
  "updatedAt",
] as const;

export type DecisionSortableField = (typeof decisionSortableFields)[number];

export interface DecisionQuery extends z.infer<typeof decisionQuerySchema> {}

export interface Decision {
  id: string;
  title: string;
  description: string | null;
  context: string | null;
  status: DecisionStatus;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CreateDecisionDTO {
  title: string;
  description?: string | null;
  context?: string | null;
  status?: DecisionStatus;
  decidedAt?: Date | null;
}

export type UpdateDecisionDTO = Partial<CreateDecisionDTO>;
