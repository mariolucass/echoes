import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import type {
  listOutcomesRoute,
  getOutcomeRoute,
  listOutcomeAssessmentsRoute,
} from "../../routes/learning/outcome.routes.js";
import { LearningService } from "../../services/learning/learning.service.js";

export const listOutcomes: RouteHandler<
  typeof listOutcomesRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const decisionId = c.req.valid("query").decisionId;

  const response = await LearningService.listOutcomes(user.id, decisionId);

  return c.json(response, 200);
};

export const getOutcome: RouteHandler<typeof getOutcomeRoute, AppEnv> = async (
  c,
) => {
  const user = c.get("user");
  const outcomeId = c.req.valid("param").id;

  const response = await LearningService.getOutcome(user.id, outcomeId);

  return c.json(response, 200);
};

export const listOutcomeAssessments: RouteHandler<
  typeof listOutcomeAssessmentsRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const outcomeId = c.req.valid("param").id;

  const response = await LearningService.listAssessments(user.id, outcomeId);

  return c.json(response, 200);
};
