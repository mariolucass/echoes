import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import { ExpectationService } from "../../services/decisions/expectation.service.js";
import type { addExpectationRoute } from "../../routes/decisions/expectation.routes.js";

const service = new ExpectationService();

export const addExpectation: RouteHandler<
  typeof addExpectationRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const response = await service.addExpectation(user.id, id, body);

  return c.json(response, 201);
};
