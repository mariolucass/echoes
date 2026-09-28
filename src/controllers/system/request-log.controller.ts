import type { Context } from "hono";
import { RequestLogService } from "../../services/system/index.js";

const service = new RequestLogService();

export async function listRequestLogs(c: Context) {
  c.header("Cache-Control", "no-store");
  const date = c.req.query("date") ?? "";

  const logs = await service.listByDate(date);

  return c.json({ date, logs }, 200);
}
