import { OpenAPIHono } from "@hono/zod-openapi";
import {
  bootstrapApiMiddlewares,
  bootstrapBaseMiddlewares,
  bootstrapWeekdayOnly,
} from "./bootstrap/middlewares.js";
import {
  bootstrapOpenApiDocs,
  bootstrapOpenApiSecurity,
} from "./bootstrap/openapi.js";
import { errorHandler } from "./errors/errorHandler.ts";
import { defaultHook } from "./utils/openapi-hook.js";
import type { AppEnv } from "./interfaces/hono.ts";
import {
  authRoutes,
  classificationRoutes,
  decisionsRoutes,
  healthRoutes,
  identityRoutes,
  learningRoutes,
  requestLogsRoutes,
  trackingRoutes,
} from "./routes/index.js";
import { env } from "./config/env.js";

export const app = new OpenAPIHono<AppEnv>({ defaultHook });

bootstrapBaseMiddlewares(app);

if (env.WEEKDAY_ONLY_ENABLED) {
  bootstrapWeekdayOnly(app);
}

app.route("/health", healthRoutes);

bootstrapApiMiddlewares(app);

bootstrapOpenApiSecurity(app);

app.route("/request-logs", requestLogsRoutes);

app.route("/identity/auth", authRoutes);
app.route("/identity", identityRoutes);
app.route("/decisions", decisionsRoutes);
app.route("/tracking", trackingRoutes);
app.route("/learning", learningRoutes);
app.route("/classification", classificationRoutes);

if (env.NODE_ENV !== "production") {
  bootstrapOpenApiDocs(app);
}

app.notFound((c) => c.json({ error: "Route not found" }, 404));
app.onError(errorHandler);

export default app;
