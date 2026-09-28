import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { ErrorCode } from "../errors/errorCodes.js";
import { errorHandler } from "../errors/errorHandler.js";

const originalEnvironment = process.env.NODE_ENV;
afterEach(() => {
  process.env.NODE_ENV = originalEnvironment;
});

function appFor(error: Error) {
  const app = new Hono();
  app.get("/fail", () => { throw error; });
  app.onError(errorHandler);
  return app;
}

async function errorBody(response: Response): Promise<{
  error: { code: string; message: string; stack?: string; requestId?: string };
}> {
  return await response.json() as {
    error: { code: string; message: string; stack?: string; requestId?: string };
  };
}

describe("error handling", () => {
  it("uses the status associated with an application code", async () => {
    const response = await appFor(new AppError("Missing", { code: ErrorCode.NOT_FOUND })).request("/fail");
    expect(response.status).toBe(404);
    const body = await errorBody(response);
    expect(body.error).toMatchObject({ code: ErrorCode.NOT_FOUND, message: "Missing" });
    expect(body.error).not.toHaveProperty("stack");
  });

  it("does not expose internal messages in production", async () => {
    process.env.NODE_ENV = "production";
    const response = await appFor(new AppError("database password leaked")).request("/fail");
    const body = await errorBody(response);
    expect(response.status).toBe(500);
    expect(body.error).toMatchObject({ code: ErrorCode.INTERNAL_ERROR, message: "An internal error occurred. Try again later." });
    expect(body.error).not.toHaveProperty("stack");
    expect(body.error).not.toHaveProperty("requestId");
  });

  it("keeps HTTP status and public code aligned", async () => {
    const response = await appFor(new HTTPException(401, { message: "Authentication required" })).request("/fail");
    expect(response.status).toBe(401);
    expect((await errorBody(response)).error.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it("preserves an explicitly operational service outage", async () => {
    const response = await appFor(new AppError("Service temporarily unavailable", {
      code: ErrorCode.SERVICE_UNAVAILABLE,
    })).request("/fail");
    expect(response.status).toBe(503);
    expect((await errorBody(response)).error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
  });

  it("maps known Prisma failures without exposing ORM messages", async () => {
    process.env.NODE_ENV = "production";
    const error = Object.assign(new Error("Sensitive query text"), {
      name: "PrismaClientKnownRequestError",
      code: "P2025",
    });
    const response = await appFor(error).request("/fail");
    expect(response.status).toBe(404);
    expect((await errorBody(response)).error).toMatchObject({ code: ErrorCode.NOT_FOUND, message: "Resource was not found." });
  });

  it("treats unmapped Prisma errors as internal failures", async () => {
    process.env.NODE_ENV = "production";
    const error = Object.assign(new Error("Sensitive query text"), {
      name: "PrismaClientKnownRequestError",
      code: "P9999",
    });
    const response = await appFor(error).request("/fail");
    expect(response.status).toBe(500);
    expect((await errorBody(response)).error.code).toBe(ErrorCode.INTERNAL_ERROR);
  });

  it("returns validation errors with the expected status", async () => {
    const result = z.object({ name: z.string() }).safeParse({ name: 1 });
    if (result.success) throw new Error("Expected validation failure");
    const response = await appFor(result.error).request("/fail");
    expect(response.status).toBe(422);
    const body = await errorBody(response);
    expect(body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(body.error).not.toHaveProperty("stack");
  });

  it("does not return the stack of an unexpected error in development", async () => {
    process.env.NODE_ENV = "development";
    const response = await appFor(new Error("Unexpected failure")).request("/fail");
    const body = await errorBody(response);
    expect(response.status).toBe(500);
    expect(body.error).not.toHaveProperty("stack");
  });
});
