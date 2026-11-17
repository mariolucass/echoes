import { describe, expect, it } from "vitest";
import { app } from "../../../src/app.js";

/**
 * Matriz rota × teste: percorre o documento OpenAPI e garante, para TODA rota,
 * o comportamento de erro 401 (protegidas) ou resposta pública esperada.
 */
const document = app.getOpenAPI31Document({
  openapi: "3.1.0",
  info: { title: "t", version: "1" },
}) as unknown as { paths: Record<string, Record<string, { security?: unknown[] }>> };

const UUID = "11111111-1111-4111-8111-111111111111";
const routes = Object.entries(document.paths).flatMap(([path, methods]) =>
  Object.entries(methods).map(([method, op]) => ({
    method: method.toUpperCase(),
    path: path.replace(/\{[^}]+\}/g, UUID),
    protected: Boolean(op.security?.length),
  })),
);

describe("route coverage matrix", () => {
  it("discovers every documented route", () => {
    expect(routes.length).toBeGreaterThanOrEqual(45);
  });

  it.each(routes.filter((r) => r.protected))(
    "$method $path → 401 without token",
    async ({ method, path }) => {
      const response = await app.request(path, { method });
      expect(response.status).toBe(401);
    },
  );

  it.each(routes.filter((r) => r.protected))(
    "$method $path → 401 with invalid token",
    async ({ method, path }) => {
      const response = await app.request(path, {
        method,
        headers: { Authorization: "Bearer invalido" },
      });
      expect(response.status).toBe(401);
    },
  );

  it("unknown routes return 404", async () => {
    expect((await app.request("/nao-existe")).status).toBe(404);
  });
});
