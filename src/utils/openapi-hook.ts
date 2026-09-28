import type { Hook } from "@hono/zod-openapi";

export const defaultHook: Hook<any, any, any, any> = (result) => {
  if (!result.success) {
    throw result.error;
  }
};
