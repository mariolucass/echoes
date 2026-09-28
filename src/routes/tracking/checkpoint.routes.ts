import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import {
  protectedRoute,
  routeErrors,
  idParams,
  decisionFilter,
} from "../shared/domain-routes.js";
import {
  checkpointInput,
  checkpointPatch,
  checkpointResponse,
} from "../../schemas/tracking/tracking.schema.js";
import { TrackingService } from "../../services/tracking/tracking.service.js";
import { defaultHook } from "../../utils/openapi-hook.js";

const router = new OpenAPIHono<AppEnv>({ defaultHook });

const content = { "application/json": { schema: checkpointResponse } };

const list = createRoute({
  method: "get",
  path: "/",
  tags: ["Tracking"],
  summary: "Lista checkpoints de uma decisão",
  ...protectedRoute,
  request: { query: decisionFilter },
  responses: {
    200: {
      description: "Checkpoints",
      content: { "application/json": { schema: checkpointResponse.array() } },
    },
    ...routeErrors,
  },
});

const create = createRoute({
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

const get = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Tracking"],
  summary: "Consulta um checkpoint",
  ...protectedRoute,
  request: { params: idParams },
  responses: { 200: { description: "Checkpoint", content }, ...routeErrors },
});

const patch = createRoute({
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

const remove = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Tracking"],
  summary: "Exclui um checkpoint",
  ...protectedRoute,
  request: { params: idParams },
  responses: { 204: { description: "Checkpoint excluído" }, ...routeErrors },
});

router.openapi(list, async (c) =>
  c.json(
    await TrackingService.listCheckpoints(
      c.get("user").id,
      c.req.valid("query").decisionId,
    ),
    200,
  ),
);

router.openapi(create, async (c) =>
  c.json(
    await TrackingService.createCheckpoint(
      c.get("user").id,
      c.req.valid("json"),
    ),
    201,
  ),
);

router.openapi(get, async (c) =>
  c.json(
    await TrackingService.getCheckpoint(
      c.get("user").id,
      c.req.valid("param").id,
    ),
    200,
  ),
);

router.openapi(patch, async (c) =>
  c.json(
    await TrackingService.patchCheckpoint(
      c.get("user").id,
      c.req.valid("param").id,
      c.req.valid("json"),
    ),
    200,
  ),
);

router.openapi(remove, async (c) => {
  await TrackingService.deleteCheckpoint(
    c.get("user").id,
    c.req.valid("param").id,
  );
  return c.body(null, 204);
});
export default router;
