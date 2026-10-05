import type { CreateAlternativeInput } from "../../schemas/decisions/decision-alternative.schema.js";
import { DecisionAlternativeRepository } from "../../repositories/decisions/decision-alternative.repository.js";
import { toAlternative } from "../../transformers/decisions/index.js";

export class DecisionAlternativeService {
  constructor(
    private readonly repository = new DecisionAlternativeRepository(),
  ) {}

  async addAlternative(
    userId: string,
    decisionId: string,
    input: CreateAlternativeInput,
  ) {
    const data = await this.repository.addAlternative(
      userId,
      decisionId,
      input,
    );

    return toAlternative(data);
  }

  async listAlternatives(userId: string, decisionId: string) {
    const data = await this.repository.listAlternatives(userId, decisionId);

    return data.map(toAlternative);
  }

  async getAlternative(
    userId: string,
    decisionId: string,
    alternativeId: string,
  ) {
    const data = await this.repository.getAlternative(
      userId,
      decisionId,
      alternativeId,
    );

    return toAlternative(data);
  }

  async deleteAlternative(
    userId: string,
    decisionId: string,
    alternativeId: string,
  ) {
    await this.repository.deleteAlternative(userId, decisionId, alternativeId);
  }
}
