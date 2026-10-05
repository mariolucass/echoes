import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import type { updateProfileRoute } from "../../routes/identity/user.routes.js";
import { ProfileService } from "../../services/identity/profile.service.js";

export const updateProfile: RouteHandler<
  typeof updateProfileRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");

  const response = await ProfileService.updateName(
    user.id,
    c.req.valid("json").name,
  );

  return c.json(response, 200);
};
