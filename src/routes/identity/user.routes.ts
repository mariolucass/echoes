import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import { publicUserSchema } from "../../schemas/identity/auth.schema.js";
import { protectedRoute, routeErrors } from "../shared/domain-routes.js";
import { defaultHook } from "../../utils/openapi-hook.js";
import { updateProfile } from "../../controllers/identity/user.controller.js";
import { updateProfileSchema } from "../../schemas/identity/user.schema.js";

const router = new OpenAPIHono<AppEnv>({ defaultHook });

export const updateProfileRoute = createRoute({
  method: "patch",
  path: "/me",
  tags: ["Identity"],
  summary: "Atualiza o nome do usuário autenticado",
  ...protectedRoute,
  request: { body: { content: { "application/json": { schema: updateProfileSchema } } } },
  responses: {
    200: {
      description: "Perfil atualizado",
      content: { "application/json": { schema: publicUserSchema } },
    },
    ...routeErrors,
  },
});

router.openapi(updateProfileRoute, updateProfile);
export default router;
