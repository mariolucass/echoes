import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../../../src/app.js";
import prisma from "../../../src/database/prisma.js";
import { signAccessToken } from "../../../src/utils/jwt.js";

vi.mock("../../../src/database/prisma.js", () => ({
  default: {
    decision: { findMany: vi.fn() },
    requestLog: { create: vi.fn().mockResolvedValue(undefined) },
  },
}));

afterEach(() => vi.clearAllMocks());

describe("GET /export/csv", () => {
  it("requires authentication", async () => {
    expect((await app.request("/export/csv")).status).toBe(401);
    expect(prisma.decision.findMany).not.toHaveBeenCalled();
  });

  it("returns the user's decisions as an escaped CSV attachment", async () => {
    vi.mocked(prisma.decision.findMany).mockResolvedValue([
      {
        id: "9f1c2e4a-5b6d-4f8e-9a1b-2c3d4e5f6a7b",
        title: 'Mudar, "agora"',
        description: "linha1\nlinha2",
        context: null,
        status: "ACTIVE",
        decidedAt: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ] as never);
    const token = await signAccessToken("owner");
    const response = await app.request("/export/csv", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^text\/csv/);
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="echoes-decisoes-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    const text = await response.text();
    expect(text).toContain("id,titulo,descricao");
    expect(text).toContain('"Mudar, ""agora"""');
    expect(text).toContain('"linha1\nlinha2"');
    expect(prisma.decision.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "owner", deletedAt: null } }),
    );
  });
});
