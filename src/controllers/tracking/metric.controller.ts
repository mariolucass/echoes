import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import type {
  listMetricsRoute,
  getMetricRoute,
  createMeasurementRoute,
  listMeasurementsRoute,
} from "../../routes/tracking/metric.routes.js";
import { TrackingService } from "../../services/tracking/tracking.service.js";

export const listMetrics: RouteHandler<
  typeof listMetricsRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const decisionId = c.req.valid("query").decisionId;

  const response = await TrackingService.listMetrics(user.id, decisionId);

  return c.json(response, 200);
};

export const getMetric: RouteHandler<typeof getMetricRoute, AppEnv> = async (
  c,
) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  const response = await TrackingService.getMetric(user.id, id);

  return c.json(response, 200);
};

export const createMeasurement: RouteHandler<
  typeof createMeasurementRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const measurementData = c.req.valid("json");

  const response = await TrackingService.createMeasurement(
    user.id,
    id,
    measurementData,
  );

  return c.json(response, 201);
};

export const listMeasurements: RouteHandler<
  typeof listMeasurementsRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  const response = await TrackingService.listMeasurements(user.id, id);

  return c.json(response, 200);
};
