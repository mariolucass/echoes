import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../interfaces/hono.js";
import { tagRoutes } from "./classification/index.js";
import { decisionRoutes, expectationRoutes, decisionTagRoutes } from "./decisions/index.js";
import { userRoutes, authRoutes } from "./identity/index.js";
import { outcomeRoutes, reflectionRoutes } from "./learning/index.js";
import { healthRoutes, requestLogsRoutes } from "./system/index.js";
import { checkpointRoutes, metricRoutes } from "./tracking/index.js";

export {
  checkpointRoutes,
  decisionRoutes,
  expectationRoutes,
  healthRoutes,
  metricRoutes,
  outcomeRoutes,
  reflectionRoutes,
  requestLogsRoutes,
  tagRoutes,
  userRoutes,
  authRoutes,
};

export const identityRoutes = new OpenAPIHono<AppEnv>().route("/users", userRoutes);
export const decisionsRoutes = new OpenAPIHono<AppEnv>()
  .route("/", decisionRoutes)
  .route("/", expectationRoutes)
  .route("/", decisionTagRoutes);
export const trackingRoutes = new OpenAPIHono<AppEnv>()
  .route("/checkpoints", checkpointRoutes)
  .route("/metrics", metricRoutes);
export const learningRoutes = new OpenAPIHono<AppEnv>()
  .route("/outcomes", outcomeRoutes)
  .route("/reflections", reflectionRoutes);
export const classificationRoutes = new OpenAPIHono<AppEnv>().route("/tags", tagRoutes);
