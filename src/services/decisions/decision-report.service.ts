import { exportPdf } from "../../export/pdf.export.js";

type ReportItem = { title: string; status: string };

export class DecisionReportService {
  createPdf(items: ReportItem[]): Promise<Buffer> {
    return exportPdf({
      title: "Lista de decisões",
      summary: `Total de itens: ${items.length}`,
      emptyMessage: "Nenhuma decisão encontrada.",
      entries: items.map((item, index) => ({
        title: `${index + 1}. ${item.title}`,
        details: [`Status: ${item.status}`],
      })),
    });
  }
}
