import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  listDecisions,
  softDeleteDecision,
} from "../../controllers/decisions/index.ts";
import { downloadDecisionsPdf } from "../../controllers/decisions/index.ts";
import { authenticate } from "../../middlewares/auth/index.js";
import type { AppEnv } from "../../interfaces/hono.ts";
import {
  decisionListResponseSchema,
  decisionIdParamsSchema,
  decisionQuerySchema,
} from "../../schemas/decisions/index.ts";
import { errorResponseSchema } from "../../schemas/shared/index.js";
import {
  commitDecisionSchema,
  commitResponseSchema,
  createAlternativeSchema,
  createDecisionSchema,
  createMetricSchema,
  createReviewSchema,
  decisionDetailSchema,
  draftResponseSchema,
  alternativeResponseSchema,
  metricResponseSchema,
  reviewResponseSchema,
} from "../../schemas/decisions/decision.schema.js";
import {
  createDraft,
  getDecisionDetail,
  addAlternative,
  addMetric,
  commitDecision,
  reviewDecision,
} from "../../controllers/decisions/decision.controller.js";

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

export const listDecisionsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Decisions"],
  summary: "Lista as decisões do usuário autenticado",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  request: { query: decisionQuerySchema },
  responses: {
    200: {
      description: "Lista paginada de decisões",
      content: { "application/json": { schema: decisionListResponseSchema } },
    },
    401: { description: "Token ausente ou inválido" },
    403: { description: "Acesso permitido apenas em dias úteis" },
    422: {
      description: "Parâmetros de consulta inválidos",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

export const downloadDecisionsPdfRoute = createRoute({
  method: "get",
  path: "/report.pdf",
  tags: ["Decisions"],
  summary: "Baixa a lista de decisões em PDF",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  request: { query: decisionQuerySchema },
  responses: {
    200: {
      description: "Arquivo PDF com a lista de decisões",
      content: {
        "application/pdf": { schema: { type: "string", format: "binary" } },
      },
    },
    401: { description: "Token ausente ou inválido" },
    403: { description: "Acesso permitido apenas em dias úteis" },
    422: {
      description: "Parâmetros de consulta inválidos",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

export const softDeleteDecisionRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Decisions"],
  summary: "Exclui logicamente uma decisão do usuário autenticado",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  request: { params: decisionIdParamsSchema },
  responses: {
    204: { description: "Decisão excluída logicamente" },
    401: { description: "Token ausente ou inválido" },
    404: {
      description: "Decisão não encontrada",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    422: {
      description: "ID inválido",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

export const createDraftRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Decisions"],
  summary: "Cria um rascunho de decisão",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  request: {
    body: { content: { "application/json": { schema: createDecisionSchema } } },
  },
  responses: {
    201: {
      description: "Rascunho criado",
      content: { "application/json": { schema: draftResponseSchema } },
    },
    ...mutationErrors,
  },
});

export const getDecisionDetailRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Decisions"],
  summary: "Consulta a decisão e seu histórico",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  request: { params: decisionIdParamsSchema },
  responses: {
    200: {
      description: "Decisão completa",
      content: { "application/json": { schema: decisionDetailSchema } },
    },
    ...mutationErrors,
  },
});

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

export const addMetricRoute = createRoute({
  method: "post",
  path: "/{id}/metrics",
  tags: ["Decisions"],
  summary: "Define uma métrica para a decisão",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  request: {
    params: decisionIdParamsSchema,
    body: { content: { "application/json": { schema: createMetricSchema } } },
  },
  responses: {
    201: {
      description: "Métrica criada",
      content: { "application/json": { schema: metricResponseSchema } },
    },
    ...mutationErrors,
  },
});

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

router.openapi(listDecisionsRoute, listDecisions);
router.openapi(downloadDecisionsPdfRoute, downloadDecisionsPdf);
router.openapi(softDeleteDecisionRoute, softDeleteDecision);

router.openapi(createDraftRoute, createDraft);
router.openapi(getDecisionDetailRoute, getDecisionDetail);
router.openapi(addAlternativeRoute, addAlternative);
router.openapi(addMetricRoute, addMetric);
router.openapi(commitDecisionRoute, commitDecision);
router.openapi(reviewDecisionRoute, reviewDecision);

export default router;
