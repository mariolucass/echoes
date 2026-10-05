import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authenticate } from "../../middlewares/auth/index.js";
import type { AppEnv } from "../../interfaces/hono.js";
import {
  alternativeParamsSchema,
  alternativeResponseSchema,
  createAlternativeSchema,
} from "../../schemas/decisions/decision-alternative.schema.js";
import { decisionIdParamsSchema } from "../../schemas/decisions/decision.schema.js";
import {
  addAlternative,
  listAlternatives,
  getAlternative,
  deleteAlternative,
} from "../../controllers/decisions/decision-alternative.controller.js";
import { mutationErrors } from "./decision-route-errors.js";

const router = new OpenAPIHono<AppEnv>();

export const addAlternativeRoute = createRoute({
  method: "post",
  path: "/{id}/alternatives",
  tags: ["Decisions"],
  summary: "Adiciona uma alternativa ao rascunho",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  request: {
    params: decisionIdParamsSchema,
    body: {
      content: { "application/json": { schema: createAlternativeSchema } },
    },
  },
  responses: {
    201: {
      description: "Alternativa criada",
      content: { "application/json": { schema: alternativeResponseSchema } },
    },
    ...mutationErrors,
  },
});

export const listAlternativesRoute = createRoute({
  method: "get",
  path: "/{id}/alternatives",
  tags: ["Decisions"],
  summary: "Lista as alternativas de uma decisão",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  request: { params: decisionIdParamsSchema },
  responses: {
    200: {
      description: "Consulta de alternativas",
      content: {
        "application/json": { schema: z.array(alternativeResponseSchema) },
      },
    },
    401: mutationErrors[401],
    404: mutationErrors[404],
    400: { description: "Parâmetros inválidos" },
  },
});

export const getAlternativeRoute = createRoute({
  method: "get",
  path: "/{id}/alternatives/{alternativeId}",
  tags: ["Decisions"],
  summary: "Busca uma alternativa pelo código",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  request: { params: alternativeParamsSchema },
  responses: {
    200: {
      description: "Consulta de alternativas",
      content: { "application/json": { schema: alternativeResponseSchema } },
    },
    401: mutationErrors[401],
    404: mutationErrors[404],
    400: { description: "Parâmetros inválidos" },
  },
});

export const deleteAlternativeRoute = createRoute({
  method: "delete",
  path: "/{id}/alternatives/{alternativeId}",
  tags: ["Decisions"],
  summary: "Exclui uma alternativa do rascunho",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  request: { params: alternativeParamsSchema },
  responses: {
    204: { description: "Alternativa excluída" },
    400: { description: "Parâmetros inválidos" },
    401: mutationErrors[401],
    404: mutationErrors[404],
    409: mutationErrors[409],
  },
});

router.openapi(addAlternativeRoute, addAlternative);
router.openapi(listAlternativesRoute, listAlternatives);
router.openapi(getAlternativeRoute, getAlternative);
router.openapi(deleteAlternativeRoute, deleteAlternative);

export default router;
