import { cors } from "hono/cors";
import { env } from "./env.js";

/**
 * CORS restrito ao próprio servidor.
 * Origens permitidas: a origem da própria API (mesmo host/porta da requisição)
 * e as listadas em CORS_ALLOWED_ORIGINS (opcional, separadas por vírgula).
 */
const configuredOrigins = env.CORS_ALLOWED_ORIGINS.split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = new Set([
  `http://localhost:${env.PORT}`,
  `http://127.0.0.1:${env.PORT}`,
  ...configuredOrigins,
]);

export function resolveCorsOrigin(
  origin: string | undefined,
  requestUrl: string,
): string | undefined {
  if (!origin) return undefined;
  if (allowedOrigins.has(origin)) return origin;
  try {
    return new URL(requestUrl).origin === origin ? origin : undefined;
  } catch {
    return undefined;
  }
}

export const corsOptions: Parameters<typeof cors>[0] = {
  origin: (origin, c) => resolveCorsOrigin(origin, c.req.url),
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "X-Session-Id",
  ],
  exposeHeaders: ["X-Session-Id", "X-Request-Id", "Content-Disposition"],
  maxAge: 86_400,
};
