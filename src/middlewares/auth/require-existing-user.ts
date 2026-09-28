import type { MiddlewareHandler } from "hono";
import { z } from "zod";
import { NotFoundError, UnauthorizedError } from "../../errors/AppError.js";
import type { AppEnv } from "../../interfaces/hono.js";
import { UserRepository } from "../../repositories/identity/index.js";

const users = new UserRepository();

export const requireExistingUser: MiddlewareHandler<AppEnv> = async (
  c,
  next,
) => {
  const userId = c.get("user").id;
  if (!z.uuid().safeParse(userId).success) throw new UnauthorizedError();
  const user = await users.findById(userId);
  if (!user) throw new NotFoundError("User");
  c.set("authUser", user);
  await next();
};
