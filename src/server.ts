import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import prisma from "./database/prisma.js";
import { registerShutdownHandlers } from "./utils/server-lifecycle.js";
import { registerDecisionSubscribers } from "./subscribers/index.js";

const startedAt = performance.now();

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled promise rejection");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  process.exit(1);
});

async function bootstrap() {
  try {
    logger.info("Connecting to database");
    await prisma.$connect();
    logger.info("Database connected");
    registerDecisionSubscribers();

    const server = serve(
      { fetch: app.fetch, port: env.PORT, hostname: "0.0.0.0" },
      () => {
        logger.info(
          {
            port: env.PORT,
            environment: env.NODE_ENV,
            startupMs: Math.round(performance.now() - startedAt),
          },
          "Server listening",
        );
      },
    );

    registerShutdownHandlers(server, prisma);
  } catch (err) {
    logger.fatal({ err }, "Failed to start server");
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      logger.error({ err: disconnectError }, "Failed to disconnect database");
    }
    process.exit(1);
  }
}

void bootstrap();
