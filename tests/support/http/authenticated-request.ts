import type { Hono } from "hono";
import type { AppEnv } from "../../../src/interfaces/hono.js";

export function authenticatedRequest(
  app: Hono<AppEnv>,
  token: string,
  path: string,
  method = "GET",
  body?: unknown,
) {
  return app.request(path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
