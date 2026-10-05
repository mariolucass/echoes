import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../../src/app.js";
import prisma from "../../../src/database/prisma.js";
import { signAccessToken } from "../../../src/utils/jwt.js";
import {
  reportDecision,
  reportNow,
} from "../../support/builders/report-decision.js";

vi.mock("../../../src/database/prisma.js", () => ({
  default: {
    decision: { findMany: vi.fn(), findFirst: vi.fn() },
    requestLog: { create: vi.fn().mockResolvedValue(undefined) },
  },
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(reportNow);
});
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("decision PDF endpoints", () => {
  it("exports the requested filtered page through the ownership-scoped relation query", async () => {
    vi.mocked(prisma.decision.findMany).mockResolvedValue([
      reportDecision(),
    ] as never);
    const token = await signAccessToken("owner");
    const response = await app.request(
      "/decisions/report.pdf?page=2&limit=10&status=ACTIVE&search=tempo&sortBy=title&order=asc",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(
      Buffer.from(await response.arrayBuffer())
        .subarray(0, 5)
        .toString(),
    ).toBe("%PDF-");
    expect(prisma.decision.findMany).toHaveBeenCalledOnce();
    expect(prisma.decision.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        orderBy: [{ title: "asc" }, { id: "asc" }],
        where: {
          AND: expect.arrayContaining([
            { userId: "owner", deletedAt: null },
            { status: "ACTIVE" },
          ]),
        },
        select: expect.objectContaining({
          checkpoints: expect.any(Object),
          expectations: expect.any(Object),
          revisions: expect.any(Object),
        }),
      }),
    );
  });

  it("exports one decision with its history and scopes the ID to its owner", async () => {
    const decision = reportDecision();
    vi.mocked(prisma.decision.findFirst).mockResolvedValue(decision as never);
    const token = await signAccessToken("owner");
    const response = await app.request(`/decisions/${decision.id}/report.pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^application\/pdf/);
    expect(response.headers.get("content-disposition")).toContain(
      "echoes-decisao-reduzir-o-tempo-de-deslocamento-9f1c2e4a.pdf",
    );
    expect(
      Buffer.from(await response.arrayBuffer())
        .subarray(0, 5)
        .toString(),
    ).toBe("%PDF-");
    expect(prisma.decision.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: decision.id, userId: "owner", deletedAt: null },
      }),
    );
  });

  it("rejects unauthenticated or invalid requests before fetching and returns 404 for inaccessible decisions", async () => {
    const token = await signAccessToken("owner");
    const headers = { Authorization: `Bearer ${token}` };
    const path = `/decisions/${reportDecision().id}/report.pdf`;
    expect((await app.request(path)).status).toBe(401);
    expect(
      (await app.request("/decisions/not-a-uuid/report.pdf", { headers }))
        .status,
    ).toBe(422);
    expect(
      (await app.request("/decisions/report.pdf?limit=49", { headers })).status,
    ).toBe(422);
    expect(prisma.decision.findFirst).not.toHaveBeenCalled();
    expect(prisma.decision.findMany).not.toHaveBeenCalled();
    vi.mocked(prisma.decision.findFirst).mockResolvedValue(null);
    expect((await app.request(path, { headers })).status).toBe(404);
  });
});
