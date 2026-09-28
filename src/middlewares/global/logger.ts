import { pinoLogger } from "hono-pino";
import { logger } from "../../config/logger.js";

export const httpLogger = pinoLogger({
  pino: logger,
  http: {
    onReqBindings: (c) => ({
      req: {
        method: c.req.method,
        url: c.req.path,
      },
    }),
    onResBindings: (c) => ({
      res: {
        statusCode: c.res.status,
      },
    }),
  },
});
