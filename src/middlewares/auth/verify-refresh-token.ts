import type { MiddlewareHandler } from "hono";
import { z } from "zod";
import { UnauthorizedError } from "../../errors/AppError.js";
import type { AppEnv } from "../../interfaces/hono.js";
import { UserRepository } from "../../repositories/identity/index.js";
import { refreshSchema } from "../../schemas/identity/index.js";
import { verifyRefreshToken as verifyJwtRefreshToken } from "../../utils/jwt.js";
import { parseAuthBody } from "./parse-auth-body.js";

const users = new UserRepository();

export const verifyRefreshToken: MiddlewareHandler<AppEnv> = async (
  c,
  next,
) => {
  const { refreshToken } = await parseAuthBody(c, refreshSchema);
  let userId: string;
  try {
    userId = await verifyJwtRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Invalid refresh token.");
  }

  if (!z.uuid().safeParse(userId).success) {
    throw new UnauthorizedError("Invalid refresh token.");
  }

  const user = await users.findById(userId);
  if (!user) {
    throw new UnauthorizedError("Invalid refresh token.");
  }

  c.set("authUser", user);
  await next();
};
