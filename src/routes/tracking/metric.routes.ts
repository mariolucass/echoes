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
import { listMetrics, getMetric, createMeasurement, listMeasurements } from "../../controllers/tracking/metric.controller.js";
import { defaultHook } from "../../utils/openapi-hook.js";

const router = new OpenAPIHono<AppEnv>({ defaultHook });

export const listMetricsRoute = createRoute({
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

export const getMetricRoute = createRoute({
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

export const createMeasurementRoute = createRoute({
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

export const listMeasurementsRoute = createRoute({
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

router.openapi(listMetricsRoute, listMetrics);
router.openapi(getMetricRoute, getMetric);
router.openapi(createMeasurementRoute, createMeasurement);
router.openapi(listMeasurementsRoute, listMeasurements);
export default router;
