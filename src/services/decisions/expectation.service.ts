import type { CreateExpectationInput } from "../../schemas/decisions/expectation.schema.js";
import { ExpectationRepository } from "../../repositories/decisions/expectation.repository.js";
import { toExpectation } from "../../transformers/decisions/index.js";

export class ExpectationService {
  constructor(private readonly repository = new ExpectationRepository()) {}

  async addExpectation(
    userId: string,
    decisionId: string,
    input: CreateExpectationInput,
  ) {
    return toExpectation(
      await this.repository.addExpectation(userId, decisionId, input),
    );
  }
}
