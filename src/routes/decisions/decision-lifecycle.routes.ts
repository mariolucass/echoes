import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { authenticate } from "../../middlewares/auth/index.js";
import type { AppEnv } from "../../interfaces/hono.js";
import {
  commitDecisionSchema,
  commitResponseSchema,
  createReviewSchema,
  reviewResponseSchema,
} from "../../schemas/decisions/decision-lifecycle.schema.js";
import { decisionIdParamsSchema } from "../../schemas/decisions/decision.schema.js";
import {
  commitDecision,
  reviewDecision,
} from "../../controllers/decisions/decision-lifecycle.controller.js";
import { mutationErrors } from "./decision-route-errors.js";

const router = new OpenAPIHono<AppEnv>();

export const commitDecisionRoute = createRoute({
  method: "post",
  path: "/{id}/commit",
  tags: ["Decisions"],
  summary: "Confirma a escolha e preserva uma versão inicial imutável",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  request: {
    params: decisionIdParamsSchema,
    body: { content: { "application/json": { schema: commitDecisionSchema } } },
  },
  responses: {
    200: {
      description: "Decisão confirmada",
      content: { "application/json": { schema: commitResponseSchema } },
    },
    ...mutationErrors,
  },
});

export const reviewDecisionRoute = createRoute({
  method: "post",
  path: "/{id}/reviews",
  tags: ["Decisions"],
  summary: "Registra medições, resultado, avaliação e reflexão",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  request: {
    params: decisionIdParamsSchema,
    body: { content: { "application/json": { schema: createReviewSchema } } },
  },
  responses: {
    201: {
      description: "Revisão registrada",
      content: { "application/json": { schema: reviewResponseSchema } },
    },
    ...mutationErrors,
  },
});

router.openapi(commitDecisionRoute, commitDecision);
router.openapi(reviewDecisionRoute, reviewDecision);

export default router;
