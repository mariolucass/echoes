import { cors } from "hono/cors";
import { env } from "./env.js";

const isProduction = env.NODE_ENV === "production";

const PRODUCTION_ORIGINS = env.CORS_ALLOWED_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const DEVELOPMENT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://api.local",
  "https://api.local",
  "http://app.local",
  "https://app.local",
];

if (isProduction && PRODUCTION_ORIGINS.length === 0) {
  throw new Error("CORS_ALLOWED_ORIGINS não está configurada em produção");
}

const allowedOrigins = new Set(
  isProduction
    ? PRODUCTION_ORIGINS
    : [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS],
);

export const corsOptions: Parameters<typeof cors>[0] = {
  origin: (origin) =>
    origin && allowedOrigins.has(origin) ? origin : undefined,
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "X-Session-Id",
  ],
  exposeHeaders: ["X-Session-Id", "X-Request-Id"],
  maxAge: 86_400,
};
