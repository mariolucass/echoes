import { Hono } from "hono";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { env } from "../../../src/config/env.js";
import type { AppEnv } from "../../../src/interfaces/hono.js";
import { errorHandler } from "../../../src/errors/errorHandler.ts";
import {
  authenticate,
  requireConsumedRefreshToken,
} from "../../../src/middlewares/auth/index.js";
import { UnauthorizedError } from "../../../src/errors/AppError.js";
import { signAccessToken } from "../../../src/utils/jwt.js";

const testApp = new Hono<AppEnv>();
testApp.get("/private", authenticate, (c) =>
  c.json({ userId: c.get("user").id }),
);
testApp.onError(errorHandler);

const originalSecret = env.JWT_SECRET;
beforeAll(() => {
  env.JWT_SECRET = "test-secret-that-is-at-least-32-bytes-long";
});
afterAll(() => {
  env.JWT_SECRET = originalSecret;
});

describe("authentication middleware", () => {
  it("rejects a refresh token that was not consumed exactly once", () => {
    expect(() => requireConsumedRefreshToken(0)).toThrow(UnauthorizedError);
    expect(() => requireConsumedRefreshToken(2)).toThrow(UnauthorizedError);
    expect(() => requireConsumedRefreshToken(1)).not.toThrow();
  });

  it("rejects requests without a bearer token", async () => {
    expect((await testApp.request("/private")).status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const response = await testApp.request("/private", {
      headers: { Authorization: "Bearer invalid" },
    });
    expect(response.status).toBe(401);
  });

  it("makes the verified user ID available to the route", async () => {
    const token = await signAccessToken("user-123");
    const response = await testApp.request("/private", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ userId: "user-123" });
  });
});
