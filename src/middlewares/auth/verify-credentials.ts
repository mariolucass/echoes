import type { MiddlewareHandler } from "hono";
import { UnauthorizedError } from "../../errors/AppError.js";
import type { AppEnv } from "../../interfaces/hono.js";
import { UserRepository } from "../../repositories/identity/index.js";
import { loginSchema } from "../../schemas/identity/index.js";
import { verifyPassword } from "../../utils/password.js";
import { parseAuthBody } from "./parse-auth-body.js";

const users = new UserRepository();

export const verifyCredentials: MiddlewareHandler<AppEnv> = async (c, next) => {
  const { email, password } = await parseAuthBody(c, loginSchema);
  const user = await users.findByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new UnauthorizedError("Invalid email or password.");
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  c.set("authUser", publicUser);
  await next();
};
