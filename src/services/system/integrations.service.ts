import { randomUUID } from "node:crypto";
import type { Collection } from "mongodb";
import { env } from "../../config/env.js";
import { getMongoDb } from "../../database/mongo.js";
import { HealthRepository } from "../../repositories/system/health.repository.js";
import { signCloudinary } from "../storage/image-storage.service.js";

export type IntegrationId = "postgres" | "mongodb" | "cloudinary";

export type IntegrationCheck = {
  id: IntegrationId;
  name: string;
  role: string;
  status: "up" | "down" | "unconfigured";
  latencyMs: number | null;
  details: { label: string; value: string }[];
  error: string | null;
};

export type RoundtripStep = {
  service: IntegrationId;
  step: string;
  ok: boolean;
  ms: number;
  detail: string | null;
};

type DiagnosticDocument = { _id: string; purpose: string; createdAt: Date };

const TIMEOUT_MS = 6_000;
const DIAGNOSTICS_FOLDER = "echoes/diagnostics";
// PNG 1×1 transparente: o menor arquivo que o Cloudinary aceita como imagem.
const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label}: tempo esgotado`)), TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function timed<T>(fn: () => Promise<T>) {
  const started = performance.now();
  const value = await fn();
  return { value, ms: Math.round(performance.now() - started) };
}

/** Mensagem curta e sem segredos (URIs e chaves nunca saem daqui). */
function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, "mongodb://***").slice(0, 160);
}

const cloudinaryConfigured = () =>
  Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

function cloudinaryUrl(path: string) {
  return `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}${path}`;
}

/**
 * Diagnóstico das integrações externas. `check` só lê (ping + latência); `roundtrip` faz um
 * teste real e desfaz o que criou: sobe e apaga uma imagem 1×1 no Cloudinary, grava, lê e
 * apaga um documento no MongoDB.
 */
export class IntegrationsService {
  constructor(
    private readonly health = new HealthRepository(),
    private readonly http: typeof fetch = fetch,
  ) {}

  async check(): Promise<IntegrationCheck[]> {
    return Promise.all([this.checkPostgres(), this.checkMongo(), this.checkCloudinary()]);
  }

  async checkPostgres(): Promise<IntegrationCheck> {
    const base = {
      id: "postgres" as const,
      name: "PostgreSQL",
      role: "Decisões, métricas, checkpoints e aprendizado",
      details: [{ label: "ORM", value: "Prisma" }],
    };
    try {
      const { ms } = await timed(() => withTimeout(this.health.checkDatabase(), "Postgres"));
      return { ...base, status: "up", latencyMs: ms, error: null };
    } catch (error) {
      return { ...base, status: "down", latencyMs: null, error: safeError(error) };
    }
  }

  async checkMongo(): Promise<IntegrationCheck> {
    const base = { id: "mongodb" as const, name: "MongoDB Atlas", role: "Contas de usuário (nome, e-mail, avatar)" };
    if (!env.MONGODB_URI) {
      return {
        ...base,
        status: "unconfigured",
        latencyMs: null,
        details: [{ label: "Usuários", value: "no PostgreSQL (MONGODB_URI vazia)" }],
        error: null,
      };
    }
    try {
      const db = await withTimeout(getMongoDb(), "MongoDB");
      const { ms } = await timed(() => withTimeout(db.command({ ping: 1 }), "MongoDB"));
      const [build, users] = await Promise.all([
        db.command({ buildInfo: 1 }).catch(() => null),
        db.collection("users").estimatedDocumentCount().catch(() => null),
      ]);
      return {
        ...base,
        status: "up",
        latencyMs: ms,
        details: [
          { label: "Banco", value: env.MONGODB_DB },
          ...(build?.version ? [{ label: "Versão", value: String(build.version) }] : []),
          ...(users !== null ? [{ label: "Usuários", value: users.toLocaleString("pt-BR") }] : []),
        ],
        error: null,
      };
    } catch (error) {
      return { ...base, status: "down", latencyMs: null, details: [{ label: "Banco", value: env.MONGODB_DB }], error: safeError(error) };
    }
  }

  async checkCloudinary(): Promise<IntegrationCheck> {
    const base = { id: "cloudinary" as const, name: "Cloudinary", role: "Fotos de perfil (upload e entrega por CDN)" };
    if (!cloudinaryConfigured()) {
      return { ...base, status: "unconfigured", latencyMs: null, details: [], error: null };
    }
    const details = [
      { label: "Cloud", value: env.CLOUDINARY_CLOUD_NAME! },
      { label: "Pasta", value: env.CLOUDINARY_FOLDER },
    ];
    try {
      const auth = Buffer.from(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`).toString("base64");
      const { value: res, ms } = await timed(() =>
        withTimeout(this.http(cloudinaryUrl("/ping"), { headers: { Authorization: `Basic ${auth}` } }), "Cloudinary"),
      );
      if (!res.ok) return { ...base, status: "down", latencyMs: ms, details, error: `HTTP ${res.status}` };
      return { ...base, status: "up", latencyMs: ms, details, error: null };
    } catch (error) {
      return { ...base, status: "down", latencyMs: null, details, error: safeError(error) };
    }
  }

  async roundtrip(): Promise<{ ok: boolean; steps: RoundtripStep[] }> {
    const steps = [...(await this.mongoRoundtrip()), ...(await this.cloudinaryRoundtrip())];
    return { ok: steps.every((s) => s.ok), steps };
  }

  private async run(service: IntegrationId, step: string, fn: () => Promise<string | null>): Promise<RoundtripStep> {
    const started = performance.now();
    try {
      const detail = await withTimeout(fn(), step);
      return { service, step, ok: true, ms: Math.round(performance.now() - started), detail };
    } catch (error) {
      return { service, step, ok: false, ms: Math.round(performance.now() - started), detail: safeError(error) };
    }
  }

  private async mongoRoundtrip(): Promise<RoundtripStep[]> {
    if (!env.MONGODB_URI) return [{ service: "mongodb", step: "Configuração", ok: false, ms: 0, detail: "MONGODB_URI não definida" }];
    const id = randomUUID();
    const steps: RoundtripStep[] = [];
    let collection: Collection<DiagnosticDocument>;
    try {
      collection = (await withTimeout(getMongoDb(), "MongoDB")).collection<DiagnosticDocument>("diagnostics");
    } catch (error) {
      return [{ service: "mongodb", step: "Conectar", ok: false, ms: 0, detail: safeError(error) }];
    }
    steps.push(
      await this.run("mongodb", "Gravar documento", async () => {
        await collection.insertOne({ _id: id, purpose: "echoes-diagnostic", createdAt: new Date() });
        return `diagnostics/${id.slice(0, 8)}`;
      }),
    );
    steps.push(
      await this.run("mongodb", "Ler de volta", async () => {
        const doc = await collection.findOne({ _id: id });
        if (!doc) throw new Error("documento não encontrado");
        return "conteúdo confere";
      }),
    );
    steps.push(
      await this.run("mongodb", "Apagar", async () => {
        const { deletedCount } = await collection.deleteOne({ _id: id });
        if (deletedCount !== 1) throw new Error("nada foi apagado");
        return "limpo";
      }),
    );
    return steps;
  }

  private async cloudinaryRoundtrip(): Promise<RoundtripStep[]> {
    if (!cloudinaryConfigured()) {
      return [{ service: "cloudinary", step: "Configuração", ok: false, ms: 0, detail: "credenciais do Cloudinary ausentes" }];
    }
    const publicId = `${DIAGNOSTICS_FOLDER}/${randomUUID()}`;
    const signed = (params: Record<string, string>) => {
      const form = new FormData();
      for (const [k, v] of Object.entries(params)) form.set(k, v);
      form.set("api_key", env.CLOUDINARY_API_KEY!);
      form.set("signature", signCloudinary(params, env.CLOUDINARY_API_SECRET!));
      return form;
    };
    const timestamp = () => Math.floor(Date.now() / 1000).toString();
    let secureUrl = "";

    const upload = await this.run("cloudinary", "Enviar imagem 1×1", async () => {
      const form = signed({ public_id: publicId, timestamp: timestamp() });
      form.set("file", PIXEL);
      const res = await this.http(cloudinaryUrl("/image/upload"), { method: "POST", body: form });
      if (!res.ok) throw new Error(`upload HTTP ${res.status}`);
      const body = (await res.json()) as { secure_url?: string; bytes?: number };
      if (!body.secure_url) throw new Error("resposta sem secure_url");
      secureUrl = body.secure_url;
      return `${body.bytes ?? "?"} bytes enviados`;
    });
    if (!upload.ok) return [upload];

    const deliver = await this.run("cloudinary", "Entregar pela CDN", async () => {
      const res = await this.http(secureUrl, { method: "HEAD" });
      if (!res.ok) throw new Error(`CDN HTTP ${res.status}`);
      return res.headers.get("content-type") ?? "ok";
    });

    const destroy = await this.run("cloudinary", "Apagar", async () => {
      const res = await this.http(cloudinaryUrl("/image/destroy"), {
        method: "POST",
        body: signed({ public_id: publicId, timestamp: timestamp(), invalidate: "true" }),
      });
      const body = (await res.json().catch(() => ({}))) as { result?: string };
      if (!res.ok || body.result !== "ok") throw new Error(`destroy: ${body.result ?? `HTTP ${res.status}`}`);
      return "limpo";
    });

    return [upload, deliver, destroy];
  }
}
