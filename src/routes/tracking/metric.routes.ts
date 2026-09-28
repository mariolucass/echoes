import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import {
  protectedRoute,
  routeErrors,
  idParams,
  decisionFilter,
} from "../shared/domain-routes.js";
import {
  measurementInput,
  measurementResponse,
  metricDetailResponse,
} from "../../schemas/tracking/tracking.schema.js";
import { TrackingService } from "../../services/tracking/tracking.service.js";
import { defaultHook } from "../../utils/openapi-hook.js";

const router = new OpenAPIHono<AppEnv>({ defaultHook });

const list = createRoute({
  method: "get",
  path: "/",
  tags: ["Tracking"],
  summary: "Lista métricas de uma decisão",
  ...protectedRoute,
  request: { query: decisionFilter },
  responses: {
    200: {
      description: "Métricas",
      content: { "application/json": { schema: metricDetailResponse.array() } },
    },
    ...routeErrors,
  },
});

const get = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Tracking"],
  summary: "Consulta uma métrica",
  ...protectedRoute,
  request: { params: idParams },
  responses: {
    200: {
      description: "Métrica",
      content: { "application/json": { schema: metricDetailResponse } },
    },
    ...routeErrors,
  },
});

const createMeasurement = createRoute({
  method: "post",
  path: "/{id}/measurements",
  tags: ["Tracking"],
  summary: "Registra uma medição de métrica",
  ...protectedRoute,
  request: {
    params: idParams,
    body: { content: { "application/json": { schema: measurementInput } } },
  },
  responses: {
    201: {
      description: "Medição criada",
      content: { "application/json": { schema: measurementResponse } },
    },
    ...routeErrors,
  },
});

const listMeasurements = createRoute({
  method: "get",
  path: "/{id}/measurements",
  tags: ["Tracking"],
  summary: "Lista medições de uma métrica",
  ...protectedRoute,
  request: { params: idParams },
  responses: {
    200: {
      description: "Medições",
      content: { "application/json": { schema: measurementResponse.array() } },
    },
    ...routeErrors,
  },
});

router.openapi(list, async (c) =>
  c.json(
    await TrackingService.listMetrics(
      c.get("user").id,
      c.req.valid("query").decisionId,
    ),
    200,
  ),
);

router.openapi(get, async (c) =>
  c.json(
    await TrackingService.getMetric(c.get("user").id, c.req.valid("param").id),
    200,
  ),
);

router.openapi(createMeasurement, async (c) =>
  c.json(
    await TrackingService.createMeasurement(
      c.get("user").id,
      c.req.valid("param").id,
      c.req.valid("json"),
    ),
    201,
  ),
);

router.openapi(listMeasurements, async (c) =>
  c.json(
    await TrackingService.listMeasurements(
      c.get("user").id,
      c.req.valid("param").id,
    ),
    200,
  ),
);
export default router;
