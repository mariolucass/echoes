import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import {
  protectedRoute,
  routeErrors,
  idParams,
} from "../shared/domain-routes.js";
import {
  decisionTagParams,
  tagResponse,
} from "../../schemas/classification/tag.schema.js";
import { TagService } from "../../services/classification/tag.service.js";
import { defaultHook } from "../../utils/openapi-hook.js";

const router = new OpenAPIHono<AppEnv>({ defaultHook });

const list = createRoute({
  method: "get",
  path: "/{id}/tags",
  tags: ["Classification"],
  summary: "Lista tags de uma decisão",
  ...protectedRoute,
  request: { params: idParams },
  responses: {
    200: {
      description: "Tags",
      content: { "application/json": { schema: tagResponse.array() } },
    },
    ...routeErrors,
  },
});

const attach = createRoute({
  method: "put",
  path: "/{id}/tags/{tagId}",
  tags: ["Classification"],
  summary: "Vincula uma tag à decisão",
  ...protectedRoute,
  request: { params: decisionTagParams },
  responses: {
    200: {
      description: "Tag vinculada",
      content: { "application/json": { schema: tagResponse } },
    },
    ...routeErrors,
  },
});

const detach = createRoute({
  method: "delete",
  path: "/{id}/tags/{tagId}",
  tags: ["Classification"],
  summary: "Desvincula uma tag da decisão",
  ...protectedRoute,
  request: { params: decisionTagParams },
  responses: { 204: { description: "Vínculo removido" }, ...routeErrors },
});

router.openapi(list, async (c) =>
  c.json(
    await TagService.listForDecision(c.get("user").id, c.req.valid("param").id),
    200,
  ),
);

router.openapi(attach, async (c) => {
  const { id, tagId } = c.req.valid("param");
  return c.json(await TagService.attach(c.get("user").id, id, tagId), 200);
});

router.openapi(detach, async (c) => {
  const { id, tagId } = c.req.valid("param");
  await TagService.detach(c.get("user").id, id, tagId);
  return c.body(null, 204);
});
export default router;
