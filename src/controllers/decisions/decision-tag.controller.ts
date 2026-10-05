import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import type {
  listDecisionTagsRoute,
  attachDecisionTagRoute,
  detachDecisionTagRoute,
} from "../../routes/decisions/decision-tag.routes.js";
import { TagService } from "../../services/classification/tag.service.js";

export const listDecisionTags: RouteHandler<
  typeof listDecisionTagsRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const decisionId = c.req.valid("param").id;

  const response = await TagService.listForDecision(user.id, decisionId);

  return c.json(response, 200);
};

export const attachDecisionTag: RouteHandler<
  typeof attachDecisionTagRoute,
  AppEnv
> = async (c) => {
  const { id, tagId } = c.req.valid("param");
  const user = c.get("user");

  const response = await TagService.attach(user.id, id, tagId);

  return c.json(response, 200);
};

export const detachDecisionTag: RouteHandler<
  typeof detachDecisionTagRoute,
  AppEnv
> = async (c) => {
  const { id, tagId } = c.req.valid("param");
  const user = c.get("user");

  await TagService.detach(user.id, id, tagId);

  return c.body(null, 204);
};
