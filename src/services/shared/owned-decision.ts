import { NotFoundError } from "../../errors/AppError.js";
import { OwnedDecisionRepository } from "../../repositories/decisions/owned-decision.repository.js";

const repository = new OwnedDecisionRepository();

export async function requireOwnedDecision(userId: string, decisionId: string) {
  const decision = await repository.findOwned(userId, decisionId);

  if (!decision) {
    throw new NotFoundError("Decision");
  }

  return decision;
}
