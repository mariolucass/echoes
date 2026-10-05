import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../../src/app.js";
import { env } from "../../../src/config/env.js";
import { isWeekday } from "../../../src/middlewares/index.js";
import { RequestLogRepository } from "../../../src/repositories/system/index.js";
import { RequestLogService } from "../../../src/services/system/request-log.service.js";
import prisma from "../../../src/database/prisma.js";
import { DecisionReportRepository } from "../../../src/repositories/decisions/decision-report.repository.js";
import { signAccessToken } from "../../../src/utils/jwt.js";

const originalSecret = env.JWT_SECRET;
beforeEach(() => {
  env.JWT_SECRET = "test-secret-that-is-at-least-32-bytes-long";
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-25T12:00:00.000Z"));
});
afterEach(() => {
  vi.useRealTimers();
  env.JWT_SECRET = originalSecret;
  vi.restoreAllMocks();
});

describe("weekday access", () => {
  it("uses the configured time zone to identify weekends", () => {
    expect(isWeekday(new Date("2026-09-26T02:00:00.000Z"))).toBe(true);
    expect(isWeekday(new Date("2026-09-26T04:00:00.000Z"))).toBe(false);
  });
});

describe("request logs", () => {
  it("filters logs by UTC date", async () => {
    const findMany = vi
      .spyOn(prisma.requestLog, "findMany")
      .mockResolvedValueOnce([]);
    expect(await new RequestLogRepository().findByDate("2026-09-25")).toEqual(
      [],
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          timestamp: {
            gte: new Date("2026-09-25T00:00:00.000Z"),
            lt: new Date("2026-09-26T00:00:00.000Z"),
          },
        },
      }),
    );
  });

  it("returns matching requests and rejects invalid dates", async () => {
    vi.spyOn(RequestLogService.prototype, "listByDate").mockResolvedValueOnce([
      {
        timestamp: "2026-09-25T12:00:00.000Z",
        method: "GET",
        route: "/health",
      },
    ]);
    const token = await signAccessToken("user-123");
    const response = await app.request("/request-logs?date=2026-09-25", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    expect(
      ((await response.json()) as { logs: unknown[] }).logs,
    ).toContainEqual({
      timestamp: "2026-09-25T12:00:00.000Z",
      method: "GET",
      route: "/health",
    });
    const invalid = await app.request("/request-logs?date=2026-02-30", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(invalid.status).toBe(400);
  });
});

describe("decision PDF report", () => {
  it("returns a downloadable PDF with the decision list", async () => {
    const findPageWithoutCount = vi
      .spyOn(DecisionReportRepository.prototype, "findPage")
      .mockResolvedValueOnce([]);
    const token = await signAccessToken("user-123");
    try {
      const response = await app.request("/decisions/report.pdf", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toMatch(/^application\/pdf/);
      expect(response.headers.get("content-disposition")).toContain(
        'attachment; filename="echoes-panorama-',
      );
      expect(
        Buffer.from(await response.arrayBuffer())
          .subarray(0, 5)
          .toString(),
      ).toBe("%PDF-");
      expect(findPageWithoutCount).toHaveBeenCalledWith("user-123", {
        page: 1,
        limit: 12,
      });
    } finally {
      findPageWithoutCount.mockRestore();
    }
  });
});
