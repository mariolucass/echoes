import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { authenticate } from "../../middlewares/auth/index.js";
import type { AppEnv } from "../../interfaces/hono.js";
import { errorResponseSchema } from "../../schemas/shared/index.js";
import { decisionIdParamsSchema } from "../../schemas/decisions/decision.schema.js";
import {
  createExpectationSchema,
  expectationResponseSchema,
} from "../../schemas/decisions/expectation.schema.js";
import { addExpectation } from "../../controllers/decisions/expectation.controller.js";

const router = new OpenAPIHono<AppEnv>();
const errorContent = { "application/json": { schema: errorResponseSchema } };
const mutationErrors = {
  401: { description: "Token inválido" },
  404: {
    description: "Decisão ou recurso não encontrado",
    content: errorContent,
  },
  409: { description: "Estado da decisão incompatível", content: errorContent },
  422: { description: "Entrada inválida", content: errorContent },
} as const;

export const addExpectationRoute = createRoute({
  method: "post",
  path: "/{id}/expectations",
  tags: ["Decisions"],
  summary: "Define uma expectativa e suas metas mensuráveis",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  request: {
    params: decisionIdParamsSchema,
    body: {
      content: { "application/json": { schema: createExpectationSchema } },
    },
  },
  responses: {
    201: {
      description: "Expectativa criada",
      content: { "application/json": { schema: expectationResponseSchema } },
    },
    ...mutationErrors,
  },
});

router.openapi(addExpectationRoute, addExpectation);

export default router;
