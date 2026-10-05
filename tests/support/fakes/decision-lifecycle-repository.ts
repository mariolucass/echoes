import { vi } from "vitest";
import type { DecisionLifecycleRepository } from "../../../src/repositories/decisions/decision-lifecycle.repository.js";

export function createDecisionLifecycleRepositoryFake() {
  const fake = {
    commit: vi.fn<DecisionLifecycleRepository["commit"]>(),
    review: vi.fn<DecisionLifecycleRepository["review"]>(),
  };
  return { fake, repository: fake as unknown as DecisionLifecycleRepository };
}
