import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../database/prisma.js";
import { env } from "../config/env.js";
import { errorHandler } from "../errors/errorHandler.js";
import type { AppEnv } from "../interfaces/hono.js";
import decisionRoutes from "../routes/decisions/decision.routes.js";
import { signAccessToken } from "../utils/jwt.js";

vi.mock("../database/prisma.js", () => ({
  default: {
    decision: { findFirst: vi.fn(), updateMany: vi.fn() },
    decisionAlternative: { findFirst: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const app = new OpenAPIHono<AppEnv>();
app.route("/decisions", decisionRoutes);
app.onError(errorHandler);
const decisionId = "11111111-1111-4111-8111-111111111111";
const alternativeId = "22222222-2222-4222-8222-222222222222";
const base = `/decisions/${decisionId}/alternatives`;
const alternative = {
  id: alternativeId, decisionId, title: "Academia X", description: null,
  pros: null, cons: null, createdAt: new Date("2026-09-28T12:00:00Z"),
};
const originalSecret = env.JWT_SECRET;
let headers: Record<string, string>;
beforeEach(async () => {
  vi.resetAllMocks();
  env.JWT_SECRET = "test-secret-that-is-at-least-32-bytes-long";
  headers = { Authorization: `Bearer ${await signAccessToken("owner")}` };
  vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(prisma));
  vi.mocked(prisma.decision.updateMany).mockResolvedValue({ count: 1 });
  vi.mocked(prisma.decisionAlternative.deleteMany).mockResolvedValue({ count: 1 });
});
afterEach(() => { env.JWT_SECRET = originalSecret; });

describe("decision alternatives", () => {
  it("lists owned alternatives in a stable order and serializes dates", async () => {
    vi.mocked(prisma.decision.findFirst).mockResolvedValue({ alternatives: [alternative] } as never);
    const response = await app.request(base, { headers });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{
      id: alternativeId, title: "Academia X", description: null,
      pros: null, cons: null, createdAt: alternative.createdAt.toISOString(),
    }]);
    expect(prisma.decision.findFirst).toHaveBeenCalledWith({
      where: { id: decisionId, userId: "owner", deletedAt: null },
      select: { alternatives: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
    });
  });

  it("distinguishes an empty decision from an inaccessible decision", async () => {
    vi.mocked(prisma.decision.findFirst).mockResolvedValue({ alternatives: [] } as never);
    expect(await (await app.request(base, { headers })).json()).toEqual([]);
    vi.mocked(prisma.decision.findFirst).mockResolvedValue(null);
    expect((await app.request(base, { headers })).status).toBe(404);
  });

  it("looks up by alternative, parent decision and owner", async () => {
    vi.mocked(prisma.decisionAlternative.findFirst).mockResolvedValue(alternative);
    expect((await app.request(`${base}/${alternativeId}`, { headers })).status).toBe(200);
    expect(prisma.decisionAlternative.findFirst).toHaveBeenCalledWith({
      where: { id: alternativeId, decisionId, decision: { userId: "owner", deletedAt: null } },
    });
    vi.mocked(prisma.decisionAlternative.findFirst).mockResolvedValue(null);
    expect((await app.request(`${base}/${alternativeId}`, { headers })).status).toBe(404);
  });

  it("deletes only the matching alternative after locking the owned draft", async () => {
    const response = await app.request(`${base}/${alternativeId}`, { method: "DELETE", headers });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(prisma.decision.updateMany).toHaveBeenCalledWith({
      where: { id: decisionId, userId: "owner", deletedAt: null, status: "DRAFT" },
      data: { updatedAt: expect.any(Date) },
    });
    expect(prisma.decisionAlternative.deleteMany).toHaveBeenCalledWith({
      where: { id: alternativeId, decisionId },
    });
    expect(vi.mocked(prisma.decision.updateMany).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(prisma.decisionAlternative.deleteMany).mock.invocationCallOrder[0]!);
  });

  it("returns 404 for a missing or differently linked alternative", async () => {
    vi.mocked(prisma.decisionAlternative.deleteMany).mockResolvedValue({ count: 0 });
    expect((await app.request(`${base}/${alternativeId}`, { method: "DELETE", headers })).status).toBe(404);
  });

  it.each([["inaccessible", null, 404], ["confirmed", { id: decisionId }, 409]])(
    "prevents deletion when the decision is %s", async (_, decision, status) => {
      vi.mocked(prisma.decision.updateMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.decision.findFirst).mockResolvedValue(decision as never);
      expect((await app.request(`${base}/${alternativeId}`, { method: "DELETE", headers })).status).toBe(status);
      expect(prisma.decisionAlternative.deleteMany).not.toHaveBeenCalled();
    },
  );

  it.each([["GET", ""], ["GET", `/${alternativeId}`], ["DELETE", `/${alternativeId}`]])(
    "requires authentication for %s %s", async (method, suffix) => {
      expect((await app.request(base + suffix, { method })).status).toBe(401);
      expect(prisma.decision.findFirst).not.toHaveBeenCalled();
      expect(prisma.decisionAlternative.findFirst).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    },
  );

  it.each(["GET", "DELETE"])("rejects malformed IDs for %s before accessing storage", async (method) => {
    expect((await app.request(`${base}/invalid`, { method, headers })).status).toBe(400);
    expect(prisma.decisionAlternative.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("preserves validated creation", async () => {
    vi.mocked(prisma.decisionAlternative.create).mockResolvedValue(alternative);
    const options = { method: "POST", headers: { ...headers, "Content-Type": "application/json" } };
    expect((await app.request(base, { ...options, body: JSON.stringify({ title: "" }) })).status).toBe(400);
    expect(prisma.decisionAlternative.create).not.toHaveBeenCalled();
    expect((await app.request(base, { ...options, body: JSON.stringify({ title: "Academia X" }) })).status).toBe(201);
  });
});
