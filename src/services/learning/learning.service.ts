import { NotFoundError } from "../../errors/AppError.js";
import {
  OutcomeRepository,
  ReflectionRepository,
} from "../../repositories/learning/index.js";
import { requireOwnedDecision } from "../shared/owned-decision.js";

const outcomes = new OutcomeRepository();
const reflections = new ReflectionRepository();

const outcomeView = (item: {
  id: string;
  decisionId: string;
  description: string;
  impact: { toString(): string } | null;
  occurredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  ...item,
  impact: item.impact?.toString() ?? null,
  occurredAt: item.occurredAt?.toISOString() ?? null,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

const reflectionView = (item: {
  id: string;
  decisionId: string;
  content: string;
  satisfactionScore: number | null;
  regretScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  ...item,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

async function ownedOutcome(userId: string, id: string) {
  const item = await outcomes.findOwned(userId, id);
  if (!item) throw new NotFoundError("Outcome");
  return item;
}

export const LearningService = {
  async listOutcomes(userId: string, decisionId?: string) {
    if (decisionId) await requireOwnedDecision(userId, decisionId);
    return (await outcomes.findManyOwned(userId, decisionId)).map(
      ({ decision: { expectations, ...decision }, assessments, ...item }) => ({
        ...outcomeView(item),
        decision,
        expectations: expectations.map((e) => ({
          ...e,
          expectedImpact: e.expectedImpact?.toString() ?? null,
        })),
        assessments,
      }),
    );
  },

  async getOutcome(userId: string, id: string) {
    return outcomeView(await ownedOutcome(userId, id));
  },

  async listAssessments(userId: string, id: string) {
    await ownedOutcome(userId, id);
    return (await outcomes.findAssessmentsOwned(userId, id)).map(
      ({ createdAt, updatedAt, ...item }) => ({
        ...item,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      }),
    );
  },

  async listReflections(userId: string, decisionId?: string) {
    if (decisionId) await requireOwnedDecision(userId, decisionId);
    return (await reflections.findManyOwned(userId, decisionId)).map(
      reflectionView,
    );
  },

  async getReflection(userId: string, id: string) {
    const item = await reflections.findOwned(userId, id);
    if (!item) throw new NotFoundError("Reflection");
    return reflectionView(item);
  },
};
