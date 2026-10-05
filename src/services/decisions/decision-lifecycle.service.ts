import type {
  CommitDecisionInput,
  CreateReviewInput,
} from "../../schemas/decisions/decision-lifecycle.schema.js";
import { DecisionLifecycleRepository } from "../../repositories/decisions/decision-lifecycle.repository.js";
import {
  decisionEvents,
  type DecisionEventPublisher,
} from "../../events/index.js";
import { toDecisionDetail } from "../../transformers/decisions/index.js";

export class DecisionLifecycleService {
  constructor(
    private readonly repository = new DecisionLifecycleRepository(),
    private readonly events: DecisionEventPublisher = decisionEvents,
  ) {}

  async commit(userId: string, decisionId: string, input: CommitDecisionInput) {
    const result = await this.repository.commit(userId, decisionId, input);
    await this.events.publish({
      type: "decision.committed.v1",
      decisionId,
      userId,
      occurredAt: result.decision.decidedAt!.toISOString(),
      revisionId: result.revisionId,
    });
    return {
      ...toDecisionDetail(result.decision),
      revisionId: result.revisionId,
    };
  }

  async review(userId: string, decisionId: string, input: CreateReviewInput) {
    const result = await this.repository.review(userId, decisionId, input);

    await this.events.publish({
      type: "decision.reviewed.v1",
      decisionId,
      userId,
      occurredAt: new Date().toISOString(),
      outcomeId: result.outcomeId,
      status: result.status,
    });

    return result;
  }
}
