import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import { DecisionReportService } from "../../services/decisions/index.js";
import type {
  downloadDecisionsPdfRoute,
  downloadDecisionPdfRoute,
} from "../../routes/decisions/decision.routes.js";

const reportService = new DecisionReportService();

export const downloadDecisionsPdf: RouteHandler<
  typeof downloadDecisionsPdfRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const query = c.req.valid("query");

  const pdf = await reportService.downloadList(user.id, query);

  c.header("Content-Type", "application/pdf");
  c.header("Content-Disposition", `attachment; filename="${reportService.listFilename()}"`);
  c.header("Cache-Control", "private, no-store");

  return c.body(new Uint8Array(pdf));
};

export const downloadDecisionPdf: RouteHandler<
  typeof downloadDecisionPdfRoute,
  AppEnv
> = async (c) => {
  const { id } = c.req.valid("param");

  const { pdf, filename } = await reportService.downloadDetailWithName(c.get("user").id, id);

  c.header("Content-Type", "application/pdf");
  c.header("Content-Disposition", `attachment; filename="${filename}"`);
  c.header("Cache-Control", "private, no-store");

  return c.body(new Uint8Array(pdf));
};
