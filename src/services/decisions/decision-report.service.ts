import { env } from "../../config/env.js";
import { createHash } from "node:crypto";
import {
  exportPdf,
  type PdfDetail,
  type PdfList,
  type PdfExpectation,
  type AssessmentState,
} from "../../export/pdf.export.js";
import {
  analyzeDecision,
  compareTarget,
  latestAssessment,
  statusLabels,
} from "../../helpers/decisions/decision-report.helper.js";
import type { DecisionQuery } from "../../interfaces/decision/decision.interface.js";
import type { ReportDecision } from "../../projections/decisions/decision-report.projection.js";
import { DecisionReportRepository } from "../../repositories/decisions/decision-report.repository.js";

const number = (value: { toString(): string } | null | undefined) =>
  value == null ? null : Number(value.toString());
const format = (
  value: { toString(): string } | null | undefined,
  unit?: string | null,
) => {
  const n = number(value);
  if (n === null) return "";
  if (unit?.toUpperCase() === "BRL")
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(n);
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(n);
};
const shortId = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const array = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.map(object) : [];
const string = (value: unknown) =>
  typeof value === "string" ? value : undefined;
const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, item]) => [key, canonical(item)]),
        )
      : value;
const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

export class DecisionReportService {
  constructor(
    private readonly repository = new DecisionReportRepository(),
    private readonly timeZone = env.API_TIME_ZONE,
    private readonly clock = () => new Date(),
  ) {}

  private date(value: Date | null | undefined, time = false) {
    if (!value) return undefined;
    const parts = new Intl.DateTimeFormat("pt-BR", {
      timeZone: this.timeZone,
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(time
        ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const }
        : {}),
    }).formatToParts(value);
    const pick = (part: string) =>
      parts.find((p) => p.type === part)?.value ?? "";
    return `${pick("day")} ${pick("month").replace(".", "")} ${pick("year")}${time ? ` · ${pick("hour")}:${pick("minute")}` : ""}`;
  }
  private issued() {
    return this.date(this.clock(), true)!;
  }
  private pending(decision: ReportDecision, now: Date) {
    const analysis = analyzeDecision(decision, now);
    const notes: string[] = [];
    if (analysis.counts.pending)
      notes.push(
        `${analysis.counts.pending} ${analysis.counts.pending === 1 ? "expectativa sem avaliação" : "expectativas sem avaliação"}`,
      );
    if (analysis.overdue.length)
      notes.push(
        `${analysis.overdue.length} ${analysis.overdue.length === 1 ? "checkpoint vencido" : "checkpoints vencidos"}`,
      );
    if (analysis.pendingTargets.length)
      notes.push(
        `${analysis.pendingTargets.length} ${analysis.pendingTargets.length === 1 ? "meta vencida" : "metas vencidas"}`,
      );
    if (
      decision.status === "ACTIVE" &&
      decision.metrics.length &&
      !decision.metrics.some((m) => m.measurements.length)
    )
      notes.push("Sem medição registrada");
    return notes;
  }
  async downloadList(userId: string, query: DecisionQuery) {
    return this.createPdf(await this.repository.findPage(userId, query), query);
  }
  async downloadDetail(userId: string, id: string) {
    return this.createDecisionPdf(await this.repository.getDetail(userId, id));
  }
  async downloadDetailWithName(userId: string, id: string) {
    const decision = await this.repository.getDetail(userId, id);
    return {
      pdf: await this.createDecisionPdf(decision),
      filename: `echoes-decisao-${slug(decision.title) || "sem-titulo"}-${id.slice(0, 8).toLowerCase()}.pdf`,
    };
  }
  listFilename() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: this.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(this.clock());
    const pick = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "";
    return `echoes-panorama-${pick("year")}-${pick("month")}-${pick("day")}.pdf`;
  }
  createPdf(
    items: ReportDecision[],
    query: DecisionQuery = { page: 1, limit: 12 },
  ): Promise<Buffer> {
    return exportPdf(this.buildListReport(items, query), {
      footerText: "Panorama de decisões",
    });
  }
  createDecisionPdf(decision: ReportDecision): Promise<Buffer> {
    return exportPdf(this.buildDetailReport(decision), {
      footerText: "Decisão individual",
    });
  }
  buildListReport(items: ReportDecision[], query: DecisionQuery): PdfList {
    const now = this.clock();
    const statuses = Object.entries(statusLabels).map(([key, label]) => ({
      label,
      count: items.filter((item) => item.status === key).length,
    }));
    const filters = [
      query.status && `Estado ${statusLabels[query.status]}`,
      query.search && `Busca ${query.search}`,
      query.createdAtFrom &&
        `Criadas desde ${this.date(new Date(query.createdAtFrom))}`,
      query.createdAtTo &&
        `Criadas até ${this.date(new Date(query.createdAtTo))}`,
      query.decidedAtFrom &&
        `Escolhidas desde ${this.date(new Date(query.decidedAtFrom))}`,
      query.decidedAtTo &&
        `Escolhidas até ${this.date(new Date(query.decidedAtTo))}`,
    ].filter((value): value is string => Boolean(value));
    const sortLabels = {
      title: "título",
      description: "descrição",
      context: "contexto",
      status: "estado",
      decidedAt: "escolha",
      createdAt: "criação",
      updatedAt: "atualização",
    };
    const sort = sortLabels[query.sortBy ?? "createdAt"];
    const direction = query.order === "asc" ? "crescente" : "decrescente";
    const rows = items.map((item) => {
      const choice = item.alternatives.find(
        (a) => a.id === item.chosenAlternativeId,
      );
      const expectations = item.expectations.map((e) => {
        const assessment = latestAssessment(e, now);
        const outcome = item.outcomes.find(
          (o) => o.id === assessment?.outcomeId,
        );
        return {
          state: assessment?.result ?? "PENDING",
          expected: number(e.expectedImpact),
          observed: number(outcome?.impact),
        };
      });
      const impactPair =
        expectations.find((e) => e.expected !== null && e.observed !== null) ??
        expectations.find((e) => e.expected !== null || e.observed !== null);
      return {
        title: item.title,
        choice: choice?.title,
        status: statusLabels[item.status],
        date: this.date(item.decidedAt ?? item.createdAt),
        shortId: shortId(item.id),
        states: expectations.map((e) => e.state) as AssessmentState[],
        expected: impactPair?.expected ?? null,
        observed: impactPair?.observed ?? null,
        url: env.APP_BASE_URL
          ? `${env.APP_BASE_URL.replace(/\/$/, "")}/decisions/${item.id}`
          : undefined,
      };
    });
    return {
      kind: "list",
      title: "Panorama de decisões",
      issued: this.date(now, true)!,
      scope: `Página ${query.page} · ${items.length} ${items.length === 1 ? "decisão" : "decisões"} · ${query.sortBy === undefined && query.order !== "asc" ? "mais recentes primeiro" : `${sort}, ${direction}`}`,
      filters,
      statuses,
      met: items.reduce(
        (sum, item) => sum + analyzeDecision(item, now).counts.MET,
        0,
      ),
      total: items.reduce((sum, item) => sum + item.expectations.length, 0),
      rows,
      pending: items.flatMap((item) =>
        this.pending(item, now).map((note) => `${item.title}: ${note}`),
      ),
    };
  }
  buildDetailReport(decision: ReportDecision): PdfDetail {
    const now = this.clock();
    const analysis = analyzeDecision(decision, now);
    const chosen = decision.alternatives.find(
      (a) => a.id === decision.chosenAlternativeId,
    );
    const shownOutcomes = new Set<string>();
    const expectations: PdfExpectation[] = decision.expectations.map(
      (expectation) => {
        const assessment = latestAssessment(expectation, now);
        const outcome = decision.outcomes.find(
          (o) => o.id === assessment?.outcomeId,
        );
        const includeOutcome = Boolean(
          outcome && !shownOutcomes.has(outcome.id),
        );
        if (outcome) shownOutcomes.add(outcome.id);
        return {
          description: expectation.description,
          expected: number(expectation.expectedImpact),
          observed: number(outcome?.impact),
          state: assessment?.result ?? "PENDING",
          goals: expectation.targets.map((target) => {
            const comparison = compareTarget(decision, target, now);
            return {
              label: comparison.metric?.name ?? "Meta",
              baseline: number(target.baselineValue),
              target: number(target.targetValue) ?? 0,
              measured: number(comparison.measurement?.value),
              unit: comparison.metric?.unit ?? "",
              operator: target.operator,
              date: this.date(target.evaluateAt),
            };
          }),
          outcomes:
            outcome && includeOutcome
              ? [
                  {
                    description: outcome.description,
                    date: this.date(outcome.occurredAt ?? outcome.createdAt),
                    impact: number(outcome.impact),
                  },
                ]
              : [],
        };
      },
    );
    const latestReflection = decision.reflections.at(-1);
    const latestOutcome = decision.outcomes.at(-1);
    const impactPair =
      expectations.find((e) => e.expected !== null && e.observed !== null) ??
      expectations.find((e) => e.expected !== null || e.observed !== null);
    const revision = decision.revisions[0];
    const snapshot = object(revision?.snapshot);
    const originalChoice = array(snapshot.alternatives).find(
      (a) => a.id === snapshot.chosenAlternativeId,
    );
    const receipt =
      revision && snapshot.schemaVersion === 1
        ? {
            version: revision.version,
            date: this.date(revision.createdAt, true)!,
            fields: [
              {
                label: "Escolha original",
                value: string(originalChoice?.title) ?? "",
              },
              {
                label: "Justificativa original",
                value: string(snapshot.rationale) ?? "",
              },
              {
                label: "Contexto original",
                value: string(snapshot.context) ?? "",
              },
              ...array(snapshot.expectations).map((e, i) => ({
                label: `Expectativa original ${i + 1}`,
                value: [
                  string(e.description),
                  e.expectedImpact == null
                    ? undefined
                    : `impacto esperado ${format({ toString: () => String(e.expectedImpact) })}`,
                ]
                  .filter(Boolean)
                  .join(" · "),
              })),
            ].filter((f) => f.value),
            checksum: (
              string(snapshot.checksum) ??
              createHash("sha256")
                .update(JSON.stringify(canonical(snapshot)))
                .digest("hex")
            )
              .slice(0, 8)
              .toUpperCase(),
          }
        : undefined;
    return {
      kind: "detail",
      title: decision.title,
      shortId: shortId(decision.id),
      status: statusLabels[decision.status],
      issued: this.date(now, true)!,
      choice: chosen?.title,
      chosenAt: this.date(decision.decidedAt, true),
      context: decision.context ?? undefined,
      rationale: decision.rationale ?? undefined,
      description: decision.description ?? undefined,
      alternatives: decision.alternatives.map((a) => ({
        title: a.title,
        pros: a.pros ?? undefined,
        cons: a.cons ?? undefined,
        chosen: a.id === decision.chosenAlternativeId,
      })),
      stats: {
        met: analysis.counts.MET,
        total: decision.expectations.length,
        expected: impactPair?.expected ?? null,
        observed: impactPair?.observed ?? number(latestOutcome?.impact),
        satisfaction: latestReflection?.satisfactionScore ?? null,
        regret: latestReflection?.regretScore ?? null,
      },
      expectations,
      additionalOutcomes: decision.outcomes
        .filter((o) => !shownOutcomes.has(o.id))
        .map((o) => ({
          description: o.description,
          date: this.date(o.occurredAt ?? o.createdAt),
          impact: number(o.impact),
        })),
      metrics: decision.metrics.map((m) => ({
        name: m.name,
        unit: m.unit ?? "",
        values: m.measurements.map((v) => number(v.value) ?? 0),
        latest: format(m.measurements[0]?.value, m.unit),
        date: this.date(m.measurements[0]?.recordedAt),
      })),
      checkpoints: decision.checkpoints.map((c) => ({
        date: this.date(c.scheduledFor)!,
        completed: Boolean(c.completedAt),
        score: c.score,
        notes: c.notes ?? undefined,
      })),
      reflections: decision.reflections.map((r) => ({
        content: r.content,
        satisfaction: r.satisfactionScore,
        regret: r.regretScore,
      })),
      receipt,
      pending: this.pending(decision, now),
    };
  }
}
