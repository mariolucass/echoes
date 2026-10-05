import type { Context } from "hono";
import { HealthService } from "../../services/system/index.js";

const healthService = new HealthService();

export async function healthController(c: Context) {
  const requestLogStatus = c.get("requestLogStatus") ?? "up";

  const status = await healthService.getStatus(requestLogStatus);

  c.header("Cache-Control", "no-store");

  return status.status === "ok" ? c.json(status, 200) : c.json(status, 503);
}
