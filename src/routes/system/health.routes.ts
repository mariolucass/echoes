import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { healthController } from "../../controllers/system/index.js";

const router = new OpenAPIHono();
const healthResponse = z.object({
  status: z.enum(["ok", "degraded"]),
  service: z.string(),
  timestamp: z.iso.datetime(),
  environment: z.enum(["development", "production", "test"]),
  uptimeSeconds: z.number().int(),
  checks: z.object({
    database: z.object({ status: z.enum(["up", "down"]), responseTimeMs: z.number() }),
    authentication: z.object({ status: z.enum(["configured", "misconfigured"]) }),
    requestLogs: z.object({ status: z.enum(["up", "down"]) }),
  }),
  runtime: z.object({
    nodeVersion: z.string(),
    memory: z.object({
      rssBytes: z.number(),
      heapUsedBytes: z.number(),
      heapTotalBytes: z.number(),
    }),
  }),
});

router.openapi(createRoute({
  method: "get",
  path: "/",
  tags: ["System"],
  summary: "Consulta a saúde da API e suas dependências",
  responses: {
    200: { description: "Serviço saudável", content: { "application/json": { schema: healthResponse } } },
    503: { description: "Serviço degradado", content: { "application/json": { schema: healthResponse } } },
  },
}), healthController);

export default router;
