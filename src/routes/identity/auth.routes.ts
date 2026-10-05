import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  currentUser,
  login,
  register,
  refresh,
} from "../../controllers/identity/index.js";
import type { AppEnv } from "../../interfaces/hono.js";
import { ErrorCode } from "../../errors/errorCodes.js";
import {
  authenticate,
  authLimiter,
  ensureEmailAvailable,
  requireExistingUser,
  verifyCredentials,
  verifyRefreshToken,
} from "../../middlewares/auth/index.js";
import {
  authResponseSchema,
  loginSchema,
  publicUserSchema,
  registerSchema,
  refreshSchema,
} from "../../schemas/identity/index.js";
import { errorResponseSchema } from "../../schemas/shared/index.js";

const router = new OpenAPIHono<AppEnv>();

function errorResponse(description: string, code: ErrorCode, message: string) {
  return {
    description,
    content: {
      "application/json": {
        schema: errorResponseSchema,
        example: {
          success: false,
          error: { code, message, timestamp: "2026-09-26T12:00:00.000Z" },
        },
      },
    },
  };
}

const invalidBody = errorResponse(
  "Corpo da requisição inválido",
  ErrorCode.VALIDATION_ERROR,
  "Invalid input. Review the submitted fields and try again.",
);
const tooManyRequests = errorResponse(
  "Limite de tentativas de autenticação excedido",
  ErrorCode.RATE_LIMITED,
  "Too many authentication attempts from this IP. Try again later.",
);
const payloadTooLarge = errorResponse(
  "Corpo da requisição excede o limite de tamanho",
  ErrorCode.PAYLOAD_TOO_LARGE,
  "Request body is too large.",
);
const internalError = errorResponse(
  "Erro interno inesperado",
  ErrorCode.INTERNAL_ERROR,
  "An internal error occurred. Try again later.",
);

export const registerRoute = createRoute({
  method: "post",
  path: "/register",
  tags: ["Autenticação"],
  summary: "Cadastra um usuário e emite tokens de acesso e atualização",
  middleware: [authLimiter, ensureEmailAvailable] as const,
  request: {
    body: { content: { "application/json": { schema: registerSchema } } },
  },
  responses: {
    201: {
      description: "Usuário cadastrado",
      content: { "application/json": { schema: authResponseSchema } },
    },
    409: errorResponse(
      "E-mail já cadastrado",
      ErrorCode.CONFLICT,
      "Email already registered.",
    ),
    422: invalidBody,
    413: payloadTooLarge,
    429: tooManyRequests,
    500: internalError,
  },
});

export const loginRoute = createRoute({
  method: "post",
  path: "/login",
  tags: ["Autenticação"],
  summary: "Autentica um usuário e emite tokens de acesso e atualização",
  middleware: [authLimiter, verifyCredentials] as const,
  request: {
    body: { content: { "application/json": { schema: loginSchema } } },
  },
  responses: {
    200: {
      description: "Usuário autenticado",
      content: { "application/json": { schema: authResponseSchema } },
    },
    401: errorResponse(
      "Credenciais inválidas",
      ErrorCode.UNAUTHORIZED,
      "Invalid email or password.",
    ),
    422: invalidBody,
    413: payloadTooLarge,
    429: tooManyRequests,
    500: internalError,
  },
});

export const refreshRoute = createRoute({
  method: "post",
  path: "/refresh",
  tags: ["Autenticação"],
  summary: "Troca o token de atualização por um novo par de tokens",
  middleware: [authLimiter, verifyRefreshToken] as const,
  request: {
    body: { content: { "application/json": { schema: refreshSchema } } },
  },
  responses: {
    200: {
      description: "Tokens renovados",
      content: { "application/json": { schema: authResponseSchema } },
    },
    401: errorResponse(
      "Token de atualização inválido, expirado ou reutilizado",
      ErrorCode.UNAUTHORIZED,
      "Invalid refresh token.",
    ),
    422: invalidBody,
    413: payloadTooLarge,
    429: tooManyRequests,
    500: internalError,
  },
});

export const currentUserRoute = createRoute({
  method: "get",
  path: "/me",
  tags: ["Autenticação"],
  summary: "Retorna o usuário autenticado",
  security: [{ Bearer: [] }],
  middleware: [authenticate, requireExistingUser] as const,
  responses: {
    200: {
      description: "Usuário autenticado",
      content: { "application/json": { schema: publicUserSchema } },
    },
    401: errorResponse(
      "Token de acesso ausente ou inválido",
      ErrorCode.UNAUTHORIZED,
      "Authentication required. Provide a valid access token and try again.",
    ),
    404: errorResponse(
      "Usuário não encontrado",
      ErrorCode.NOT_FOUND,
      "User was not found. Check the identifier and try again.",
    ),
    429: errorResponse(
      "Limite de requisições da API excedido",
      ErrorCode.RATE_LIMITED,
      "Too many requests from this IP. Try again later.",
    ),
    500: internalError,
  },
});

router.openapi(registerRoute, register);
router.openapi(loginRoute, login);
router.openapi(refreshRoute, refresh);
router.openapi(currentUserRoute, currentUser);

export default router;
