import type { MiddlewareHandler } from "hono";
import { RequestLogService } from "../../services/system/index.js";
import { logger } from "../../config/logger.js";

const service = new RequestLogService();

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const route = c.req.path;
  try {
    await service.record({
      timestamp: new Date().toISOString(),
      method: c.req.method,
      route,
      requestId: c.get("requestId"),
    });
    c.set("requestLogStatus", "up");
  } catch (err) {
    c.set("requestLogStatus", "down");
    logger.error(
      {
        err,
        requestId: c.get("requestId"),
        method: c.req.method,
        route,
      },
      "Failed to persist request log",
    );
  }
  await next();
};
