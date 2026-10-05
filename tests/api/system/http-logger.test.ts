import { Hono } from "hono";
import pino from "pino";
import { describe, expect, it, vi } from "vitest";
import {
  httpLogger,
  requestIdMiddleware,
} from "../../../src/middlewares/global/index.js";

const lines = vi.hoisted(() => [] as string[]);

vi.mock("../../../src/config/logger.js", () => ({
  logger: pino(
    {
      serializers: {
        req: pino.stdSerializers.req,
      },
    },
    { write: (line: string) => lines.push(line) },
  ),
}));

describe("HTTP logger", () => {
  it.each([200, 401])(
    "logs status %i without request headers",
    async (status) => {
      lines.length = 0;
      const app = new Hono();
      app.use("*", requestIdMiddleware, httpLogger);
      app.get("/example", (c) => c.text("ok", status as 200 | 401));

      const response = await app.request("/example", {
        headers: { authorization: "Bearer secret", "accept-encoding": "gzip" },
      });
      const entry = JSON.parse(lines.at(-1) ?? "{}") as {
        req: { method: string; url: string; headers?: unknown };
        res: { statusCode: number };
        reqId: string;
      };

      expect(entry.req).toEqual({ method: "GET", url: "/example" });
      expect(entry.res).toEqual({ statusCode: status });
      expect(entry.reqId).toBe(response.headers.get("x-request-id"));
      expect(lines.at(-1)).not.toContain("Bearer secret");
    },
  );
});
