import PDFDocument from "pdfkit";
import { fileURLToPath } from "node:url";
import { reportTokens as T } from "./report-tokens.js";

export type AssessmentState =
  | "MET"
  | "PARTIALLY_MET"
  | "NOT_MET"
  | "INCONCLUSIVE"
  | "PENDING";
export interface PdfEntry {
  title: string;
  details?: string[];
}
export interface PdfGoal {
  label: string;
  baseline: number | null;
  target: number;
  measured: number | null;
  unit: string;
  operator: "GTE" | "LTE" | "EQ";
  date?: string;
}
export interface PdfExpectation {
  description: string;
  expected: number | null;
  observed: number | null;
  state: AssessmentState;
  goals: PdfGoal[];
  outcomes: { description: string; date?: string; impact: number | null }[];
}
export interface PdfMetric {
  name: string;
  unit: string;
  values: number[];
  latest?: string;
  date?: string;
}
export interface PdfCheckpoint {
  date: string;
  completed: boolean;
  score: number | null;
  notes?: string;
}
export interface PdfReceipt {
  version: number;
  date: string;
  fields: { label: string; value: string }[];
  checksum?: string;
}
export interface PdfDetail {
  kind: "detail";
  title: string;
  shortId: string;
  status: string;
  issued: string;
  choice?: string;
  chosenAt?: string;
  context?: string;
  rationale?: string;
  description?: string;
  alternatives: {
    title: string;
    pros?: string;
    cons?: string;
    chosen: boolean;
  }[];
  stats: {
    met: number;
    total: number;
    expected: number | null;
    observed: number | null;
    satisfaction: number | null;
    regret: number | null;
  };
  expectations: PdfExpectation[];
  additionalOutcomes: {
    description: string;
    date?: string;
    impact: number | null;
  }[];
  metrics: PdfMetric[];
  checkpoints: PdfCheckpoint[];
  reflections: {
    content: string;
    satisfaction: number | null;
    regret: number | null;
  }[];
  receipt?: PdfReceipt;
  pending: string[];
}
export interface PdfListRow {
  title: string;
  choice?: string;
  status: string;
  date?: string;
  states: AssessmentState[];
  expected: number | null;
  observed: number | null;
  shortId: string;
  url?: string;
}
export interface PdfList {
  kind: "list";
  title: string;
  issued: string;
  scope: string;
  filters: string[];
  statuses: { label: string; count: number }[];
  met: number;
  total: number;
  rows: PdfListRow[];
  pending: string[];
}
export interface PdfLegacy {
  title: string;
  summary?: string;
  emptyMessage?: string;
  entries: PdfEntry[];
}
export type PdfReport = PdfDetail | PdfList | PdfLegacy;
export interface PdfExportOptions {
  page?: PDFKit.PDFDocumentOptions;
  footerText?: string;
}

const fontPath = (path: string) =>
  fileURLToPath(new URL(`../../fonts/${path}`, import.meta.url));
function fonts(doc: PDFKit.PDFDocument) {
  doc.registerFont(
    "Display",
    fontPath("Fraunces/static/Fraunces_72pt-SemiBold.ttf"),
  );
  doc.registerFont(
    "Reading",
    fontPath("Newsreader/static/Newsreader_14pt-Regular.ttf"),
  );
  doc.registerFont(
    "ReadingItalic",
    fontPath("Newsreader/static/Newsreader_14pt-Italic.ttf"),
  );
  doc.registerFont("Label", fontPath("Jost/static/Jost-Regular.ttf"));
  doc.registerFont("LabelMedium", fontPath("Jost/static/Jost-Medium.ttf"));
}
// PDFKit accepts the minus prefix to disable a feature; its type definition
// only enumerates enabled feature names.
const opts = {
  features: ["-liga"] as unknown as PDFKit.Mixins.OpenTypeFeatures[],
};
const assessmentNames: Record<AssessmentState, string> = {
  MET: "Atendida",
  PARTIALLY_MET: "Parcial",
  NOT_MET: "Não atendida",
  INCONCLUSIVE: "Inconclusiva",
  PENDING: "Sem avaliação",
};
const W = 595.28,
  H = 841.89,
  X = T.marginX,
  CW = W - 2 * X;
function line(
  d: PDFKit.PDFDocument,
  y: number,
  x: number = X,
  width: number = CW,
) {
  d.moveTo(x, y)
    .lineTo(x + width, y)
    .lineWidth(0.6)
    .strokeColor(T.rule)
    .stroke();
}
function seal(d: PDFKit.PDFDocument) {
  const gradient = d
    .linearGradient(X, 35, X + 78, 35)
    .stop(0, T.accentFrom)
    .stop(1, T.accentTo);
  d.rect(X, 35, 78, 3).fill(gradient);
}
function label(
  d: PDFKit.PDFDocument,
  value: string,
  x: number,
  y: number,
  width = CW,
) {
  d.font("LabelMedium")
    .fontSize(7.5)
    .fillColor(T.muted)
    .text(value.toUpperCase(), x, y, {
      width,
      characterSpacing: 0.6,
      lineBreak: false,
      ...opts,
    });
}
function copy(
  d: PDFKit.PDFDocument,
  value: string,
  x: number,
  y: number,
  width: number,
  size = 10.5,
  italic = false,
  maxHeight?: number,
) {
  d.font(italic ? "ReadingItalic" : "Reading")
    .fontSize(size)
    .fillColor(T.body);
  const h = d.heightOfString(value, { width, lineGap: size * 0.35, ...opts });
  d.text(value, x, y, {
    width,
    lineGap: size * 0.35,
    height: maxHeight,
    ellipsis: Boolean(maxHeight),
    ...opts,
  });
  return Math.min(h, maxHeight ?? h);
}
function section(d: PDFKit.PDFDocument, value: string, y: number) {
  label(d, value, X, y);
  line(d, y + 15);
  return y + 26;
}
function short(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}
function sign(value: number | null) {
  return value === null
    ? "—"
    : `${value > 0 ? "+" : value < 0 ? "−" : ""}${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(Math.abs(value))}`;
}
function glyph(
  d: PDFKit.PDFDocument,
  state: AssessmentState,
  x: number,
  y: number,
) {
  d.save()
    .lineWidth(1)
    .strokeColor(state === "MET" ? T.accent : T.muted)
    .fillColor(T.accent);
  if (state === "MET") d.circle(x + 4, y + 4, 3.2).fill();
  else if (state === "PARTIALLY_MET") {
    d.circle(x + 4, y + 4, 3.2).stroke();
    d.moveTo(x + 4, y + 1)
      .lineTo(x + 4, y + 7)
      .stroke();
  } else if (state === "NOT_MET") d.circle(x + 4, y + 4, 3.2).stroke();
  else if (state === "INCONCLUSIVE")
    d.moveTo(x, y + 4)
      .lineTo(x + 8, y + 4)
      .stroke();
  else {
    d.circle(x + 2, y + 4, 0.7).fill();
    d.circle(x + 6, y + 4, 0.7).fill();
  }
  d.restore();
}
function dumbbell(
  d: PDFKit.PDFDocument,
  expected: number | null,
  observed: number | null,
  x: number,
  y: number,
  width: number,
  compact = false,
) {
  const px = (n: number) => x + Math.max(0, Math.min(1, (n + 10) / 20)) * width;
  d.moveTo(x, y)
    .lineTo(x + width, y)
    .lineWidth(0.8)
    .strokeColor(T.rule)
    .stroke();
  d.moveTo(px(0), y - 3)
    .lineTo(px(0), y + 3)
    .strokeColor(T.muted)
    .stroke();
  if (expected !== null && observed !== null)
    d.moveTo(px(expected), y)
      .lineTo(px(observed), y)
      .lineWidth(2)
      .strokeColor(T.accent)
      .stroke();
  if (expected !== null)
    d.circle(px(expected), y, compact ? 2.5 : 4)
      .fillColor(T.paper)
      .strokeColor(T.accent)
      .lineWidth(1.2)
      .fillAndStroke();
  if (observed !== null)
    d.circle(px(observed), y, compact ? 2.5 : 4)
      .fillColor(T.accent)
      .fill();
  if (!compact) {
    label(d, "−10", x, y + 9, 30);
    label(d, "+10", x + width - 25, y + 9, 30);
  }
}
function goalTrack(
  d: PDFKit.PDFDocument,
  goal: PdfGoal,
  y: number,
  dense = false,
) {
  label(
    d,
    `${goal.label}${goal.date ? ` · PRAZO ${goal.date}` : ""}`,
    X,
    y,
    290,
  );
  const n = (v: number | null) =>
    v === null
      ? "—"
      : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(v);
  const unit = goal.unit.toUpperCase() === "BRL" ? "R$ " : "";
  const range = [
    goal.baseline ?? goal.target,
    goal.target,
    goal.measured ?? goal.target,
  ];
  const lo = Math.min(...range),
    hi = Math.max(...range),
    span = Math.max(hi - lo, 1);
  const px = (v: number) => X + 18 + ((v - lo) / span) * (CW - 36);
  const axisY = y + (dense ? 21 : 29);
  d.moveTo(X + 18, axisY)
    .lineTo(X + CW - 18, axisY)
    .lineWidth(1)
    .strokeColor(T.rule)
    .stroke();
  if (goal.baseline !== null)
    d.circle(px(goal.baseline), axisY, 2).fillColor(T.muted).fill();
  d.moveTo(px(goal.target), axisY - 6)
    .lineTo(px(goal.target), axisY + 6)
    .lineWidth(1.5)
    .strokeColor(T.ink)
    .stroke();
  if (goal.measured !== null)
    d.circle(px(goal.measured), axisY, 3.5).fillColor(T.accent).fill();
  d.font("Label")
    .fontSize(8)
    .fillColor(T.body)
    .text(
      `${unit}${n(goal.baseline)}  →  ${goal.operator === "GTE" ? "≥ " : goal.operator === "LTE" ? "≤ " : "= "}${unit}${n(goal.target)}  →  ${unit}${n(goal.measured)}${goal.unit && !unit ? ` ${goal.unit}` : ""}`,
      X,
      y + (dense ? 30 : 40),
      { width: CW, ...opts },
    );
  if (goal.measured !== null && goal.target !== 0) {
    const pct = Math.abs(((goal.measured - goal.target) / goal.target) * 100);
    const meets =
      goal.operator === "GTE"
        ? goal.measured >= goal.target
        : goal.operator === "LTE"
          ? goal.measured <= goal.target
          : goal.measured === goal.target;
    const relation =
      goal.operator === "EQ"
        ? meets
          ? "na meta"
          : "de distância da meta"
        : goal.measured < goal.target
          ? "abaixo da meta"
          : "acima da meta";
    d.font("LabelMedium")
      .fontSize(8)
      .fillColor(meets ? T.accent : T.body)
      .text(
        `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(pct)}% ${relation}`,
        X + 320,
        y + (dense ? 30 : 40),
        { width: CW - 320, align: "right", ...opts },
      );
  }
  return y + (dense ? 47 : 62);
}
function marks(
  d: PDFKit.PDFDocument,
  score: number | null,
  x: number,
  y: number,
) {
  if (score === null) return;
  for (let i = 0; i < 10; i++)
    d.rect(x + i * 9, y, 6, 3)
      .fillColor(i < score ? T.accent : T.rule)
      .fill();
}
function outcomeLine(
  d: PDFKit.PDFDocument,
  outcome: { description: string; date?: string; impact: number | null },
  y: number,
  dense = false,
) {
  label(d, "RESULTADO OBSERVADO", X, y);
  const bodyY = y + (dense ? 12 : 16);
  const height = copy(
    d,
    outcome.description,
    X,
    bodyY,
    300,
    dense ? 8.5 : 9.5,
    false,
    dense ? 24 : 32,
  );
  if (outcome.date)
    d.font("Label")
      .fontSize(7.5)
      .fillColor(T.muted)
      .text(outcome.date, X + 307, bodyY + 2, {
        width: 110,
        align: "right",
        lineBreak: false,
        ...opts,
      });
  if (outcome.impact !== null) {
    const value = sign(outcome.impact);
    d.font("LabelMedium").fontSize(8);
    const width = Math.max(30, d.widthOfString(value) + 14);
    const chipX = X + CW - width;
    d.roundedRect(chipX, bodyY - 2, width, 17, 8.5)
      .lineWidth(0.6)
      .strokeColor(T.rule)
      .stroke();
    d.fillColor(T.accent).text(value, chipX + 7, bodyY + 2, {
      width: width - 14,
      lineBreak: false,
      ...opts,
    });
  }
  return bodyY + Math.max(height, 17) + (dense ? 9 : 14);
}
function renderList(d: PDFKit.PDFDocument, r: PdfList, offset = 0) {
  if (!offset) seal(d);
  label(d, "ECHOES · RELATÓRIO DE DECISÕES", X, 45);
  line(d, 60);
  d.font("Display")
    .fontSize(36)
    .fillColor(T.ink)
    .text(r.title, X, 73, { width: CW, ...opts });
  label(d, r.scope, X, 131);
  if (r.filters.length) label(d, short(r.filters.join(" · "), 105), X, 144);
  let y = section(d, "Distribuição por estado", 162);
  const total = r.statuses.reduce((n, s) => n + s.count, 0);
  let sx = X;
  const activeStatuses = r.statuses.filter((s) => s.count);
  const segmentColors = [T.accent, "#2A2C33", "#59606E", "#9399A5", "#C5C9D1"];
  activeStatuses.forEach((s, i) => {
    const w = (s.count / total) * CW;
    d.rect(sx, y, w, 11).fillColor(segmentColors[i]!).fill();
    sx += w;
  });
  if (!total) line(d, y + 5);
  let legendX = X,
    legendY = y + 20;
  for (const [index, value] of activeStatuses
    .map((s) => `${s.label} ${s.count}`)
    .entries()) {
    d.font("LabelMedium").fontSize(7.5);
    const width = d.widthOfString(value.toUpperCase()) + 25;
    if (legendX + width > X + CW) {
      legendX = X;
      legendY += 13;
    }
    d.rect(legendX, legendY + 3, 7, 7)
      .fillColor(segmentColors[index]!)
      .fill();
    label(d, value, legendX + 12, legendY, width - 12);
    legendX += width;
  }
  if (!total) label(d, "Nenhuma decisão", X, y + 20);
  y += 47;
  if (r.total) {
    d.font("Display")
      .fontSize(32)
      .fillColor(T.ink)
      .text(`${r.met}/${r.total}`, X, y, { width: 130, ...opts });
    label(d, "EXPECTATIVAS ATENDIDAS", X + 133, y + 18);
  } else
    copy(d, "Ainda não há expectativas neste recorte.", X, y + 9, CW, 10.5);
  y = section(d, "Decisões neste recorte", y + 59);
  const widths = [22, 147, 99, 65, 38, 43, 69];
  let hx = X;
  ["#", "DECISÃO", "ESTADO", "DATA", "EXP.", "IMPACTO", "ID"].forEach(
    (h, i) => {
      label(d, h, hx, y, widths[i]);
      hx += widths[i]!;
    },
  );
  y += 18;
  line(d, y);
  const rowH = Math.min(46, (H - 145 - y) / Math.max(r.rows.length, 1));
  r.rows.forEach((row, i) => {
    const ry = y + i * rowH + 5;
    d.font("Label")
      .fontSize(8)
      .fillColor(T.muted)
      .text(`${offset + i + 1}`, X, ry + 6, { width: 20, ...opts });
    copy(d, short(row.title, 34), X + 22, ry, 143, 11, false, 18);
    if (row.choice)
      d.font("Label")
        .fontSize(7.4)
        .fillColor(T.muted)
        .text(short(row.choice, 31), X + 22, ry + 19, { width: 143, ...opts });
    d.roundedRect(X + 169, ry + 6, 91, 17, 8)
      .lineWidth(0.6)
      .strokeColor(T.rule)
      .stroke();
    d.circle(X + 177, ry + 14, 2)
      .fillColor(T.accent)
      .fill();
    d.font("LabelMedium")
      .fontSize(7.2)
      .fillColor(T.ink)
      .text(row.status, X + 183, ry + 10, {
        width: 69,
        lineBreak: false,
        ...opts,
      });
    d.font("Label")
      .fontSize(7.5)
      .fillColor(T.body)
      .text(row.date ?? "—", X + 268, ry + 9, { width: 61, ...opts });
    row.states
      .slice(0, 4)
      .forEach((s, j) => glyph(d, s, X + 333 + j * 9, ry + 10));
    dumbbell(d, row.expected, row.observed, X + 371, ry + 14, 37, true);
    d.font("Courier")
      .fontSize(7)
      .fillColor(T.accent)
      .text(row.shortId, X + 414, ry + 9, {
        width: 69,
        link: row.url,
        underline: Boolean(row.url),
        ...opts,
      });
    line(d, y + (i + 1) * rowH);
  });
  y += r.rows.length * rowH + 19;
  if (!r.rows.length) {
    copy(
      d,
      "Nenhuma decisão encontrada. Ajuste os filtros ou a página da consulta.",
      X,
      y,
      CW,
    );
    y += 36;
  }
  if (y < H - 112) {
    y = section(d, "Onde concentrar a próxima revisão", y);
    copy(
      d,
      r.pending.length
        ? r.pending.slice(0, 2).join("  ·  ")
        : "Nada pendente. Toda expectativa tem avaliação.",
      X,
      y,
      CW,
      9.5,
      false,
      H - 107 - y,
    );
  }
  d.font("Label")
    .fontSize(7)
    .fillColor(T.muted)
    .text(
      "Sem avaliação não significa fracasso; concluída não significa sucesso. Indicadores apenas desta página.",
      X,
      H - 81,
      { width: CW, ...opts },
    );
}
function renderDetail(d: PDFKit.PDFDocument, r: PdfDetail) {
  seal(d);
  label(d, `REGISTRO DE DECISÃO · ${r.shortId}`, X, 46);
  line(d, 61);
  d.font("Display")
    .fontSize(r.title.length > 55 ? 30 : 40)
    .fillColor(T.ink)
    .text(r.title, X, 72, { width: CW, height: 100, ellipsis: true, ...opts });
  let y = Math.max(132, d.y + 4);
  if (r.choice) y += copy(d, r.choice, X, y, CW, 16) + 7;
  if (r.chosenAt) {
    label(d, `ESCOLHIDA EM ${r.chosenAt}`, X, y);
    y += 25;
  }
  label(d, `EMITIDO EM ${r.issued}`, X, y);
  d.font("LabelMedium").fontSize(7.2);
  const pillWidth = d.widthOfString(r.status) + 24;
  const pillX = X + CW - pillWidth;
  d.roundedRect(pillX, y - 4, pillWidth, 18, 9)
    .lineWidth(0.6)
    .strokeColor(T.rule)
    .stroke();
  d.circle(pillX + 9, y + 5, 2.2)
    .fillColor(T.accent)
    .fill();
  d.fillColor(T.ink).text(r.status, pillX + 16, y, {
    width: pillWidth - 20,
    lineBreak: false,
    ...opts,
  });
  y += 23;
  const stats: [string, string][] = [];
  if (r.stats.total)
    stats.push(["EXPECTATIVAS ATENDIDAS", `${r.stats.met}/${r.stats.total}`]);
  if (r.stats.expected !== null || r.stats.observed !== null)
    stats.push([
      "IMPACTO PREVISTO → REAL",
      `${sign(r.stats.expected)} → ${sign(r.stats.observed)}`,
    ]);
  if (r.stats.satisfaction !== null)
    stats.push(["SATISFAÇÃO", `${r.stats.satisfaction}/10`]);
  if (r.stats.regret !== null)
    stats.push(["ARREPENDIMENTO", `${r.stats.regret}/10`]);
  if (stats.length) {
    line(d, y);
    y += 17;
    const statWidth = CW / stats.length;
    stats.forEach(([name, value], i) => {
      const xx = X + i * statWidth;
      if (i)
        d.moveTo(xx - 8, y)
          .lineTo(xx - 8, y + 51)
          .strokeColor(T.rule)
          .stroke();
      label(d, name, xx, y, statWidth - 10);
      d.font(name.startsWith("IMPACTO") ? "LabelMedium" : "Display")
        .fontSize(name.startsWith("IMPACTO") ? 15 : 26)
        .fillColor(T.ink)
        .text(value, xx, y + 15, { width: statWidth - 11, ...opts });
    });
    y += 76;
  } else y += 15;
  for (const [name, value] of [
    ["Descrição", r.description],
    ["Contexto", r.context],
    ["Por que esta escolha", r.rationale],
  ] as const) {
    if (!value || y > 520) continue;
    y = section(d, name, y);
    y +=
      copy(
        d,
        value,
        X,
        y,
        Math.min(CW, 385),
        10.5,
        false,
        Math.max(45, 510 - y),
      ) + 24;
  }
  if (
    (r.alternatives.length > 1 ||
      (r.alternatives.length === 1 && !r.alternatives[0]!.chosen)) &&
    y < 620
  ) {
    y = section(d, "Alternativas consideradas", y);
    label(d, "ALTERNATIVA", X, y, 165);
    label(d, "VANTAGENS", X + 166, y, 158);
    label(d, "DESVANTAGENS", X + 326, y, 156);
    y += 16;
    r.alternatives.slice(0, 5).forEach((a) => {
      line(d, y);
      copy(d, a.title, X, y + 7, 156, 9, false, 27);
      if (a.pros) copy(d, a.pros, X + 166, y + 7, 150, 9, false, 27);
      if (a.cons) copy(d, a.cons, X + 326, y + 7, 152, 9, false, 27);
      y += 40;
    });
  }
  if (r.pending.length && y < H - 110) {
    y = section(d, "Próxima revisão", y + 8);
    copy(d, r.pending.slice(0, 2).join(" "), X, y, CW, 9.5, false, H - 108 - y);
  }
  const evidencePage = () => {
    d.addPage();
    y = 64;
    label(d, "EVIDÊNCIAS E APRENDIZADOS", X, y);
    line(d, y + 15);
    y += 29;
  };
  evidencePage();
  const dense = r.expectations.length >= 3;
  for (const expectation of r.expectations) {
    if (y > (dense ? 570 : 536)) evidencePage();
    glyph(d, expectation.state, X, y + 3);
    label(d, assessmentNames[expectation.state], X + CW - 100, y + 2, 100);
    y +=
      copy(
        d,
        expectation.description,
        X + 16,
        y,
        CW - 100,
        dense ? 10.5 : 12.5,
        false,
        dense ? 28 : 42,
      ) + (dense ? 4 : 10);
    label(
      d,
      `ESPERADO ${sign(expectation.expected)} · OBSERVADO ${sign(expectation.observed)}`,
      X + 16,
      y,
    );
    dumbbell(
      d,
      expectation.expected,
      expectation.observed,
      X + 18,
      y + (dense ? 19 : 28),
      CW - 36,
    );
    y += dense ? 35 : 58;
    for (const goal of expectation.goals) {
      if (y > 620) evidencePage();
      y = goalTrack(d, goal, y, dense);
    }
    expectation.outcomes.forEach((o) => {
      if (y > 650) evidencePage();
      y = outcomeLine(d, o, y, dense);
    });
    line(d, y);
    y += dense ? 9 : 17;
  }
  if (!r.expectations.length) {
    copy(d, "Ainda não há expectativas registradas.", X, y, CW);
    y += 36;
  }
  if (r.additionalOutcomes.length) {
    if (y > 620) evidencePage();
    y = section(d, "Outros resultados observados", y);
    for (const outcome of r.additionalOutcomes) {
      if (y > 690) evidencePage();
      y = outcomeLine(d, outcome, y);
    }
  }
  const chartMetrics = r.metrics.filter((m) => m.values.length >= 3);
  if (chartMetrics.length) {
    if (y > 625) evidencePage();
    y = section(d, "Métricas e acompanhamento", y);
    for (const metric of chartMetrics) {
      if (y > 680) evidencePage();
      label(d, metric.name, X, y, 230);
      const values = [...metric.values].reverse();
      const lo = Math.min(...values),
        span = Math.max(Math.max(...values) - lo, 1);
      values.forEach((value, i) => {
        const xx = X + 290 + (i / (values.length - 1)) * 185;
        const yy = y + 13 - ((value - lo) / span) * 13;
        if (i) d.lineTo(xx, yy);
        else d.moveTo(xx, yy);
      });
      d.lineWidth(1.4).strokeColor(T.accent).stroke();
      y += 28;
    }
  }
  if (r.checkpoints.length) {
    if (y > 625) evidencePage();
    y = section(d, "Checkpoints", y);
    for (const checkpoint of r.checkpoints) {
      if (y > 680) evidencePage();
      label(d, checkpoint.completed ? "CONCLUÍDO" : "PENDENTE", X, y, 120);
      const detail = [
        checkpoint.date,
        checkpoint.score === null ? undefined : `${checkpoint.score}/10`,
        checkpoint.notes,
      ]
        .filter(Boolean)
        .join(" · ");
      copy(d, detail, X + 120, y - 2, CW - 120, 9, false, 21);
      y += 27;
    }
  }
  const reflection = r.reflections.at(-1);
  if (reflection) {
    if (y > 650) evidencePage();
    y = section(d, "Reflexão", y);
    y +=
      copy(d, reflection.content, X, y, CW, 14, true, Math.max(31, 663 - y)) +
      8;
    label(d, "SATISFAÇÃO", X, y, 100);
    marks(d, reflection.satisfaction, X + 108, y + 4);
    if (reflection.satisfaction !== null)
      label(d, `${reflection.satisfaction}/10`, X + 202, y, 42);
    label(d, "ARREPENDIMENTO", X + 260, y, 110);
    marks(d, reflection.regret, X + 373, y + 4);
    if (reflection.regret !== null)
      label(d, `${reflection.regret}/10`, X + 464, y, 20);
    y += 25;
  }
  if (r.receipt) {
    let fieldIndex = 0;
    do {
      if (y > 610) evidencePage();
      y = section(
        d,
        fieldIndex ? "Registro original · continuação" : "Registro original",
        y,
      );
      const availableRows = Math.floor((H - 130 - y - 46) / 19);
      if (availableRows < 1) {
        evidencePage();
        continue;
      }
      const fields = r.receipt.fields.slice(
        fieldIndex,
        fieldIndex + availableRows,
      );
      const frameHeight = 45 + fields.length * 19;
      d.rect(X, y, CW, frameHeight)
        .lineWidth(0.65)
        .strokeColor(T.rule)
        .stroke();
      d.roundedRect(X + 12, y + 10, 51, 16, 8)
        .lineWidth(0.7)
        .strokeColor(T.accent)
        .stroke();
      d.font("LabelMedium")
        .fontSize(7)
        .fillColor(T.accent)
        .text("SELADO", X + 21, y + 14, {
          width: 38,
          lineBreak: false,
          ...opts,
        });
      label(
        d,
        `REGISTRO V${r.receipt.version} · ${r.receipt.date}`,
        X + 73,
        y + 13,
        280,
      );
      if (r.receipt.checksum)
        d.font("Courier")
          .fontSize(8)
          .fillColor(T.muted)
          .text(`SHA-256 ${r.receipt.checksum}`, X + CW - 116, y + 13, {
            width: 104,
            align: "right",
            lineBreak: false,
            ...opts,
          });
      line(d, y + 34, X + 12, CW - 24);
      fields.forEach((field, index) => {
        const rowY = y + 42 + index * 19;
        label(d, field.label, X + 12, rowY, 123);
        copy(d, field.value, X + 143, rowY - 2, CW - 155, 9, false, 16);
      });
      fieldIndex += fields.length;
      y += frameHeight + 12;
      if (fieldIndex < r.receipt.fields.length) evidencePage();
    } while (fieldIndex < r.receipt.fields.length);
  }
  line(d, H - 115);
  d.font("Label")
    .fontSize(7)
    .fillColor(T.muted)
    .text(
      "SÍNTESE POR EXPECTATIVA · A avaliação mais recente até a emissão é do usuário; a meta numérica não a substitui. Impactos na escala −10 a +10 não são somados nem provam causalidade.",
      X,
      H - 107,
      { width: 225, ...opts },
    );
  d.font("Label")
    .fontSize(7)
    .fillColor(T.muted)
    .text(
      "METODOLOGIA · Metas com prazo usam a última medição até o prazo; sem prazo, até a emissão. Ausência de evidência, avaliação inconclusiva e resultado negativo são situações diferentes.",
      X + 248,
      H - 107,
      { width: 235, ...opts },
    );
}
function renderLegacy(d: PDFKit.PDFDocument, r: PdfLegacy) {
  label(d, "ECHOES · RELATÓRIO", X, 46);
  line(d, 61);
  d.font("Display")
    .fontSize(34)
    .fillColor(T.ink)
    .text(r.title, X, 74, { width: CW, ...opts });
  let y = d.y + 24;
  if (r.summary) y += copy(d, r.summary, X, y, CW) + 24;
  if (!r.entries.length && r.emptyMessage) copy(d, r.emptyMessage, X, y, CW);
  for (const entry of r.entries)
    for (const [i, value] of [
      entry.title,
      ...(entry.details ?? []),
    ].entries()) {
      d.font(i ? "Reading" : "LabelMedium").fontSize(i ? 10.5 : 8);
      const h = d.heightOfString(value, { width: CW, ...opts }) + 16;
      if (y + Math.min(h, 70) > H - 90) {
        d.addPage();
        y = 65;
      }
      y += copy(d, value, X, y, CW, i ? 10.5 : 8) + 16;
    }
}
function footer(d: PDFKit.PDFDocument, title: string, issued?: string) {
  const range = d.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    d.switchToPage(range.start + i);
    const bottom = d.page.margins.bottom;
    d.page.margins.bottom = 0;
    if (i > 0) label(d, `ECHOES · ${title}`, X, 33);
    line(d, H - 53);
    label(d, "ECHOES", X, H - 44, 70);
    if (issued)
      d.font("Label")
        .fontSize(7)
        .fillColor(T.muted)
        .text(`Emitido em ${issued}`, X + 90, H - 44, { width: 320, ...opts });
    d.font("Label")
      .fontSize(7)
      .fillColor(T.muted)
      .text(`${i + 1} / ${range.count}`, X, H - 44, {
        width: CW,
        align: "right",
        ...opts,
      });
    d.page.margins.bottom = bottom;
  }
}
export function exportPdf(
  report: PdfReport,
  options: PdfExportOptions = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const d = new PDFDocument({
      size: "A4",
      margins: { top: T.marginTop, left: X, right: X, bottom: T.marginBottom },
      bufferPages: true,
      tagged: true,
      lang: "pt-BR",
      displayTitle: true,
      ...options.page,
      info: {
        Title: report.title,
        Author: "Echoes",
        Subject: "Decisões e aprendizados",
        Keywords: "Echoes, decisões, evidências",
        CreationDate: new Date(),
        ...options.page?.info,
      },
    });
    fonts(d);
    const chunks: Buffer[] = [];
    d.on("data", (chunk: Buffer) => chunks.push(chunk));
    d.on("end", () => resolve(Buffer.concat(chunks)));
    d.on("error", reject);
    if ("kind" in report && report.kind === "list") {
      for (
        let i = 0;
        i < Math.max(1, Math.ceil(report.rows.length / 12));
        i++
      ) {
        if (i) d.addPage();
        renderList(
          d,
          { ...report, rows: report.rows.slice(i * 12, i * 12 + 12) },
          i * 12,
        );
      }
    } else if ("kind" in report && report.kind === "detail")
      renderDetail(d, report);
    else renderLegacy(d, report as PdfLegacy);
    footer(
      d,
      options.footerText ??
        ("kind" in report && report.kind === "list"
          ? "Panorama de decisões"
          : "Decisão individual"),
      "kind" in report && report.kind === "detail"
        ? undefined
        : "issued" in report
          ? report.issued
          : new Intl.DateTimeFormat("pt-BR").format(new Date()),
    );
    d.end();
  });
}
