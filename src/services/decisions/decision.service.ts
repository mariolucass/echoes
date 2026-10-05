import type {
  CreateDecisionInput,
  CreateMetricInput,
} from "../../schemas/decisions/decision.schema.js";
import type { DecisionQuery } from "../../interfaces/decision/decision.interface.js";
import { DecisionRepository } from "../../repositories/decisions/index.js";
import { requireDeletedDecision } from "../../middlewares/decisions/index.js";
import {
  toMetric,
  toDecisionDetail,
  toDecisionListItem,
} from "../../transformers/decisions/index.js";
import {
  createPaginatedResponse,
  createPaginatedResponseWithoutCount,
} from "../../utils/paginate.js";

export class DecisionService {
  constructor(private readonly repository = new DecisionRepository()) {}

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

  async createDraft(userId: string, input: CreateDecisionInput) {
    const data = await this.repository.createDraft(userId, input);

    return toDecisionDetail(data);
  }

  async addMetric(
    userId: string,
    decisionId: string,
    input: CreateMetricInput,
  ) {
    const data = await this.repository.addMetric(userId, decisionId, input);

    return toMetric(data);
  }

  async getDetail(userId: string, decisionId: string) {
    const data = await this.repository.getDetail(userId, decisionId);

    return toDecisionDetail(data);
  }

  async softDelete(userId: string, id: string): Promise<void> {
    requireDeletedDecision(await this.repository.softDelete(userId, id));
  }
}
