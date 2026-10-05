import { Prisma } from "../../generated/prisma/client.js";
import type { ReportDecision } from "../../projections/decisions/decision-report.projection.js";

export const statusLabels = {
  DRAFT: "Rascunho",
  ACTIVE: "Em acompanhamento",
  COMPLETED: "Concluída",
  ABANDONED: "Abandonada",
  ARCHIVED: "Arquivada",
};
export const assessmentLabels = {
  MET: "Atendida",
  PARTIALLY_MET: "Parcialmente atendida",
  NOT_MET: "Não atendida",
  INCONCLUSIVE: "Inconclusiva",
};

type Expectation = ReportDecision["expectations"][number];
type Target = Expectation["targets"][number];

export function latestAssessment(expectation: Expectation, now: Date) {
  return expectation.assessments
    .filter((item) => item.createdAt <= now)
    .sort(
      (a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime() ||
        b.id.localeCompare(a.id),
    )[0];
}

export function compareTarget(
  decision: ReportDecision,
  target: Target,
  now: Date,
) {
  const metric = decision.metrics.find((item) => item.id === target.metricId);
  // A past deadline must not be satisfied retroactively by a later measurement.
  const cutoff =
    target.evaluateAt && target.evaluateAt < now ? target.evaluateAt : now;
  const measurement = metric?.measurements
    .filter((item) => item.recordedAt <= cutoff)
    .sort(
      (a, b) =>
        b.recordedAt.getTime() - a.recordedAt.getTime() ||
        b.id.localeCompare(a.id),
    )[0];
  if (!measurement) return { metric, measurement, meets: null, gap: null };
  const value = new Prisma.Decimal(measurement.value);
  const goal = new Prisma.Decimal(target.targetValue);
  const meets =
    target.operator === "GTE"
      ? value.gte(goal)
      : target.operator === "LTE"
        ? value.lte(goal)
        : value.eq(goal);
  const gap = meets
    ? new Prisma.Decimal(0)
    : target.operator === "GTE"
      ? goal.minus(value)
      : target.operator === "LTE"
        ? value.minus(goal)
        : value.minus(goal).abs();
  return { metric, measurement, meets, gap };
}

export function analyzeDecision(decision: ReportDecision, now: Date) {
  const counts = {
    MET: 0,
    PARTIALLY_MET: 0,
    NOT_MET: 0,
    INCONCLUSIVE: 0,
    pending: 0,
  };
  for (const expectation of decision.expectations) {
    const assessment = latestAssessment(expectation, now);
    if (assessment) counts[assessment.result]++;
    else counts.pending++;
  }
  const overdue = decision.checkpoints.filter(
    (item) => !item.completedAt && item.scheduledFor < now,
  );
  const pendingTargets = decision.expectations
    .flatMap((expectation) => expectation.targets)
    .filter(
      (target) =>
        target.evaluateAt &&
        target.evaluateAt <= now &&
        compareTarget(decision, target, now).meets !== true,
    );
  const actions: string[] = [];
  if (decision.status === "DRAFT") {
    if (!decision.alternatives.length)
      actions.push(
        "Registre ao menos uma alternativa para comparar suas opções.",
      );
    if (!decision.expectations.length)
      actions.push(
        "Defina ao menos uma expectativa para poder revisar esta decisão.",
      );
    actions.push(
      "Compare as alternativas, escolha uma e registre a justificativa para confirmar a decisão.",
    );
  } else if (decision.status === "ACTIVE") {
    if (overdue.length)
      actions.push(
        `Revise ${overdue.length} checkpoint(s) com prazo vencido e ainda sem conclusão.`,
      );
    if (pendingTargets.length)
      actions.push(
        `Revise ${pendingTargets.length} meta(s) com prazo atingido e sem evidência de atendimento até o prazo.`,
      );
    if (!decision.outcomes.length)
      actions.push(
        "Registre um resultado observado para confrontar as expectativas.",
      );
    if (counts.pending)
      actions.push(
        `Avalie ${counts.pending} expectativa(s) ainda sem avaliação vinculada a um resultado.`,
      );
    if (counts.NOT_MET || counts.PARTIALLY_MET || counts.INCONCLUSIVE)
      actions.push(
        "Investigue as expectativas não atendidas, parciais ou inconclusivas; registre evidências e o que precisa mudar.",
      );
    if (!decision.reflections.length)
      actions.push(
        "Registre uma reflexão sobre o que aprendeu e o que faria diferente.",
      );
    if (!actions.length)
      actions.push(
        "Revise os aprendizados e decida se já há evidência suficiente para concluir a decisão.",
      );
  } else {
    actions.push(
      "Use os resultados e as reflexões deste histórico ao considerar decisões semelhantes.",
    );
  }
  return { counts, overdue, pendingTargets, actions };
}
