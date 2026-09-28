import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import {
  protectedRoute,
  routeErrors,
  idParams,
  decisionFilter,
} from "../shared/domain-routes.js";
import {
  outcomeResponse,
  assessmentResponse,
} from "../../schemas/learning/learning.schema.js";
import { LearningService } from "../../services/learning/learning.service.js";
import { defaultHook } from "../../utils/openapi-hook.js";

const router = new OpenAPIHono<AppEnv>({ defaultHook });
const list = createRoute({
  method: "get",
  path: "/",
  tags: ["Learning"],
  summary: "Lista resultados de uma decisão",
  ...protectedRoute,
  request: { query: decisionFilter },
  responses: {
    200: {
      description: "Resultados",
      content: { "application/json": { schema: outcomeResponse.array() } },
    },
    ...routeErrors,
  },
});
const get = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Learning"],
  summary: "Consulta um resultado",
  ...protectedRoute,
  request: { params: idParams },
  responses: {
    200: {
      description: "Resultado",
      content: { "application/json": { schema: outcomeResponse } },
    },
    ...routeErrors,
  },
});
const assessments = createRoute({
  method: "get",
  path: "/{id}/assessments",
  tags: ["Learning"],
  summary: "Lista avaliações de um resultado",
  ...protectedRoute,
  request: { params: idParams },
  responses: {
    200: {
      description: "Avaliações",
      content: { "application/json": { schema: assessmentResponse.array() } },
    },
    ...routeErrors,
  },
});
router.openapi(list, async (c) =>
  c.json(
    await LearningService.listOutcomes(
      c.get("user").id,
      c.req.valid("query").decisionId,
    ),
    200,
  ),
);
router.openapi(get, async (c) =>
  c.json(
    await LearningService.getOutcome(c.get("user").id, c.req.valid("param").id),
    200,
  ),
);
router.openapi(assessments, async (c) =>
  c.json(
    await LearningService.listAssessments(
      c.get("user").id,
      c.req.valid("param").id,
    ),
    200,
  ),
);
export default router;
