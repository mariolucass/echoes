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
import { listDecisionTags, attachDecisionTag, detachDecisionTag } from "../../controllers/decisions/decision-tag.controller.js";
import { defaultHook } from "../../utils/openapi-hook.js";

const router = new OpenAPIHono<AppEnv>({ defaultHook });

export const listDecisionTagsRoute = createRoute({
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

export const attachDecisionTagRoute = createRoute({
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

export const detachDecisionTagRoute = createRoute({
  method: "delete",
  path: "/{id}/tags/{tagId}",
  tags: ["Classification"],
  summary: "Desvincula uma tag da decisão",
  ...protectedRoute,
  request: { params: decisionTagParams },
  responses: { 204: { description: "Vínculo removido" }, ...routeErrors },
});

router.openapi(listDecisionTagsRoute, listDecisionTags);
router.openapi(attachDecisionTagRoute, attachDecisionTag);
router.openapi(detachDecisionTagRoute, detachDecisionTag);
export default router;
