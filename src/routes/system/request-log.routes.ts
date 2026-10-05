import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { listRequestLogs } from "../../controllers/system/index.js";
import { authenticate } from "../../middlewares/auth/index.js";
import { validateRequestLogDate } from "../../middlewares/system/index.js";
import { errorResponseSchema } from "../../schemas/shared/index.js";

const router = new OpenAPIHono();
router.openapi(createRoute({
  method: "get",
  path: "/",
  tags: ["System"],
  summary: "Lista os registros de requisições de uma data",
  security: [{ Bearer: [] }],
  middleware: [authenticate, validateRequestLogDate] as const,
  request: { query: z.object({ date: z.string().optional().openapi({ description: "Data no formato YYYY-MM-DD", example: "2026-09-25" }) }) },
  responses: {
    200: {
      description: "Registros da data informada",
      content: { "application/json": { schema: z.object({
        date: z.string(),
        logs: z.array(z.object({
          timestamp: z.iso.datetime(),
          method: z.string(),
          route: z.string(),
          requestId: z.string().optional(),
        })),
      }) } },
    },
    400: { description: "Data inválida", content: { "application/json": { schema: errorResponseSchema } } },
    401: { description: "Token ausente ou inválido", content: { "application/json": { schema: errorResponseSchema } } },
  },
}), listRequestLogs);

export default router;
