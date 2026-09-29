import type {
  CommitDecisionInput,
  CreateAlternativeInput,
  CreateDecisionInput,
  CreateMetricInput,
  CreateReviewInput,
} from "../../schemas/decisions/decision.schema.js";
import type { DecisionQuery } from "../../interfaces/decision/decision.interface.js";
import { DecisionRepository } from "../../repositories/decisions/index.js";
import { requireDeletedDecision } from "../../middlewares/decisions/index.js";
import {
  decisionEvents,
  type DecisionEventPublisher,
} from "../../events/index.js";
import {
  toAlternative,
  toMetric,
  toDecisionDetail,
  toDecisionListItem,
} from "../../transformers/decisions/index.js";
import {
  createPaginatedResponse,
  createPaginatedResponseWithoutCount,
} from "../../utils/paginate.js";

export class DecisionService {
  constructor(
    private readonly repository = new DecisionRepository(),
    private readonly events: DecisionEventPublisher = decisionEvents,
  ) {}

  async getAll(userId: string, query: DecisionQuery) {
    const { data, total } = await this.repository.findPage(userId, query);
    return createPaginatedResponse(
      data.map(toDecisionListItem),
      total,
      query,
      "/decisions",
    );
  }

  async getAllWithoutCount(userId: string, query: DecisionQuery) {
    const data = await this.repository.findPageWithoutCount(userId, query);
    return createPaginatedResponseWithoutCount(
      data.map(toDecisionListItem),
      query.page,
      query.limit,
    );
  }

  async softDelete(userId: string, id: string): Promise<void> {
    requireDeletedDecision(await this.repository.softDelete(userId, id));
  }
  async createDraft(userId: string, input: CreateDecisionInput) {
    return toDecisionDetail(await this.repository.createDraft(userId, input));
  }

  async addAlternative(
    userId: string,
    decisionId: string,
    input: CreateAlternativeInput,
  ) {
    return toAlternative(
      await this.repository.addAlternative(userId, decisionId, input),
    );
  }

  async listAlternatives(userId: string, decisionId: string) {
    return (await this.repository.listAlternatives(userId, decisionId)).map(toAlternative);
  }

  async getAlternative(userId: string, decisionId: string, alternativeId: string) {
    return toAlternative(await this.repository.getAlternative(userId, decisionId, alternativeId));
  }

  async deleteAlternative(userId: string, decisionId: string, alternativeId: string) {
    await this.repository.deleteAlternative(userId, decisionId, alternativeId);
  }

  async addMetric(
    userId: string,
    decisionId: string,
    input: CreateMetricInput,
  ) {
    return toMetric(await this.repository.addMetric(userId, decisionId, input));
  }

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

  async getDetail(userId: string, decisionId: string) {
    return toDecisionDetail(
      await this.repository.getDetail(userId, decisionId),
    );
  }
}
