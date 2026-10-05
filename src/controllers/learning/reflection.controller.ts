import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import type {
  listReflectionsRoute,
  getReflectionRoute,
} from "../../routes/learning/reflection.routes.js";
import { LearningService } from "../../services/learning/learning.service.js";

export const listReflections: RouteHandler<
  typeof listReflectionsRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const decisionId = c.req.valid("query").decisionId;

  const response = await LearningService.listReflections(user.id, decisionId);

  return c.json(response, 200);
};

export const getReflection: RouteHandler<
  typeof getReflectionRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const reflectionId = c.req.valid("param").id;

  const response = await LearningService.getReflection(user.id, reflectionId);

  return c.json(response, 200);
};
