import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import {
  protectedRoute,
  routeErrors,
  idParams,
} from "../shared/domain-routes.js";
import {
  tagInput,
  tagResponse,
} from "../../schemas/classification/tag.schema.js";
import {
  listTags,
  createTag,
  updateTag,
  removeTag,
} from "../../controllers/classification/tag.controller.js";
import { defaultHook } from "../../utils/openapi-hook.js";

const router = new OpenAPIHono<AppEnv>({ defaultHook });

export const listTagsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Classification"],
  summary: "Lista tags do usuário",
  ...protectedRoute,
  responses: {
    200: {
      description: "Tags",
      content: { "application/json": { schema: tagResponse.array() } },
    },
    ...routeErrors,
  },
});

export const createTagRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Classification"],
  summary: "Cria uma tag",
  ...protectedRoute,
  request: { body: { content: { "application/json": { schema: tagInput } } } },
  responses: {
    201: {
      description: "Tag criada",
      content: { "application/json": { schema: tagResponse } },
    },
    ...routeErrors,
  },
});

export const updateTagRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Classification"],
  summary: "Renomeia uma tag",
  ...protectedRoute,
  request: {
    params: idParams,
    body: { content: { "application/json": { schema: tagInput } } },
  },
  responses: {
    200: {
      description: "Tag atualizada",
      content: { "application/json": { schema: tagResponse } },
    },
    ...routeErrors,
  },
});

export const removeTagRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Classification"],
  summary: "Exclui uma tag",
  ...protectedRoute,
  request: { params: idParams },
  responses: { 204: { description: "Tag excluída" }, ...routeErrors },
});

router.openapi(listTagsRoute, listTags);
router.openapi(createTagRoute, createTag);
router.openapi(updateTagRoute, updateTag);
router.openapi(removeTagRoute, removeTag);
export default router;
