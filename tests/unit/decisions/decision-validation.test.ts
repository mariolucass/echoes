import { describe, expect, it } from "vitest";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../src/errors/AppError.js";
import {
  requireCommitReady,
  requireDecision,
  requireDeletedDecision,
  requireRelatedIds,
  requireReviewComplete,
  requireWritableDecision,
} from "../../../src/middlewares/decisions/index.js";

describe("decision validation contracts", () => {
  it("hides absent or foreign decisions as not found", () => {
    expect(() => requireDecision(null)).toThrow(NotFoundError);
    expect(() => requireDeletedDecision(false)).toThrow(NotFoundError);
    expect(() => requireWritableDecision(false, "DRAFT")).toThrow(
      NotFoundError,
    );
  });

  it("rejects invalid states and incomplete transitions", () => {
    expect(() => requireWritableDecision(true, "ACTIVE")).toThrow(
      ConflictError,
    );
    expect(() => requireCommitReady([], 1, "alternative")).toThrow(
      ConflictError,
    );
    expect(() => requireReviewComplete(false, true)).toThrow(ConflictError);
    expect(() => requireReviewComplete(true, false)).toThrow(ConflictError);
  });

  it("rejects foreign references and accepts valid references", () => {
    expect(() => requireRelatedIds(["metric"], [], 0, 0)).toThrow(
      ValidationError,
    );
    expect(() => requireCommitReady(["alternative"], 1, "foreign")).toThrow(
      ValidationError,
    );
    expect(() =>
      requireRelatedIds(["metric", "metric"], [], 1, 0),
    ).not.toThrow();
    expect(() =>
      requireCommitReady(["alternative"], 1, "alternative"),
    ).not.toThrow();
    expect(() => requireReviewComplete(true, true)).not.toThrow();
  });
});
