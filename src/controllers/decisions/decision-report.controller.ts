import type { RouteHandler } from "@hono/zod-openapi";
import type { AppEnv } from "../../interfaces/hono.js";
import { DecisionService } from "../../services/decisions/index.js";
import { DecisionReportService } from "../../services/decisions/index.js";
import type { downloadDecisionsPdfRoute } from "../../routes/decisions/index.js";

const decisionService = new DecisionService();
const reportService = new DecisionReportService();

export const downloadDecisionsPdf: RouteHandler<
  typeof downloadDecisionsPdfRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const query = c.req.valid("query");

  const { data } = await decisionService.getAllWithoutCount(user.id, query);
  const pdf = await reportService.createPdf(data);

  c.header("Content-Type", "application/pdf");
  c.header("Content-Disposition", 'attachment; filename="decisions.pdf"');

  return c.body(new Uint8Array(pdf));
};
