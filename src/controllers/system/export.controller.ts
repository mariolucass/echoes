import type { Context } from "hono";
import type { AppEnv } from "../../interfaces/hono.js";
import { ExportService } from "../../services/system/export.service.js";

const exportService = new ExportService();

export const exportDecisionsCsv = async (c: Context<AppEnv>) => {
  const csv = await exportService.decisionsCsv(c.get("user").id);

  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header(
    "Content-Disposition",
    `attachment; filename="${exportService.filename()}"`,
  );
  c.header("Cache-Control", "private, no-store");

  return c.body(csv);
};
