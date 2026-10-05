import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import { AuthService } from "../../services/identity/index.js";
import type {
  loginRoute,
  registerRoute,
  currentUserRoute,
  refreshRoute,
} from "../../routes/identity/index.js";

const authService = new AuthService();

export const register: RouteHandler<typeof registerRoute, AppEnv> = async (
  c,
) => {
  const body = c.req.valid("json");

  const response = await authService.register(body);

  return c.json(response, 201);
};

export const login: RouteHandler<typeof loginRoute, AppEnv> = async (c) => {
  const user = c.get("authUser");

  const response = await authService.login(user);

  return c.json(response, 200);
};

export const refresh: RouteHandler<typeof refreshRoute, AppEnv> = async (c) => {
  const user = c.get("authUser");
  const refreshToken = c.req.valid("json").refreshToken;

  const response = await authService.refresh(user, refreshToken);

  return c.json(response, 200);
};

export const currentUser: RouteHandler<
  typeof currentUserRoute,
  AppEnv
> = async (c) => {
  const user = c.get("authUser");

  return c.json(user, 200);
};
