import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { exportDecisionsCsv } from "../../controllers/system/export.controller.js";
import type { AppEnv } from "../../interfaces/hono.js";
import { authenticate } from "../../middlewares/auth/index.js";

const router = new OpenAPIHono<AppEnv>();

const exportCsvRoute = createRoute({
  method: "get",
  path: "/csv",
  tags: ["System"],
  summary: "Exporta as decisões do usuário em CSV",
  security: [{ Bearer: [] }],
  middleware: [authenticate] as const,
  responses: {
    200: {
      description: "Arquivo CSV com as decisões do usuário autenticado",
      content: { "text/csv": { schema: { type: "string" } } },
    },
    401: { description: "Token ausente ou inválido" },
  },
});

router.openapi(exportCsvRoute, exportDecisionsCsv as never);

export default router;
