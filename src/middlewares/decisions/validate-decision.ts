import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../errors/AppError.js";

export function requireDecision<T>(decision: T | null): T {
  if (!decision) {
    throw new NotFoundError("Decision");
  }
  return decision;
}

export function requireDeletedDecision(deleted: boolean): void {
  if (!deleted) {
    throw new NotFoundError("Decision");
  }
}

export function requireWritableDecision(
  exists: boolean,
  status: "DRAFT" | "ACTIVE",
): never {
  if (!exists) {
    throw new NotFoundError("Decision");
  }
  throw new ConflictError(`Decision must be ${status} for this operation.`);
}

export function requireRelatedIds(
  metricIds: string[],
  expectationIds: string[],
  foundMetricCount: number,
  foundExpectationCount: number,
): void {
  if (
    foundMetricCount !== new Set(metricIds).size ||
    foundExpectationCount !== new Set(expectationIds).size
  ) {
    throw new ValidationError(
      "A metric or expectation does not belong to this decision.",
    );
  }
}

export function requireCommitReady(
  alternativeIds: string[],
  expectationCount: number,
  chosenAlternativeId: string,
): void {
  if (alternativeIds.length === 0 || expectationCount === 0) {
    throw new ConflictError(
      "Add at least one alternative and one expectation before committing.",
    );
  }
  if (!alternativeIds.includes(chosenAlternativeId)) {
    throw new ValidationError(
      "The chosen alternative does not belong to this decision.",
    );
  }
}

export function requireReviewComplete(
  allExpectationsAssessed: boolean,
  hasReflection: boolean,
): void {
  if (!allExpectationsAssessed || !hasReflection) {
    throw new ConflictError(
      "Assess every expectation and add a reflection before completing.",
    );
  }
}
