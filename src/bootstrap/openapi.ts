import type { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import type { AppEnv } from "../interfaces/hono.js";

type App = OpenAPIHono<AppEnv>;

export const sortOperationsByCrud = (
  a: { method: string; path: string },
  b: { method: string; path: string },
): number => {
  const order: Record<string, number> = {
    post: 0,
    get: 1,
    put: 2,
    patch: 2,
    delete: 3,
  };
  const difference = (order[a.method] ?? 4) - (order[b.method] ?? 4);
  return difference || a.path.localeCompare(b.path);
};

export function bootstrapOpenApiSecurity(app: App): void {
  app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  });
}

export function bootstrapOpenApiDocs(app: App): void {
  app.get(
    "/reference",
    Scalar({
      url: "/doc",
      pageTitle: "Echoes API — Docs",
      theme: "bluePlanet",
      operationsSorter: sortOperationsByCrud,
    }),
  );
  app.doc31("/doc", {
    openapi: "3.1.0",
    info: { title: "Echoes API", version: "1.0.0" },
  });
}
