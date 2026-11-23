import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../../../src/config/env.js";

const db = {
  command: vi.fn(),
  collection: vi.fn(),
};
vi.mock("../../../src/database/mongo.js", () => ({ getMongoDb: vi.fn(async () => db) }));

const { IntegrationsService } = await import("../../../src/services/system/integrations.service.js");

const health = { checkDatabase: vi.fn().mockResolvedValue([{ "?column?": 1 }]) };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("IntegrationsService", () => {
  const original = { ...env };
  afterEach(() => {
    Object.assign(env, original);
    vi.clearAllMocks();
  });

  it("marca Mongo e Cloudinary como não configurados sem credenciais, sem chamar nada", async () => {
    Object.assign(env, { MONGODB_URI: undefined, CLOUDINARY_CLOUD_NAME: undefined });
    const http = vi.fn();
    const checks = await new IntegrationsService(health as never, http).check();

    expect(checks.map((c) => [c.id, c.status])).toEqual([
      ["postgres", "up"],
      ["mongodb", "unconfigured"],
      ["cloudinary", "unconfigured"],
    ]);
    expect(http).not.toHaveBeenCalled();
    expect(db.command).not.toHaveBeenCalled();
  });

  it("faz ping no Mongo e no Cloudinary e nunca devolve segredos", async () => {
    Object.assign(env, {
      MONGODB_URI: "mongodb+srv://user:senha@cluster/x",
      CLOUDINARY_CLOUD_NAME: "nuvem",
      CLOUDINARY_API_KEY: "key",
      CLOUDINARY_API_SECRET: "segredo",
    });
    db.command.mockImplementation(async (cmd: object) => ("buildInfo" in cmd ? { version: "8.0.0" } : { ok: 1 }));
    db.collection.mockReturnValue({ estimatedDocumentCount: vi.fn().mockResolvedValue(15) });
    const http = vi.fn().mockResolvedValue(json({ status: "ok" }));

    const checks = await new IntegrationsService(health as never, http).check();
    const [, mongo, cloudinary] = checks;

    expect(mongo).toMatchObject({ status: "up", error: null });
    expect(mongo?.details).toContainEqual({ label: "Usuários", value: "15" });
    expect(cloudinary?.status).toBe("up");
    expect(http).toHaveBeenCalledWith(
      "https://api.cloudinary.com/v1_1/nuvem/ping",
      { headers: { Authorization: `Basic ${Buffer.from("key:segredo").toString("base64")}` } },
    );
    expect(JSON.stringify(checks)).not.toMatch(/segredo|senha/);
  });

  it("reporta queda sem vazar a URI do Mongo", async () => {
    Object.assign(env, { MONGODB_URI: "mongodb+srv://user:senha@cluster/x", CLOUDINARY_CLOUD_NAME: undefined });
    db.command.mockRejectedValue(new Error("falhou em mongodb+srv://user:senha@cluster/x"));

    const [, mongo] = await new IntegrationsService(health as never, vi.fn()).check();

    expect(mongo?.status).toBe("down");
    expect(mongo?.error).not.toContain("senha");
  });

  it("no teste completo grava, lê e apaga no Mongo e sobe, entrega e apaga no Cloudinary", async () => {
    Object.assign(env, {
      MONGODB_URI: "mongodb://local",
      CLOUDINARY_CLOUD_NAME: "nuvem",
      CLOUDINARY_API_KEY: "key",
      CLOUDINARY_API_SECRET: "segredo",
    });
    const store = new Map<string, object>();
    db.collection.mockReturnValue({
      insertOne: vi.fn(async (doc: { _id: string }) => store.set(doc._id, doc)),
      findOne: vi.fn(async ({ _id }: { _id: string }) => store.get(_id) ?? null),
      deleteOne: vi.fn(async ({ _id }: { _id: string }) => ({ deletedCount: store.delete(_id) ? 1 : 0 })),
    });
    const http = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/image/upload")) return json({ secure_url: "https://res.cloudinary.com/x.png", bytes: 68 });
      if (init?.method === "HEAD") return new Response(null, { status: 200, headers: { "content-type": "image/png" } });
      if (url.endsWith("/image/destroy")) return json({ result: "ok" });
      return json({}, 404);
    });

    const result = await new IntegrationsService(health as never, http as never).roundtrip();

    expect(result.ok).toBe(true);
    expect(result.steps.map((s) => `${s.service}:${s.step}`)).toEqual([
      "mongodb:Gravar documento",
      "mongodb:Ler de volta",
      "mongodb:Apagar",
      "cloudinary:Enviar imagem 1×1",
      "cloudinary:Entregar pela CDN",
      "cloudinary:Apagar",
    ]);
    expect(store.size).toBe(0);
    const destroy = http.mock.calls.find(([url]) => url.endsWith("/image/destroy"))!;
    const upload = http.mock.calls.find(([url]) => url.endsWith("/image/upload"))!;
    expect((destroy[1]!.body as FormData).get("public_id")).toBe((upload[1]!.body as FormData).get("public_id"));
    expect(String((upload[1]!.body as FormData).get("public_id"))).toMatch(/^echoes\/diagnostics\//);
  });

  it("não tenta apagar no Cloudinary se o upload falhou", async () => {
    Object.assign(env, { MONGODB_URI: undefined, CLOUDINARY_CLOUD_NAME: "nuvem", CLOUDINARY_API_KEY: "key", CLOUDINARY_API_SECRET: "s" });
    const http = vi.fn().mockResolvedValue(json({ error: "x" }, 401));

    const result = await new IntegrationsService(health as never, http).roundtrip();

    expect(result.ok).toBe(false);
    expect(http).toHaveBeenCalledTimes(1);
    expect(result.steps.at(-1)).toMatchObject({ service: "cloudinary", ok: false, detail: "upload HTTP 401" });
  });
});
