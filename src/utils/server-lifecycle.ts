import type { serve } from "@hono/node-server";
import { logger } from "../config/logger.js";

type DatabaseConnection = { $disconnect(): Promise<void> };

export function registerShutdownHandlers(
  server: ReturnType<typeof serve>,
  database: DatabaseConnection,
): void {
  let shuttingDown = false;

  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Shutting down server");

    const timeout = setTimeout(() => {
      logger.fatal({ signal }, "Shutdown timed out");
      process.exit(1);
    }, 10_000);
    timeout.unref();

    server.close(async (err) => {
      if (err) {
        logger.error({ err }, "Failed to close server");
        process.exitCode = 1;
      } else {
        logger.info("Server closed");
      }

      try {
        await database.$disconnect();
        logger.info("Database disconnected");
      } catch (disconnectError) {
        logger.error({ err: disconnectError }, "Failed to disconnect database");
        process.exitCode = 1;
      } finally {
        clearTimeout(timeout);
      }
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}
