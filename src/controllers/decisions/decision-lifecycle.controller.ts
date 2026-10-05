import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import { DecisionLifecycleService } from "../../services/decisions/decision-lifecycle.service.js";
import type {
  commitDecisionRoute,
  reviewDecisionRoute,
} from "../../routes/decisions/decision-lifecycle.routes.js";

const decisionService = new DecisionLifecycleService();

export const commitDecision: RouteHandler<
  typeof commitDecisionRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const response = await decisionService.commit(user.id, id, body);

  return c.json(response, 200);
};

export const reviewDecision: RouteHandler<
  typeof reviewDecisionRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const response = await decisionService.review(user.id, id, body);

  return c.json(response, 201);
};
