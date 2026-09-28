import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import {
  protectedRoute,
  routeErrors,
  idParams,
  decisionFilter,
} from "../shared/domain-routes.js";
import { reflectionResponse } from "../../schemas/learning/learning.schema.js";
import { LearningService } from "../../services/learning/learning.service.js";
import { defaultHook } from "../../utils/openapi-hook.js";

const router = new OpenAPIHono<AppEnv>({ defaultHook });

const list = createRoute({
  method: "get",
  path: "/",
  tags: ["Learning"],
  summary: "Lista reflexões de uma decisão",
  ...protectedRoute,
  request: { query: decisionFilter },
  responses: {
    200: {
      description: "Reflexões",
      content: { "application/json": { schema: reflectionResponse.array() } },
    },
    ...routeErrors,
  },
});

const get = createRoute({
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

router.openapi(list, async (c) =>
  c.json(
    await LearningService.listReflections(
      c.get("user").id,
      c.req.valid("query").decisionId,
    ),
    200,
  ),
);

router.openapi(get, async (c) =>
  c.json(
    await LearningService.getReflection(
      c.get("user").id,
      c.req.valid("param").id,
    ),
    200,
  ),
);
export default router;
