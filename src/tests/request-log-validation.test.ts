import { Hono } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../config/env.js";
import { errorHandler } from "../errors/errorHandler.js";
import { RequestLogRepository } from "../repositories/system/index.js";
import requestLogsRoutes from "../routes/system/request-log.routes.js";
import { signAccessToken } from "../utils/jwt.js";

const app = new Hono();
app.route("/request-logs", requestLogsRoutes);
app.onError(errorHandler);
const originalSecret = env.JWT_SECRET;

afterEach(() => {
  vi.restoreAllMocks();
  env.JWT_SECRET = originalSecret;
});

describe("request log date middleware", () => {
  it("rejects an invalid date before querying the repository", async () => {
    env.JWT_SECRET = "test-secret-that-is-at-least-32-bytes-long";
    const findByDate = vi.spyOn(RequestLogRepository.prototype, "findByDate");
    const token = await signAccessToken("user-123");
    const response = await app.request("/request-logs?date=2026-02-30", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(400);
    expect((await response.json() as { error: { code: string; message: string } }).error)
      .toMatchObject({ code: "BAD_REQUEST", message: "date must be a valid YYYY-MM-DD date" });
    expect(findByDate).not.toHaveBeenCalled();
  });

  it("passes a valid date to the service", async () => {
    env.JWT_SECRET = "test-secret-that-is-at-least-32-bytes-long";
    const findByDate = vi.spyOn(RequestLogRepository.prototype, "findByDate")
      .mockResolvedValue([]);
    const token = await signAccessToken("user-123");
    const response = await app.request("/request-logs?date=2026-09-25", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(findByDate).toHaveBeenCalledWith("2026-09-25");
  });
});
