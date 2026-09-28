import type { MiddlewareHandler } from "hono";
import { ConflictError } from "../../errors/AppError.js";
import type { AppEnv } from "../../interfaces/hono.js";
import { UserRepository } from "../../repositories/identity/index.js";
import { registerSchema } from "../../schemas/identity/index.js";
import { parseAuthBody } from "./parse-auth-body.js";

const users = new UserRepository();

export const ensureEmailAvailable: MiddlewareHandler<AppEnv> = async (
  c,
  next,
) => {
  const { email } = await parseAuthBody(c, registerSchema);
  if (await users.findExistingEmail(email)) {
    throw new ConflictError("Email already registered.");
  }
  await next();
};
