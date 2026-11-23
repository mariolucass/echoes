import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import {
  protectedRoute,
  routeErrors,
  idParams,
  optionalDecisionFilter,
} from "../shared/domain-routes.js";
import {
  checkpointInput,
  checkpointPatch,
  checkpointListItem,
  checkpointResponse,
} from "../../schemas/tracking/tracking.schema.js";
import { listCheckpoints, createCheckpoint, getCheckpoint, patchCheckpoint, deleteCheckpoint } from "../../controllers/tracking/checkpoint.controller.js";
import { defaultHook } from "../../utils/openapi-hook.js";

const router = new OpenAPIHono<AppEnv>({ defaultHook });

const content = { "application/json": { schema: checkpointResponse } };

export const listCheckpointsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Tracking"],
  summary: "Lista checkpoints de uma decisão",
  ...protectedRoute,
  request: { query: optionalDecisionFilter },
  responses: {
    200: {
      description: "Checkpoints",
      content: { "application/json": { schema: checkpointListItem.array() } },
    },
    ...routeErrors,
  },
});

export const createCheckpointRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Tracking"],
  summary: "Agenda um checkpoint",
  ...protectedRoute,
  request: {
    body: { content: { "application/json": { schema: checkpointInput } } },
  },
  responses: {
    201: { description: "Checkpoint criado", content },
    ...routeErrors,
  },
});

export const getCheckpointRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Tracking"],
  summary: "Consulta um checkpoint",
  ...protectedRoute,
  request: { params: idParams },
  responses: { 200: { description: "Checkpoint", content }, ...routeErrors },
});

export const patchCheckpointRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Tracking"],
  summary: "Atualiza um checkpoint",
  ...protectedRoute,
  request: {
    params: idParams,
    body: { content: { "application/json": { schema: checkpointPatch } } },
  },
  responses: {
    200: { description: "Checkpoint atualizado", content },
    ...routeErrors,
  },
});

export const deleteCheckpointRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Tracking"],
  summary: "Exclui um checkpoint",
  ...protectedRoute,
  request: { params: idParams },
  responses: { 204: { description: "Checkpoint excluído" }, ...routeErrors },
});

router.openapi(listCheckpointsRoute, listCheckpoints);
router.openapi(createCheckpointRoute, createCheckpoint);
router.openapi(getCheckpointRoute, getCheckpoint);
router.openapi(patchCheckpointRoute, patchCheckpoint);
router.openapi(deleteCheckpointRoute, deleteCheckpoint);
export default router;
