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
import { TagService } from "../../services/classification/tag.service.js";
import { defaultHook } from "../../utils/openapi-hook.js";

const router = new OpenAPIHono<AppEnv>({ defaultHook });

const list = createRoute({
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

const create = createRoute({
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

const patch = createRoute({
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

const remove = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Classification"],
  summary: "Exclui uma tag",
  ...protectedRoute,
  request: { params: idParams },
  responses: { 204: { description: "Tag excluída" }, ...routeErrors },
});

router.openapi(list, async (c) =>
  c.json(await TagService.list(c.get("user").id), 200),
);

router.openapi(create, async (c) =>
  c.json(
    await TagService.create(c.get("user").id, c.req.valid("json").name),
    201,
  ),
);

router.openapi(patch, async (c) =>
  c.json(
    await TagService.update(
      c.get("user").id,
      c.req.valid("param").id,
      c.req.valid("json").name,
    ),
    200,
  ),
);

router.openapi(remove, async (c) => {
  await TagService.remove(c.get("user").id, c.req.valid("param").id);
  return c.body(null, 204);
});
export default router;
