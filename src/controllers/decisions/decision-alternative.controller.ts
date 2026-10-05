import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import { DecisionAlternativeService } from "../../services/decisions/decision-alternative.service.js";
import type {
  addAlternativeRoute,
  listAlternativesRoute,
  getAlternativeRoute,
  deleteAlternativeRoute,
} from "../../routes/decisions/decision-alternative.routes.js";

const decisionService = new DecisionAlternativeService();

export const addAlternative: RouteHandler<
  typeof addAlternativeRoute,
  AppEnv
> = async (c) => {
  const { id } = c.req.valid("param");
  const user = c.get("user");
  const body = c.req.valid("json");

  const response = await decisionService.addAlternative(user.id, id, body);

  return c.json(response, 201);
};

export const listAlternatives: RouteHandler<
  typeof listAlternativesRoute,
  AppEnv
> = async (c) => {
  const { id } = c.req.valid("param");
  const user = c.get("user");

  const response = await decisionService.listAlternatives(user.id, id);

  return c.json(response, 200);
};

export const getAlternative: RouteHandler<
  typeof getAlternativeRoute,
  AppEnv
> = async (c) => {
  const { id, alternativeId } = c.req.valid("param");
  const user = c.get("user");

  const response = await decisionService.getAlternative(
    user.id,
    id,
    alternativeId,
  );

  return c.json(response, 200);
};

export const deleteAlternative: RouteHandler<
  typeof deleteAlternativeRoute,
  AppEnv
> = async (c) => {
  const { id, alternativeId } = c.req.valid("param");
  const user = c.get("user");

  await decisionService.deleteAlternative(user.id, id, alternativeId);

  return c.body(null, 204);
};
