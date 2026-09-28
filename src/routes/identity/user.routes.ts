import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import { publicUserSchema } from "../../schemas/identity/auth.schema.js";
import { protectedRoute, routeErrors } from "../shared/domain-routes.js";
import { text } from "../../schemas/decisions/decision-fields.schema.js";
import { defaultHook } from "../../utils/openapi-hook.js";
import { ProfileService } from "../../services/identity/profile.service.js";

const router = new OpenAPIHono<AppEnv>({ defaultHook });

const input = z.object({ name: text(100) }).strict();

const update = createRoute({
  method: "patch",
  path: "/me",
  tags: ["Identity"],
  summary: "Atualiza o nome do usuário autenticado",
  ...protectedRoute,
  request: { body: { content: { "application/json": { schema: input } } } },
  responses: {
    200: {
      description: "Perfil atualizado",
      content: { "application/json": { schema: publicUserSchema } },
    },
    ...routeErrors,
  },
});

router.openapi(update, async (c) => {
  return c.json(await ProfileService.updateName(c.get("user").id, c.req.valid("json").name), 200);
});
export default router;
