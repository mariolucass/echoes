import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import { DecisionService } from "../../services/decisions/index.js";
import type {
  createDraftRoute,
  getDecisionDetailRoute,
  addMetricRoute,
} from "../../routes/decisions/decision.routes.js";
import type {
  listDecisionsRoute,
  softDeleteDecisionRoute,
} from "../../routes/decisions/index.js";

const decisionService = new DecisionService();

export const listDecisions: RouteHandler<
  typeof listDecisionsRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const query = c.req.valid("query");

  const response = await decisionService.getAll(user.id, query);

  return c.json(response);
};

export const softDeleteDecision: RouteHandler<
  typeof softDeleteDecisionRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user").id;
  const id = c.req.valid("param").id;

  await decisionService.softDelete(user, id);

  return c.body(null, 204);
};

export const createDraft: RouteHandler<
  typeof createDraftRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");

  const response = await decisionService.createDraft(user.id, body);

  return c.json(response, 201);
};

export const getDecisionDetail: RouteHandler<
  typeof getDecisionDetailRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  const response = await decisionService.getDetail(user.id, id);

  return c.json(response, 200);
};

export const addMetric: RouteHandler<typeof addMetricRoute, AppEnv> = async (
  c,
) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const response = await decisionService.addMetric(user.id, id, body);

  return c.json(response, 201);
};
