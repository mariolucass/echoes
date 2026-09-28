import { z } from "@hono/zod-openapi";

const nameSchema = z
  .string()
  .trim()
  .normalize()
  .min(1, { error: "Nome é obrigatório" })
  .max(100, { error: "Nome deve ter no máximo 100 caracteres" })
  .openapi({ example: "Ada Lovelace" });

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ error: "Email inválido" })
  .max(254, { error: "Email deve ter no máximo 254 caracteres" })
  .openapi({ example: "ada@example.com" });

const newPasswordSchema = z
  .string()
  .min(8, { error: "Senha deve ter no mínimo 8 caracteres" })
  .max(128, { error: "Senha deve ter no máximo 128 caracteres" })
  .openapi({ example: "S3cur3P@ssword!" });

const existingPasswordSchema = z
  .string()
  .min(1, { error: "Senha é obrigatória" })
  .max(128, { error: "Senha deve ter no máximo 128 caracteres" })
  .openapi({ example: "S3cur3P@ssword!" });

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: newPasswordSchema,
  })
  .strict()
  .openapi("RegisterRequest");

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: emailSchema,
    password: existingPasswordSchema,
  })
  .strict()
  .openapi("LoginRequest");

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z
  .object({
    refreshToken: z
      .string()
      .min(1, { error: "refreshToken é obrigatório" })
      .max(512, { error: "refreshToken inválido" })
      .openapi({ example: "8f1e2a3b-...-refresh-token" }),
  })
  .strict()
  .openapi("RefreshRequest");

export type RefreshInput = z.infer<typeof refreshSchema>;

export const publicUserSchema = z
  .object({
    id: z.uuid().openapi({ example: "9f1c2e4a-5b6d-4f8e-9a1b-2c3d4e5f6a7b" }),
    name: z.string().openapi({ example: "Ada Lovelace" }),
    email: z.email().openapi({ example: "ada@example.com" }),
    createdAt: z.iso
      .datetime()
      .openapi({ example: "2026-01-15T10:30:00.000Z" }),
  })
  .openapi("PublicUser");

export type PublicUser = z.infer<typeof publicUserSchema>;

const sessionSchema = z
  .object({
    accessToken: z.string().openapi({ example: "eyJhbGciOiJIUzI1NiIs..." }),
    accessTokenExpiresAt: z.iso
      .datetime()
      .openapi({ example: "2026-01-15T10:45:00.000Z" }),
    refreshToken: z.string().openapi({ example: "8f1e2a3b-...-refresh-token" }),
    refreshTokenExpiresAt: z.iso
      .datetime()
      .openapi({ example: "2026-02-14T10:30:00.000Z" }),
    tokenType: z.literal("Bearer").openapi({ example: "Bearer" }),
  })
  .openapi("Session");

export type Session = z.infer<typeof sessionSchema>;

export const authResponseSchema = z
  .object({
    user: publicUserSchema,
    session: sessionSchema,
  })
  .openapi("AuthResponse");

export type AuthResponse = z.infer<typeof authResponseSchema>;
