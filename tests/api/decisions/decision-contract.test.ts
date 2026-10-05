import { OpenAPIHono } from "@hono/zod-openapi";
import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../../../src/config/env.js";
import { errorHandler } from "../../../src/errors/errorHandler.js";
import type { AppEnv } from "../../../src/interfaces/hono.js";
import { DecisionRepository } from "../../../src/repositories/decisions/index.js";
import { decisionRoutes } from "../../../src/routes/decisions/index.js";
import { registerSchema } from "../../../src/schemas/identity/index.js";
import { defaultHook } from "../../../src/utils/openapi-hook.js";
import { signAccessToken } from "../../../src/utils/jwt.js";

const app = new OpenAPIHono<AppEnv>({ defaultHook });
app.route("/decisions", decisionRoutes);
app.onError(errorHandler);

const userId = "c3cf2108-8bd0-46a1-a24c-4d3af0db3910";
const decisionId = "32b55aa9-0df9-4a99-9e2a-68cda0e658de";
const originalSecret = env.JWT_SECRET;

afterEach(() => {
  vi.restoreAllMocks();
  env.JWT_SECRET = originalSecret;
});

describe("decision and identity contracts", () => {
  it("normalizes email before validating and rejects malformed addresses", () => {
    const input = { name: "Lucas", email: " LUCAS@EXAMPLE.COM ", password: "strong-password" };
    expect(registerSchema.parse(input).email).toBe("lucas@example.com");
    expect(registerSchema.safeParse({ ...input, email: " not an email " }).success).toBe(false);
  });

  it("rejects invalid pagination instead of silently changing it", async () => {
    env.JWT_SECRET = "test-secret-that-is-at-least-32-bytes-long";
    const findPage = vi.spyOn(DecisionRepository.prototype, "findPage");
    const token = await signAccessToken(userId);
    const response = await app.request("/decisions?page=2abc&limit=100", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(422);
    expect((await response.json() as { error: { code: string } }).error.code)
      .toBe("VALIDATION_ERROR");
    expect(findPage).not.toHaveBeenCalled();
  });

  it("keeps valid pagination and defaults usable", async () => {
    env.JWT_SECRET = "test-secret-that-is-at-least-32-bytes-long";
    const findPage = vi.spyOn(DecisionRepository.prototype, "findPage")
      .mockResolvedValue({ data: [], total: 0 });
    const token = await signAccessToken(userId);
    const response = await app.request("/decisions?page=2&limit=10", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    expect(findPage).toHaveBeenCalledWith(userId, { page: 2, limit: 10 });
  });

  it("soft deletes only a decision owned by the authenticated user", async () => {
    env.JWT_SECRET = "test-secret-that-is-at-least-32-bytes-long";
    const softDelete = vi.spyOn(DecisionRepository.prototype, "softDelete")
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const token = await signAccessToken(userId);
    const request = () => app.request(`/decisions/${decisionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect((await request()).status).toBe(204);
    expect(softDelete).toHaveBeenCalledWith(userId, decisionId);
    expect((await request()).status).toBe(404);
    const invalidId = await app.request("/decisions/not-a-uuid", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(invalidId.status).toBe(422);
  });
});
