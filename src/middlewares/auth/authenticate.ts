import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../../interfaces/hono.js";
import { UnauthorizedError } from "../../errors/AppError.js";
import { verifyAccessToken } from "../../utils/jwt.js";

export const authenticate: MiddlewareHandler<AppEnv> = async (c, next) => {
  const match = /^Bearer (\S+)$/i.exec(c.req.header("authorization") ?? "");

  if (!match) {
    throw new UnauthorizedError();
  }

  try {
    c.set("user", { id: await verifyAccessToken(match[1]!) });
  } catch {
    throw new UnauthorizedError();
  }
  await next();
};
