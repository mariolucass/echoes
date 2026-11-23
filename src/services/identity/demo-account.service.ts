import prisma from "../../database/prisma.js";
import { env } from "../../config/env.js";
import { UserRepository } from "../../repositories/identity/index.js";
import { hashPassword } from "../../utils/password.js";

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY);
const ahead = (days: number) => new Date(Date.now() + days * DAY);

type Seed = {
  title: string;
  description: string;
  context: string;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED" | "DRAFT";
  decidedDaysAgo?: number;
  rationale?: string;
  tags: string[];
  alternatives: { title: string; description: string; pros: string; cons: string; chosen?: boolean }[];
  expectations: { key: string; description: string; impact: number }[];
  metrics?: {
    key: string;
    name: string;
    unit: string;
    expectation: string;
    operator: "GTE" | "LTE" | "EQ";
    target: number;
    baseline: number;
    measurements: { daysAgo: number; value: number }[];
  }[];
  outcome?: {
    description: string;
    impact: number;
    daysAgo: number;
    assessments: { expectation: string; result: "MET" | "PARTIALLY_MET" | "NOT_MET" | "INCONCLUSIVE"; notes: string }[];
  };
  reflection?: { content: string; satisfaction: number; regret: number };
  checkpoints: { daysFromNow: number; done?: boolean; score?: number; notes?: string }[];
};

const seeds: Seed[] = [
  {
    title: "Aceitar a proposta de trabalho remoto em outra cidade",
    description: "Proposta de tech lead em uma empresa 100% remota, com salário 25% maior.",
    context: "Hoje trabalho presencial, com deslocamento de 2 horas por dia. A proposta exige mais autonomia e menos reuniões presenciais.",
    status: "COMPLETED",
    decidedDaysAgo: 210,
    rationale: "O ganho de tempo e de salário compensa perder o convívio diário com o time atual.",
    tags: ["carreira", "qualidade de vida"],
    alternatives: [
      { title: "Aceitar a proposta remota", description: "Mudar para a nova empresa em 30 dias.", pros: "Mais salário, 2h por dia de volta, autonomia.", cons: "Menos convívio presencial, risco de isolamento.", chosen: true },
      { title: "Ficar e negociar aumento", description: "Usar a proposta como base para renegociar.", pros: "Zero risco de adaptação.", cons: "Deslocamento continua; aumento incerto." },
    ],
    expectations: [
      { key: "tempo", description: "Ganhar pelo menos 8 horas livres por semana.", impact: 8 },
      { key: "renda", description: "Aumentar a renda mensal em 20% ou mais.", impact: 7 },
      { key: "time", description: "Manter bom relacionamento com o novo time mesmo à distância.", impact: 6 },
    ],
    metrics: [
      { key: "horas", name: "Horas livres por semana", unit: "h", expectation: "tempo", operator: "GTE", target: 8, baseline: 3, measurements: [{ daysAgo: 150, value: 9 }, { daysAgo: 90, value: 10 }, { daysAgo: 30, value: 11 }] },
    ],
    outcome: {
      description: "Seis meses depois: mais tempo livre e renda maior, mas o vínculo com o time novo demorou a se formar.",
      impact: 8,
      daysAgo: 20,
      assessments: [
        { expectation: "tempo", result: "MET", notes: "Superou a meta: cerca de 10 horas livres por semana." },
        { expectation: "renda", result: "MET", notes: "Aumento de 27% no total." },
        { expectation: "time", result: "PARTIALLY_MET", notes: "Só melhorou depois de marcar encontros quinzenais por vídeo." },
      ],
    },
    reflection: { content: "Faria de novo. O que eu não previ foi o esforço extra para criar laços; hoje agendo conversas informais toda semana.", satisfaction: 9, regret: 1 },
    checkpoints: [
      { daysFromNow: -180, done: true, score: 8, notes: "Primeiro mês: adaptação tranquila." },
      { daysFromNow: -90, done: true, score: 8, notes: "Rotina estável, falta convívio." },
    ],
  },
  {
    title: "Contratar uma ferramenta paga de gestão de projetos",
    description: "Trocar planilhas por uma ferramenta de gestão para o time de 6 pessoas.",
    context: "As planilhas viraram gargalo: ninguém sabe a versão atual e as entregas atrasam por falta de visibilidade.",
    status: "ACTIVE",
    decidedDaysAgo: 45,
    rationale: "O custo mensal é pequeno perto do tempo perdido em reuniões de alinhamento.",
    tags: ["trabalho", "produtividade"],
    alternatives: [
      { title: "Ferramenta paga (plano Team)", description: "Assinatura mensal por usuário.", pros: "Automação, visão de roadmap, integrações.", cons: "Custo recorrente e curva de aprendizado.", chosen: true },
      { title: "Continuar com planilhas", description: "Padronizar o modelo e nomear um responsável.", pros: "Sem custo.", cons: "O problema de visibilidade continua." },
      { title: "Ferramenta gratuita", description: "Plano free de outra ferramenta.", pros: "Sem custo inicial.", cons: "Limites que o time atingiria em semanas." },
    ],
    expectations: [
      { key: "reunioes", description: "Reduzir reuniões de alinhamento pela metade.", impact: 7 },
      { key: "prazo", description: "Entregar 90% das tarefas no prazo.", impact: 8 },
    ],
    metrics: [
      { key: "reuniao", name: "Horas de reunião de alinhamento por semana", unit: "h", expectation: "reunioes", operator: "LTE", target: 3, baseline: 6, measurements: [{ daysAgo: 35, value: 5.5 }, { daysAgo: 20, value: 4 }, { daysAgo: 6, value: 3.5 }] },
      { key: "prazo", name: "Tarefas entregues no prazo", unit: "%", expectation: "prazo", operator: "GTE", target: 90, baseline: 64, measurements: [{ daysAgo: 35, value: 70 }, { daysAgo: 20, value: 78 }, { daysAgo: 6, value: 84 }] },
    ],
    checkpoints: [
      { daysFromNow: -15, done: true, score: 7, notes: "Time já usa o quadro todos os dias." },
      { daysFromNow: 30 },
      { daysFromNow: 75 },
    ],
  },
  {
    title: "Começar a correr três vezes por semana",
    description: "Criar o hábito de corrida para melhorar disposição e sono.",
    context: "Passo o dia sentado e acordo cansado. Tenho uma academia perto, mas nunca mantive a rotina.",
    status: "ACTIVE",
    decidedDaysAgo: 28,
    rationale: "Correr exige pouco equipamento e cabe em horários variáveis.",
    tags: ["saúde", "hábitos"],
    alternatives: [
      { title: "Corrida ao ar livre", description: "Três treinos curtos por semana, de manhã.", pros: "Barato e flexível.", cons: "Depende do clima.", chosen: true },
      { title: "Academia", description: "Plano mensal com musculação.", pros: "Estrutura e acompanhamento.", cons: "Já abandonei duas vezes." },
    ],
    expectations: [
      { key: "sono", description: "Dormir melhor e acordar com mais disposição em 6 semanas.", impact: 7 },
      { key: "5k", description: "Conseguir correr 5 km sem parar em 8 semanas.", impact: 6 },
    ],
    metrics: [
      { key: "km", name: "Distância contínua", unit: "km", expectation: "5k", operator: "GTE", target: 5, baseline: 1, measurements: [{ daysAgo: 21, value: 2 }, { daysAgo: 14, value: 3 }, { daysAgo: 7, value: 3.8 }] },
    ],
    checkpoints: [{ daysFromNow: -7, done: true, score: 8, notes: "Sem faltar nenhuma semana." }, { daysFromNow: 28 }],
  },
  {
    title: "Reformar o escritório em casa agora",
    description: "Trocar mesa, cadeira e iluminação por um conjunto melhor.",
    context: "Dor nas costas recorrente. Orçamento de R$ 4.500, mas o mês está apertado.",
    status: "ABANDONED",
    decidedDaysAgo: 120,
    rationale: "Adiado: o custo não cabia no orçamento e a dor melhorou com ajustes simples.",
    tags: ["finanças", "saúde"],
    alternatives: [
      { title: "Reforma completa", description: "Mesa regulável, cadeira ergonômica e luminária.", pros: "Resolve a causa da dor.", cons: "Custo alto agora." },
      { title: "Ajustes simples", description: "Apoio de monitor e pausas programadas.", pros: "Custa menos de R$ 300.", cons: "Pode não bastar.", chosen: true },
    ],
    expectations: [{ key: "dor", description: "Reduzir a dor nas costas para menos de 3/10.", impact: 7 }],
    reflection: { content: "Os ajustes simples funcionaram melhor do que eu esperava. Vale testar o barato antes de gastar muito.", satisfaction: 8, regret: 2 },
    checkpoints: [{ daysFromNow: -60, done: true, score: 7, notes: "Dor caiu de 6 para 3." }],
  },
  {
    title: "Mudar o plano de estudos de inglês para aulas particulares",
    description: "Comparar o app atual com aulas individuais semanais.",
    context: "Estou parado há meses no mesmo nível no app. Preciso falar com clientes internacionais no próximo semestre.",
    status: "DRAFT",
    tags: ["estudos", "carreira"],
    alternatives: [
      { title: "Aulas particulares", description: "Uma aula por semana com professor nativo.", pros: "Prática de conversação.", cons: "Custo maior." },
      { title: "Continuar no app", description: "Manter a assinatura atual.", pros: "Barato e flexível.", cons: "Sem prática de fala." },
    ],
    expectations: [{ key: "fala", description: "Conduzir uma reunião em inglês com segurança em 4 meses.", impact: 8 }],
    checkpoints: [],
  },
];

/** Apaga e recria só as decisões/tags do usuário informado. */
async function seedDecisions(userId: string) {
  await prisma.$transaction(
    async (tx) => {
      await tx.decisionRevision.deleteMany({ where: { decision: { userId } } });
      await tx.decision.deleteMany({ where: { userId } }); // cascata: alternativas, metas, métricas, desfechos...
      await tx.tag.deleteMany({ where: { userId } });

      const tagIds = new Map<string, string>();
      for (const tagName of new Set(seeds.flatMap((seed) => seed.tags))) {
        const tag = await tx.tag.create({ data: { userId, name: tagName }, select: { id: true } });
        tagIds.set(tagName, tag.id);
      }

      for (const seed of seeds) {
        const decision = await tx.decision.create({
          data: {
            userId,
            title: seed.title,
            description: seed.description,
            context: seed.context,
            status: seed.status,
            rationale: seed.rationale,
            decidedAt: seed.decidedDaysAgo ? ago(seed.decidedDaysAgo) : null,
            createdAt: ago((seed.decidedDaysAgo ?? 7) + 2),
          },
          select: { id: true },
        });
        const decisionId = decision.id;

        for (const tagName of seed.tags)
          await tx.decisionTag.create({ data: { decisionId, userId, tagId: tagIds.get(tagName)! } });

        let chosenId: string | undefined;
        for (const alt of seed.alternatives) {
          const created = await tx.decisionAlternative.create({
            data: { decisionId, title: alt.title, description: alt.description, pros: alt.pros, cons: alt.cons },
            select: { id: true },
          });
          if (alt.chosen) chosenId = created.id;
        }
        if (chosenId && seed.status !== "DRAFT")
          await tx.decision.update({ where: { id: decisionId }, data: { chosenAlternativeId: chosenId } });

        const expectationIds = new Map<string, string>();
        for (const exp of seed.expectations) {
          const created = await tx.expectation.create({
            data: { decisionId, description: exp.description, expectedImpact: exp.impact },
            select: { id: true },
          });
          expectationIds.set(exp.key, created.id);
        }

        for (const metric of seed.metrics ?? []) {
          const created = await tx.metric.create({
            data: {
              decisionId,
              name: metric.name,
              unit: metric.unit,
              measurements: {
                create: metric.measurements.map((m) => ({ value: m.value, recordedAt: ago(m.daysAgo) })),
              },
            },
            select: { id: true },
          });
          await tx.expectationTarget.create({
            data: {
              decisionId,
              expectationId: expectationIds.get(metric.expectation)!,
              metricId: created.id,
              operator: metric.operator,
              targetValue: metric.target,
              baselineValue: metric.baseline,
              evaluateAt: ahead(30),
            },
          });
        }

        if (seed.outcome) {
          const outcome = await tx.outcome.create({
            data: {
              decisionId,
              description: seed.outcome.description,
              impact: seed.outcome.impact,
              occurredAt: ago(seed.outcome.daysAgo),
            },
            select: { id: true },
          });
          for (const a of seed.outcome.assessments)
            await tx.expectationAssessment.create({
              data: {
                decisionId,
                outcomeId: outcome.id,
                expectationId: expectationIds.get(a.expectation)!,
                result: a.result,
                notes: a.notes,
              },
            });
        }

        if (seed.reflection)
          await tx.reflection.create({
            data: {
              decisionId,
              content: seed.reflection.content,
              satisfactionScore: seed.reflection.satisfaction,
              regretScore: seed.reflection.regret,
            },
          });

        for (const cp of seed.checkpoints)
          await tx.checkpoint.create({
            data: {
              decisionId,
              scheduledFor: cp.daysFromNow < 0 ? ago(-cp.daysFromNow) : ahead(cp.daysFromNow),
              completedAt: cp.done ? ago(Math.max(0, -cp.daysFromNow - 1)) : null,
              score: cp.score,
              notes: cp.notes,
            },
          });
      }
    },
    { timeout: 60_000 },
  );

  return seeds.length;
}

/**
 * Garante a conta demo pública: cria o usuário se faltar e semeia as decisões de
 * exemplo quando ela está vazia (ou quando `reset` é pedido).
 */
export class DemoAccountService {
  constructor(private readonly users = new UserRepository()) {}

  get enabled() {
    return Boolean(env.DEMO_USER_EMAIL && env.DEMO_USER_PASSWORD);
  }

  async ensure({ reset = false }: { reset?: boolean } = {}) {
    const email = env.DEMO_USER_EMAIL;
    const password = env.DEMO_USER_PASSWORD;
    if (!email || !password) throw new Error("DEMO_USER_EMAIL e DEMO_USER_PASSWORD são obrigatórios.");

    let user = await this.users.findByEmail(email);
    let created = false;
    if (!user) {
      try {
        const publicUser = await this.users.create({
          name: process.env.DEMO_USER_NAME ?? "Conta Demo",
          email,
          passwordHash: await hashPassword(password),
        });
        user = { ...publicUser, passwordHash: "" };
        created = true;
      } catch (error) {
        // Corrida: outra requisição criou a conta primeiro.
        user = await this.users.findByEmail(email);
        if (!user) throw error;
      }
    }

    const hasDecisions = (await prisma.decision.count({ where: { userId: user.id } })) > 0;
    const seeded = created || reset || !hasDecisions ? await seedDecisions(user.id) : 0;
    return { user: await this.users.findById(user.id), created, seeded };
  }
}
