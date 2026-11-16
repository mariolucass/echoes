import type { OpenAPIHono } from "@hono/zod-openapi";
import type { MiddlewareHandler } from "hono";
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
const defaultBodyLimit = bodyLimit({ maxSize: 10 * 1024 });
const uploadBodyLimit = bodyLimit({ maxSize: 6 * 1024 * 1024 });
const bodyLimitMiddleware: MiddlewareHandler = (c, next) =>
  c.req.path === "/identity/users/me/avatar" && c.req.method === "PUT"
    ? uploadBodyLimit(c, next)
    : defaultBodyLimit(c, next);
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
