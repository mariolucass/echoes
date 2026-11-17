import { toCsv } from "../../export/csv.export.js";
import { ExportRepository } from "../../repositories/system/export.repository.js";

const HEADERS = [
  "id",
  "titulo",
  "descricao",
  "contexto",
  "status",
  "decidida_em",
  "criada_em",
  "atualizada_em",
];

export class ExportService {
  constructor(private readonly repository = new ExportRepository()) {}

  async decisionsCsv(userId: string) {
    const decisions = await this.repository.findUserDecisions(userId);
    return toCsv(
      HEADERS,
      decisions.map((d) => [
        d.id,
        d.title,
        d.description,
        d.context,
        d.status,
        d.decidedAt,
        d.createdAt,
        d.updatedAt,
      ]),
    );
  }

  filename(now = new Date()) {
    return `echoes-decisoes-${now.toISOString().slice(0, 10)}.csv`;
  }
}
