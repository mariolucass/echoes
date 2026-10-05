import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import type {
  listTagsRoute,
  createTagRoute,
  updateTagRoute,
  removeTagRoute,
} from "../../routes/classification/tag.routes.js";
import { TagService } from "../../services/classification/tag.service.js";

export const listTags: RouteHandler<typeof listTagsRoute, AppEnv> = async (
  c,
) => {
  const user = c.get("user");

  const response = await TagService.list(user.id);

  return c.json(response, 200);
};

export const createTag: RouteHandler<typeof createTagRoute, AppEnv> = async (
  c,
) => {
  const user = c.get("user");
  const body = c.req.valid("json");

  const response = await TagService.create(user.id, body.name);

  return c.json(response, 201);
};

export const updateTag: RouteHandler<typeof updateTagRoute, AppEnv> = async (
  c,
) => {
  const user = c.get("user");
  const params = c.req.valid("param");
  const body = c.req.valid("json");

  const response = await TagService.update(user.id, params.id, body.name);

  return c.json(response, 200);
};

export const removeTag: RouteHandler<typeof removeTagRoute, AppEnv> = async (
  c,
) => {
  const user = c.get("user");
  const params = c.req.valid("param");

  await TagService.remove(user.id, params.id);
  return c.body(null, 204);
};
