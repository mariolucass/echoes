import "dotenv/config";
import { z } from "zod";
import { logger } from "./logger.js";

const rawSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3333),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.url().optional(),
  JWT_SECRET: z.string().min(32, "Set JWT_SECRET to at least 32 characters."),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  API_TIME_ZONE: z
    .string()
    .refine((tz) => Intl.supportedValuesOf("timeZone").includes(tz), {
      message: "Set API_TIME_ZONE to a valid IANA time zone.",
    })
    .default("America/Sao_Paulo"),
  WEEKDAY_ONLY_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  CORS_ALLOWED_ORIGINS: z.string().default(""),
  APP_BASE_URL: z.url().optional(),
  MONGODB_URI: z.string().startsWith("mongo").optional(),
  MONGODB_DB: z.string().default("echoes"),
  TWO_FACTOR_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("Echoes <no-reply@echoes.local>"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default("echoes/avatars"),
});

const schema = rawSchema.superRefine((data, ctx) => {
  if (data.NODE_ENV === "production" && !data.DATABASE_URL) {
    ctx.addIssue({
      code: "custom",
      path: ["DATABASE_URL"],
      message: "Set DATABASE_URL in production.",
    });
  }
  if (
    data.NODE_ENV === "production" &&
    data.TWO_FACTOR_ENABLED &&
    !data.SMTP_HOST
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["SMTP_HOST"],
      message: "Set SMTP_HOST to send 2FA codes in production.",
    });
  }
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  logger.fatal(
    { issues: parsed.error.flatten().fieldErrors },
    "Invalid environment configuration. Correct the reported variables and restart the service.",
  );
  process.exit(1);
}

export const env = {
  ...parsed.data,
  DATABASE_URL:
    parsed.data.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/echoes",
};
