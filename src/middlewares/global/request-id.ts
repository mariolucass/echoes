import { randomUUID } from "node:crypto";
import type { MiddlewareHandler } from "hono";

declare module "hono" {
  interface ContextVariableMap {
    requestId: string;
  }
}

export const requestIdMiddleware: MiddlewareHandler = async (c, next) => {
  const requestId = randomUUID();
  c.set("requestId", requestId);
  c.header("x-request-id", requestId);
  await next();
};
