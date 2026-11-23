import { z } from "@hono/zod-openapi";
import { authenticate } from "../../middlewares/auth/index.js";
import { errorResponseSchema } from "../../schemas/shared/index.js";

export const protectedRoute = {
  security: [{ Bearer: [] }],
  middleware: [authenticate],
};

export const routeErrors = {
  401: { description: "Token ausente ou inválido" },
  404: {
    description: "Recurso não encontrado",
    content: { "application/json": { schema: errorResponseSchema } },
  },
  409: {
    description: "Conflito com o estado atual",
    content: { "application/json": { schema: errorResponseSchema } },
  },
  422: {
    description: "Entrada inválida",
    content: { "application/json": { schema: errorResponseSchema } },
  },
} as const;

export const idParams = z.object({ id: z.uuid() });
export const decisionFilter = z.object({ decisionId: z.uuid() }).strict();
/** Sem `decisionId`, a listagem traz os itens de todas as decisões do usuário. */
export const optionalDecisionFilter = z.object({ decisionId: z.uuid().optional() }).strict();
export const dateTime = z.iso.datetime({ offset: true });
