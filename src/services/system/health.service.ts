import { env } from "../../config/env.js";
import { HealthRepository } from "../../repositories/system/health.repository.js";

const DATABASE_TIMEOUT_MS = 3_000;

type DatabaseStatus = {
  status: "up" | "down";
  responseTimeMs: number;
};

export class HealthService {
  constructor(private readonly repository = new HealthRepository()) {}

  async getStatus(requestLogStatus: "up" | "down" = "up") {
    const database = await this.checkDatabase();
    const authentication = {
      status:
        env.JWT_SECRET && Buffer.byteLength(env.JWT_SECRET) >= 32
          ? ("configured" as const)
          : ("misconfigured" as const),
    };
    const memory = process.memoryUsage();
    const healthy =
      database.status === "up" &&
      authentication.status === "configured" &&
      requestLogStatus === "up";

    return {
      status: healthy ? ("ok" as const) : ("degraded" as const),
      service: "echoes",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      checks: {
        database,
        authentication,
        requestLogs: { status: requestLogStatus },
      },
      runtime: {
        nodeVersion: process.version,
        memory: {
          rssBytes: memory.rss,
          heapUsedBytes: memory.heapUsed,
          heapTotalBytes: memory.heapTotal,
        },
      },
    };
  }

  private async checkDatabase(): Promise<DatabaseStatus> {
    const startedAt = performance.now();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      await Promise.race([
        this.repository.checkDatabase(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error("Database health check timed out")),
            DATABASE_TIMEOUT_MS,
          );
        }),
      ]);
      return {
        status: "up",
        responseTimeMs: Math.round(performance.now() - startedAt),
      };
    } catch {
      return {
        status: "down",
        responseTimeMs: Math.round(performance.now() - startedAt),
      };
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}
