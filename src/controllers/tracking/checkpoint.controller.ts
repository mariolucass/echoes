import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import type {
  listCheckpointsRoute,
  createCheckpointRoute,
  getCheckpointRoute,
  patchCheckpointRoute,
  deleteCheckpointRoute,
} from "../../routes/tracking/checkpoint.routes.js";
import { TrackingService } from "../../services/tracking/tracking.service.js";

export const listCheckpoints: RouteHandler<
  typeof listCheckpointsRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const decisionId = c.req.valid("query").decisionId;

  const response = await TrackingService.listCheckpoints(user.id, decisionId);

  return c.json(response, 200);
};

export const createCheckpoint: RouteHandler<
  typeof createCheckpointRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");

  const response = await TrackingService.createCheckpoint(user.id, body);

  return c.json(response, 201);
};

export const getCheckpoint: RouteHandler<
  typeof getCheckpointRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  const response = await TrackingService.getCheckpoint(user.id, id);

  return c.json(response, 200);
};

export const patchCheckpoint: RouteHandler<
  typeof patchCheckpointRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const response = await TrackingService.patchCheckpoint(user.id, id, body);

  return c.json(response, 200);
};

export const deleteCheckpoint: RouteHandler<
  typeof deleteCheckpointRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  await TrackingService.deleteCheckpoint(user.id, id);

  return c.body(null, 204);
};
