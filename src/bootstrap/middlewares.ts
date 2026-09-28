import type { OpenAPIHono } from "@hono/zod-openapi";
import { bodyLimit } from "hono/body-limit";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { corsOptions } from "../config/cors.js";
import type { AppEnv } from "../interfaces/hono.js";
import {
  apiLimiter,
  httpLogger,
  requestIdMiddleware,
  requestLogger,
  securityHeaders,
} from "../middlewares/global/index.js";
import { weekdayOnly } from "../middlewares/index.js";

type App = OpenAPIHono<AppEnv>;
const corsMiddleware = cors(corsOptions);
const bodyLimitMiddleware = bodyLimit({ maxSize: 10 * 1024 });
const compressionMiddleware = compress();

export function bootstrapBaseMiddlewares(app: App): void {
  app.use("*", requestIdMiddleware);
  app.use("*", securityHeaders);
  app.use("*", corsMiddleware);
  app.use("*", bodyLimitMiddleware);
}

export function bootstrapWeekdayOnly(app: App): void {
  app.use("*", weekdayOnly);
}

export function bootstrapApiMiddlewares(app: App): void {
  app.use("*", apiLimiter);
  app.use("*", requestLogger);
  app.use("*", httpLogger);
  app.use("*", compressionMiddleware);
}
