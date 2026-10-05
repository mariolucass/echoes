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
import { listOutcomes, getOutcome, listOutcomeAssessments } from "../../controllers/learning/outcome.controller.js";
import { defaultHook } from "../../utils/openapi-hook.js";

const router = new OpenAPIHono<AppEnv>({ defaultHook });
export const listOutcomesRoute = createRoute({
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
export const getOutcomeRoute = createRoute({
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
export const listOutcomeAssessmentsRoute = createRoute({
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
router.openapi(listOutcomesRoute, listOutcomes);
router.openapi(getOutcomeRoute, getOutcome);
router.openapi(listOutcomeAssessmentsRoute, listOutcomeAssessments);
export default router;
