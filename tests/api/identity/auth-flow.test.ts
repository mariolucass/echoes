import { OpenAPIHono } from "@hono/zod-openapi";
import { decodeJwt } from "jose";
import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../../../src/config/env.js";
import { errorHandler } from "../../../src/errors/errorHandler.js";
import type { AppEnv } from "../../../src/interfaces/hono.js";
import { UserRepository } from "../../../src/repositories/identity/index.js";
import { RefreshTokenRepository } from "../../../src/repositories/identity/index.js";
import { authRoutes } from "../../../src/routes/identity/index.js";
import {
  hashRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../../src/utils/jwt.js";
import { UnauthorizedError } from "../../../src/errors/AppError.js";
import { createRateLimiter } from "../../../src/middlewares/global/index.js";
import { verifyPassword } from "../../../src/utils/password.js";
import { app as mainApp } from "../../../src/app.js";

const app = new OpenAPIHono<AppEnv>().route("/identity/auth", authRoutes);
app.onError(errorHandler);

const id = "c3cf2108-8bd0-46a1-a24c-4d3af0db3910";
const createdAt = new Date("2026-09-25T12:00:00.000Z");
const publicUser = { id, name: "Lucas", email: "lucas@example.com", createdAt };
const originalSecret = env.JWT_SECRET;

type SessionShape = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

function expectSession(session: SessionShape) {
  expect(Object.keys(session).sort()).toEqual(
    [
      "accessToken",
      "accessTokenExpiresAt",
      "refreshToken",
      "refreshTokenExpiresAt",
      "tokenType",
    ].sort(),
  );
  expect(session.tokenType).toBe("Bearer");
  expect(session.accessTokenExpiresAt).toBe(
    new Date(decodeJwt(session.accessToken).exp! * 1000).toISOString(),
  );
  expect(session.refreshTokenExpiresAt).toBe(
    new Date(decodeJwt(session.refreshToken).exp! * 1000).toISOString(),
  );
}

beforeEach(() => {
  env.JWT_SECRET = "test-secret-that-is-at-least-32-bytes-long";
  vi.spyOn(RefreshTokenRepository.prototype, "create").mockResolvedValue(
    {} as never,
  );
  vi.spyOn(UserRepository.prototype, "findExistingEmail").mockResolvedValue(
    null,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  env.JWT_SECRET = originalSecret;
});

describe("authentication routes", () => {
  it("returns field validation errors through the shared error handler", async () => {
    const previousEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const response = await mainApp.request("/identity/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = (await response.json()) as {
        success: boolean;
        error: {
          code: string;
          message: string;
          details: { properties: Record<string, { errors: string[] }> };
        };
      };

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBe(
        "Invalid input. Review the submitted fields and try again.",
      );
      expect(body.error.details.properties.email?.errors).toHaveLength(1);
      expect(body.error.details.properties.password?.errors).toHaveLength(1);
      expect(body.error).not.toHaveProperty("stack");
    } finally {
      process.env.NODE_ENV = previousEnvironment;
    }
  });

  it("mounts the authentication endpoints in the main app", async () => {
    const response = await mainApp.request("/identity/auth/me");
    expect(response.status).toBe(401);
    const doc = (await (await mainApp.request("/doc")).json()) as {
      paths: Record<
        string,
        {
          post?: {
            responses: Record<
              string,
              { content?: Record<string, { schema: unknown }> }
            >;
          };
        }
      >;
    };
    expect(doc.paths).toHaveProperty("/identity/auth/register");
    expect(doc.paths).toHaveProperty("/identity/auth/login");
    expect(doc.paths).toHaveProperty("/identity/auth/refresh");
    expect(
      doc.paths["/identity/auth/login"]?.post?.responses["401"]?.content?.[
        "application/json"
      ]?.schema,
    ).toBeDefined();
    expect(
      doc.paths["/identity/auth/login"]?.post?.responses["422"]?.content?.[
        "application/json"
      ]?.schema,
    ).toBeDefined();
    expect(
      doc.paths["/identity/auth/login"]?.post?.responses["429"]?.content?.[
        "application/json"
      ]?.schema,
    ).toBeDefined();
  });

  it("maps duplicate registration to the shared error response", async () => {
    const prismaError = Object.assign(new Error("Database detail"), {
      name: "PrismaClientKnownRequestError",
      code: "P2002",
    });
    vi.spyOn(UserRepository.prototype, "create").mockRejectedValue(prismaError);

    const response = await app.request("/identity/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Lucas",
        email: "lucas@example.com",
        password: "strong-password",
      }),
    });
    const body = (await response.json()) as {
      success: boolean;
      error: { code: string; message: string };
    };
    expect(response.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error).toMatchObject({
      code: "CONFLICT",
      message: "Email already registered.",
    });
    expect(JSON.stringify(body)).not.toContain("Database detail");
  });

  it("rejects an existing email before hashing or creating a user", async () => {
    vi.spyOn(UserRepository.prototype, "findExistingEmail").mockResolvedValue({
      id,
    });
    const create = vi.spyOn(UserRepository.prototype, "create");
    const response = await app.request("/identity/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Lucas",
        email: " LUCAS@example.com ",
        password: "strong-password",
      }),
    });

    expect(response.status).toBe(409);
    expect(
      ((await response.json()) as { error: { message: string } }).error.message,
    ).toBe("Email already registered.");
    expect(UserRepository.prototype.findExistingEmail).toHaveBeenCalledWith(
      "lucas@example.com",
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects invalid access tokens and access tokens for deleted users", async () => {
    const { signAccessToken, signRefreshToken } =
      await import("../../../src/utils/jwt.js");
    const findById = vi
      .spyOn(UserRepository.prototype, "findById")
      .mockResolvedValue(null);

    const invalid = await app.request("/identity/auth/me", {
      headers: { Authorization: "Bearer invalid" },
    });
    expect(invalid.status).toBe(401);
    const malformedSubject = await app.request("/identity/auth/me", {
      headers: {
        Authorization: `Bearer ${await signAccessToken("not-a-uuid")}`,
      },
    });
    expect(malformedSubject.status).toBe(401);
    const wrongTokenType = await app.request("/identity/auth/me", {
      headers: { Authorization: `Bearer ${await signRefreshToken(id)}` },
    });
    expect(wrongTokenType.status).toBe(401);
    expect(findById).not.toHaveBeenCalled();

    const token = await signAccessToken(id);
    const missing = await app.request("/identity/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(missing.status).toBe(404);
    expect(
      ((await missing.json()) as { error: { code: string } }).error.code,
    ).toBe("NOT_FOUND");
    expect(findById).toHaveBeenCalledWith(id);
  });

  it("rejects refresh tokens for deleted users before rotation", async () => {
    const { signRefreshToken } = await import("../../../src/utils/jwt.js");
    vi.spyOn(UserRepository.prototype, "findById").mockResolvedValue(null);
    const rotate = vi.spyOn(RefreshTokenRepository.prototype, "rotate");
    const response = await app.request("/identity/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: await signRefreshToken(id) }),
    });

    expect(response.status).toBe(401);
    expect(
      ((await response.json()) as { error: { message: string } }).error.message,
    ).toBe("Invalid refresh token.");
    expect(rotate).not.toHaveBeenCalled();
  });

  it("rejects refresh tokens with malformed user IDs before querying the database", async () => {
    const { signRefreshToken } = await import("../../../src/utils/jwt.js");
    const findById = vi.spyOn(UserRepository.prototype, "findById");
    const response = await app.request("/identity/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        refreshToken: await signRefreshToken("not-a-uuid"),
      }),
    });
    expect(response.status).toBe(401);
    expect(findById).not.toHaveBeenCalled();
  });

  it("returns a validation error for malformed JSON", async () => {
    const response = await app.request("/identity/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{invalid",
    });
    expect(response.status).toBe(422);
    expect(
      ((await response.json()) as { error: { code: string; message: string } })
        .error,
    ).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Invalid JSON request body.",
    });
  });

  it("passes rate limit failures through the shared error handler", async () => {
    const limitedApp = new Hono();
    limitedApp.use(
      "*",
      createRateLimiter(
        1,
        "Too many authentication attempts from this IP. Try again later.",
      ),
    );
    limitedApp.get("/limited", (c) => c.json({ ok: true }));
    limitedApp.onError(errorHandler);

    expect((await limitedApp.request("/limited")).status).toBe(200);
    const response = await limitedApp.request("/limited");
    const body = (await response.json()) as {
      success: boolean;
      error: { code: string; message: string };
    };
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).not.toBeNull();
    expect(body).toMatchObject({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message:
          "Too many authentication attempts from this IP. Try again later.",
      },
    });
  });

  it("uses the shared error response for oversized authentication requests", async () => {
    const response = await mainApp.request("/identity/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "lucas@example.com",
        password: "a".repeat(11 * 1024),
      }),
    });
    const body = (await response.json()) as {
      success: boolean;
      error: { code: string; message: string };
    };
    expect(response.status).toBe(413);
    expect(body).toMatchObject({
      success: false,
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body is too large.",
      },
    });
  });

  it("registers a user with a password hash and returns a usable token", async () => {
    const create = vi
      .spyOn(UserRepository.prototype, "create")
      .mockResolvedValue(publicUser);
    const response = await app.request("/identity/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: " Lucas ",
        email: " LUCAS@example.com ",
        password: "strong-password",
      }),
    });

    expect(response.status).toBe(201);
    const result = (await response.json()) as {
      user: unknown;
      session: SessionShape;
    };
    expect(Object.keys(result).sort()).toEqual(["session", "user"]);
    expect(result.user).toEqual({
      ...publicUser,
      createdAt: createdAt.toISOString(),
    });
    expect(result).not.toHaveProperty("passwordHash");
    expect(result).not.toHaveProperty("password");
    expectSession(result.session);
    expect(await verifyAccessToken(result.session.accessToken)).toBe(id);
    expect(RefreshTokenRepository.prototype.create).toHaveBeenCalledWith(
      id,
      hashRefreshToken(result.session.refreshToken),
      new Date(result.session.refreshTokenExpiresAt),
    );
    const data = create.mock.calls[0]![0];
    expect(data.name).toBe("Lucas");
    expect(data.email).toBe("lucas@example.com");
    expect(data.passwordHash).not.toContain("strong-password");
    expect(await verifyPassword("strong-password", data.passwordHash)).toBe(
      true,
    );
  });

  it("logs in and serves the authenticated user without exposing the hash", async () => {
    const { hashPassword } = await import("../../../src/utils/password.js");
    const passwordHash = await hashPassword("strong-password");
    const findByEmail = vi
      .spyOn(UserRepository.prototype, "findByEmail")
      .mockResolvedValue({ ...publicUser, passwordHash });
    const findById = vi
      .spyOn(UserRepository.prototype, "findById")
      .mockResolvedValue(publicUser);

    const response = await app.request("/identity/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: " LUCAS@example.com ",
        password: "strong-password",
      }),
    });

    expect(response.status).toBe(200);
    const result = (await response.json()) as {
      user: unknown;
      session: SessionShape;
    };
    expect(findByEmail).toHaveBeenCalledWith("lucas@example.com");
    expect(result.user).toEqual({
      ...publicUser,
      createdAt: createdAt.toISOString(),
    });
    expect(JSON.stringify(result)).not.toContain(passwordHash);
    expectSession(result.session);
    expect(await verifyRefreshToken(result.session.refreshToken)).toBe(id);

    const me = await app.request("/identity/auth/me", {
      headers: { Authorization: `Bearer ${result.session.accessToken}` },
    });
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual(result.user);
    expect(findById).toHaveBeenCalledWith(id);
  });

  it("rotates a refresh token and rejects reuse and access tokens", async () => {
    const { signRefreshToken, signAccessToken } =
      await import("../../../src/utils/jwt.js");
    const oldToken = await signRefreshToken(id);
    vi.spyOn(UserRepository.prototype, "findById").mockResolvedValue(
      publicUser,
    );
    const rotate = vi
      .spyOn(RefreshTokenRepository.prototype, "rotate")
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new UnauthorizedError("Invalid refresh token."));
    const request = (refreshToken: string) =>
      app.request("/identity/auth/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

    const response = await request(oldToken);
    expect(response.status).toBe(200);
    const result = (await response.json()) as {
      session: SessionShape;
      user: unknown;
    };
    expect(result.user).toEqual({
      ...publicUser,
      createdAt: createdAt.toISOString(),
    });
    expectSession(result.session);
    expect(await verifyAccessToken(result.session.accessToken)).toBe(id);
    expect(await verifyRefreshToken(result.session.refreshToken)).toBe(id);
    expect(result.session.refreshToken).not.toBe(oldToken);
    expect(rotate).toHaveBeenCalledWith(
      id,
      hashRefreshToken(oldToken),
      hashRefreshToken(result.session.refreshToken),
      new Date(result.session.refreshTokenExpiresAt),
    );
    expect((await request(oldToken)).status).toBe(401);
    expect((await request(await signAccessToken(id))).status).toBe(401);
    expect(rotate).toHaveBeenCalledTimes(2);
  });

  it("returns the same error for an unknown email and an incorrect password", async () => {
    const findByEmail = vi
      .spyOn(UserRepository.prototype, "findByEmail")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        ...publicUser,
        passwordHash: await (
          await import("../../../src/utils/password.js")
        ).hashPassword("right-password"),
      });

    for (const password of ["anything", "wrong-password"]) {
      const response = await app.request("/identity/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "lucas@example.com", password }),
      });
      expect(response.status).toBe(401);
      expect(
        ((await response.json()) as { error: { message: string } }).error
          .message,
      ).toBe("Invalid email or password.");
    }
    expect(findByEmail).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid registration before persisting data", async () => {
    const create = vi.spyOn(UserRepository.prototype, "create");
    const response = await app.request("/identity/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Lucas",
        email: "invalid",
        password: "short",
      }),
    });
    expect(response.status).toBe(422);
    expect(create).not.toHaveBeenCalled();
  });
});
