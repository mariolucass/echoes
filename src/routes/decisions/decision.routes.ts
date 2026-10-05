import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  listDecisions,
  softDeleteDecision,
} from "../../controllers/decisions/index.ts";
import { downloadDecisionsPdf } from "../../controllers/decisions/index.ts";
import { downloadDecisionPdf } from "../../controllers/decisions/decision-report.controller.js";
import { authenticate } from "../../middlewares/auth/index.js";
import type { AppEnv } from "../../interfaces/hono.ts";
import {
  decisionListResponseSchema,
  decisionIdParamsSchema,
  decisionQuerySchema,
} from "../../schemas/decisions/index.ts";
import { errorResponseSchema } from "../../schemas/shared/index.js";
import {
  createDecisionSchema,
  createMetricSchema,
  decisionDetailSchema,
  draftResponseSchema,
  metricResponseSchema,
} from "../../schemas/decisions/decision.schema.js";
import {
  createDraft,
  getDecisionDetail,
  addMetric,
} from "../../controllers/decisions/decision.controller.js";
import { mutationErrors } from "./decision-route-errors.js";
import alternativeRoutes from "./decision-alternative.routes.js";
import lifecycleRoutes from "./decision-lifecycle.routes.js";

const router = new OpenAPIHono<AppEnv>();

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

export const downloadDecisionPdfRoute = createRoute({
  method: "get",
  path: "/{id}/report.pdf",
  tags: ["Decisions"],
  summary:
    "Baixa uma decisão em PDF com expectativas, evidências e aprendizados",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  request: { params: decisionIdParamsSchema },
  responses: {
    200: {
      description: "Relatório individual da decisão",
      content: {
        "application/pdf": { schema: { type: "string", format: "binary" } },
      },
    },
    401: { description: "Token ausente ou inválido" },
    403: { description: "Acesso permitido apenas em dias úteis" },
    404: {
      description: "Decisão inexistente, excluída ou de outro usuário",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    422: {
      description: "ID inválido",
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

router.openapi(listDecisionsRoute, listDecisions);
router.openapi(downloadDecisionsPdfRoute, downloadDecisionsPdf);
router.openapi(downloadDecisionPdfRoute, downloadDecisionPdf);
router.openapi(softDeleteDecisionRoute, softDeleteDecision);

router.openapi(createDraftRoute, createDraft);
router.openapi(getDecisionDetailRoute, getDecisionDetail);
router.openapi(addMetricRoute, addMetric);

router.route("/", alternativeRoutes);
router.route("/", lifecycleRoutes);

export default router;
