import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import {
  protectedRoute,
  routeErrors,
  idParams,
  optionalDecisionFilter,
} from "../shared/domain-routes.js";
import { reflectionListItem, reflectionResponse } from "../../schemas/learning/learning.schema.js";
import { listReflections, getReflection } from "../../controllers/learning/reflection.controller.js";
import { defaultHook } from "../../utils/openapi-hook.js";

const router = new OpenAPIHono<AppEnv>({ defaultHook });

export const listReflectionsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Learning"],
  summary: "Lista reflexões de uma decisão",
  ...protectedRoute,
  request: { query: optionalDecisionFilter },
  responses: {
    200: {
      description: "Reflexões",
      content: { "application/json": { schema: reflectionListItem.array() } },
    },
    ...routeErrors,
  },
});

export const getReflectionRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Learning"],
  summary: "Consulta uma reflexão",
  ...protectedRoute,
  request: { params: idParams },
  responses: {
    200: {
      description: "Reflexão",
      content: { "application/json": { schema: reflectionResponse } },
    },
    ...routeErrors,
  },
});

router.openapi(listReflectionsRoute, listReflections);
router.openapi(getReflectionRoute, getReflection);
export default router;
