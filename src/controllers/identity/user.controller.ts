import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import type { updateAvatarRoute, updateProfileRoute } from "../../routes/identity/user.routes.js";
import { AvatarService } from "../../services/identity/avatar.service.js";
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

const avatarService = new AvatarService();

export const updateAvatar: RouteHandler<typeof updateAvatarRoute, AppEnv> =
  async (c) => {
    const body = await c.req.parseBody();
    const response = await avatarService.upload(c.get("user").id, body["file"]);
    return c.json(response, 200);
  };
