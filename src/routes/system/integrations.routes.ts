import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { getIntegrations, runIntegrationsRoundtrip } from "../../controllers/system/index.js";
import { authenticate } from "../../middlewares/auth/index.js";
import { createRateLimiter } from "../../middlewares/global/index.js";
import { integrationsResponse, roundtripResponse } from "../../schemas/system/integrations.schema.js";
import { errorResponseSchema } from "../../schemas/shared/index.js";

const router = new OpenAPIHono();
const errors = {
  401: { description: "Token ausente ou inválido", content: { "application/json": { schema: errorResponseSchema } } },
  429: { description: "Muitos testes em pouco tempo", content: { "application/json": { schema: errorResponseSchema } } },
};

// O teste completo escreve no Cloudinary e no MongoDB (e apaga em seguida): limite próprio, bem baixo.
const roundtripLimiter = createRateLimiter(10, "Muitos testes completos em pouco tempo. Aguarde alguns minutos.");

router.openapi(createRoute({
  method: "get",
  path: "/",
  tags: ["System"],
  summary: "Ping e latência do PostgreSQL, MongoDB e Cloudinary",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  responses: {
    200: { description: "Estado de cada integração", content: { "application/json": { schema: integrationsResponse } } },
    ...errors,
  },
}), getIntegrations);

router.openapi(createRoute({
  method: "post",
  path: "/roundtrip",
  tags: ["System"],
  summary: "Teste real de ida e volta: grava/lê/apaga no MongoDB e sobe/entrega/apaga no Cloudinary",
  security: [{ Bearer: [] }],
  middleware: [authenticate, roundtripLimiter] as const,
  responses: {
    200: { description: "Resultado de cada etapa", content: { "application/json": { schema: roundtripResponse } } },
    ...errors,
  },
}), runIntegrationsRoundtrip);

export default router;
