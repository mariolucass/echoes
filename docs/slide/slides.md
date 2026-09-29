---
layout: cover
---

# Echoes

<p class="lead">Decisões com contexto.<br>Resultados que podem ser comparados.</p>

<p class="caption">Uma API para registrar escolhas e aprender com suas consequências.</p>

<!--
Abra com uma decisão concreta: trocar de ferramenta, mudar um processo ou investir em uma reescrita.
Pergunte como a pessoa saberia, meses depois, se a escolha atendeu ao que ela esperava.
A proposta é preservar uma referência para essa revisão. Não há promessa de prever resultados ou garantir decisões melhores.
Fonte: README.md, introdução e Modelo de domínio.
-->

---
layout: statement
eyebrow: A dor
---

# O resultado chegou.<br>Qual era a **expectativa**?

<p class="lead">Quando contexto, critérios e resultados ficam dispersos, reconstruir o motivo de uma escolha dá trabalho.</p>

<!--
Descreva uma situação possível: a justificativa ficou em uma conversa, o objetivo em uma planilha e o resultado em outro lugar.
Sem reunir esses registros, uma revisão pode perder o critério que orientou a decisão.
Esta é a motivação do produto, não uma conclusão de pesquisa nem uma métrica de impacto.
-->

---
layout: two-cols
eyebrow: Por que usar
---

::header::

# Uma referência para a próxima revisão

::default::

## O que queremos recuperar

- Por que escolhemos essa opção?
- O que consideraríamos um bom resultado?
- O que faríamos diferente agora?

::right::

## O que o Echoes registra

- Alternativas e justificativa da escolha
- Expectativas com metas mensuráveis
- Resultados, avaliações e reflexão

<!--
Associe cada pergunta a um registro concreto. O benefício proposto é reduzir o esforço de reconstruir o contexto.
Não há avaliação automática da qualidade da decisão: o usuário registra sua avaliação e seu aprendizado.
Fontes: prisma/domains/decisions/; prisma/domains/learning/; README.md, Fluxo de decisão.
-->

---
layout: two-cols
eyebrow: Exemplo ilustrativo
---

::header::

# O relatório ficou rápido o suficiente?

::default::

## Na escolha

Reescrever o módulo de relatórios.

- Tempo inicial: **12 s**
- Meta: gerar em **até 5 s**
- Motivo: reduzir a espera pelo relatório

::right::

## Na revisão

Tempo observado: **9 s**.

Houve melhora, mas a meta de tempo não foi atingida.

Reflexão: medir também o custo das consultas antes da próxima mudança.

<!--
Todos os números e a situação são fictícios. Mantenha o mesmo cenário ao longo da demonstração.
A comparação 12 s / 5 s / 9 s ilustra baselineValue, targetValue e MetricMeasurement.value.
O usuário pode registrar NOT_MET para a expectativa de até 5 s. A API recebe essa avaliação, não a deduz da medição.
A reflexão sugere uma investigação futura; os números sozinhos não demonstram a causa da lentidão.
Fontes do modelo: expectation-target.prisma, metric-measurement.prisma e expectation-assessment.prisma.
-->

---
layout: two-cols
eyebrow: Por que uma API
---

::header::

# O registro pode entrar no seu fluxo

::default::

## Possíveis integrações

Um cliente web pode registrar a escolha no momento em que ela acontece.

Uma automação pode enviar medições para acompanhar o resultado.

::right::

## O que já existe na API

Contratos HTTP documentados, autenticação e validação das entradas.

Regras de confirmação e revisão aplicadas a todos os clientes.

<!--
Cliente web e automações são possibilidades de integração, não produtos entregues neste repositório.
Use quando houver uma decisão com consequências que mereçam acompanhamento e alguém responsável por revisá-la.
Exemplos de uso: uma escolha técnica, uma mudança de processo ou uma decisão pessoal com meta verificável.
O modelo atual é por usuário. Não anunciar organizações, colaboração de equipes, lembretes automáticos ou integrações prontas.
Fontes: src/bootstrap/openapi.ts; src/routes/; src/schemas/; README.md.
-->

---
eyebrow: Modelo de domínio
---

# Os seis domínios do Echoes

| Domínio | O que organiza |
| --- | --- |
| **Decisions** | Escolha, alternativas, expectativas e versão inicial |
| **Tracking** | Checkpoints, métricas e medições |
| **Learning** | Resultados, avaliações e reflexões |
| **Identity** | Usuários e renovação de sessão |
| **Classification** | Tags privadas ligadas às decisões |
| **System** | Registros de requisições |

<!--
O mapa cobre todos os diretórios atuais de prisma/domains/.
Decisions: Decision, DecisionAlternative, Expectation, ExpectationTarget, DecisionRevision.
Tracking: Checkpoint, Metric, MetricMeasurement.
Learning: Outcome, ExpectationAssessment, Reflection.
Identity: User, RefreshToken. Classification: Tag, DecisionTag. System: RequestLog.
Decision é o centro do histórico de negócio. RequestLog registra a operação HTTP e não é uma revisão de decisão.
Fonte: prisma/domains/**/*.prisma. O resumo de domínios do README ainda omite alguns desses modelos.
-->

---
eyebrow: Ciclo da decisão
---

# A escolha tem um momento de confirmação

| Estado | O que acontece | Operação |
| --- | --- | --- |
| `DRAFT` | Preparar alternativas e expectativas | Criar o rascunho |
| `ACTIVE` | Confirmar a escolha e acompanhar | Enviar o commit |
| `COMPLETED` | Encerrar com avaliação e reflexão | Revisar com `complete: true` |

<p class="caption">A confirmação exige pelo menos uma alternativa, uma expectativa e a justificativa da escolha.</p>

<!--
Rotas: POST /decisions, POST /decisions/:id/commit, POST /decisions/:id/reviews.
Alternativas, métricas e expectativas são preparadas em DRAFT; commit só aceita a alternativa da própria decisão.
Revisões exigem ACTIVE. Sem complete: true, a decisão continua ACTIVE e pode receber outras revisões.
O enum também contém ABANDONED e ARCHIVED, mas não há endpoints de transição para esses estados no fluxo mostrado.
Fontes: decision.prisma; src/repositories/decisions/decision.repository.ts; src/middlewares/decisions/validate-decision.ts.
-->

---
layout: two-cols
eyebrow: Decisions
---

::header::

# O contexto inicial fica preservado

::default::

## Na confirmação

O Echoes guarda a opção escolhida, a justificativa, as alternativas e as expectativas com suas metas.

A decisão passa para **ACTIVE**.

::right::

## Na revisão futura

Uma **DecisionRevision** preserva o retrato inicial em um snapshot versionado.

A comparação tem uma referência registrada antes do resultado.

<!--
Snapshot é uma cópia estruturada das condições iniciais: schemaVersion, título, descrição, contexto, opção escolhida,
justificativa, alternativas, métricas, expectativas e metas. A confirmação cria a revisão de versão 1.
A mudança de estado e a criação do snapshot acontecem na mesma transação.
Imutabilidade aqui é uma regra do fluxo da aplicação; não anunciar armazenamento à prova de adulteração.
Decisões legadas não recebem um snapshot retroativo sem os dados necessários.
Fontes: decision-revision.prisma; src/transformers/decisions/decision-snapshot.transformer.ts; DecisionRepository.commit.
-->

---
layout: code
eyebrow: Decisions + Tracking
---

::header::

# Uma expectativa com critério mensurável

::default::

```json
{
  "description": "Gerar em até 5 s",
  "targets": [{
    "metricId": "b14738e0-32be-41fa-a8df-7254efbc00c8",
    "operator": "LTE",
    "baselineValue": "12.0000",
    "targetValue": "5.0000"
  }]
}
```

::right::

## A meta é explícita

`LTE` significa menor ou igual.

O valor inicial é 12 s; o objetivo é chegar a 5 s ou menos.

<p class="caption">POST /decisions/:id/expectations<br>O metricId deve pertencer à decisão.</p>

<!--
Corpo de exemplo para criar a expectativa. O UUID é ilustrativo: use o ID retornado ao criar a métrica na demonstração.
Crie primeiro a métrica com name: Tempo de geração e unit: s, em POST /decisions/:id/metrics.
GTE, LTE e EQ são os operadores aceitos. evaluateAt é opcional para indicar a data de avaliação da meta.
Valores de metas e medições trafegam como strings decimais com até quatro casas. Não confundir com expectedImpact,
que na entrada é um número opcional de -10 a 10. A meta não gera uma avaliação automática.
Fontes: src/schemas/decisions/expectation.schema.ts; decision-fields.schema.ts; expectation-target.prisma.
-->

---
layout: two-cols
eyebrow: Tracking + Learning
---

::header::

# Medir e interpretar são etapas distintas

::default::

## Acompanhamento

**MetricMeasurement** registra o valor observado e a data da medição.

**Checkpoint** guarda uma data planejada, notas e, opcionalmente, conclusão e pontuação.

::right::

## Aprendizado

**Outcome** descreve o que aconteceu.

**ExpectationAssessment** liga o resultado à expectativa e registra a avaliação informada pelo usuário.

<!--
Medições avulsas são criadas em POST /tracking/metrics/:id/measurements e exigem uma decisão ACTIVE.
Checkpoints podem ser criados/alterados em DRAFT ou ACTIVE. Não há envio automático de lembretes demonstrado no código.
Uma avaliação aceita MET, PARTIALLY_MET, NOT_MET ou INCONCLUSIVE. Expectativa e resultado pertencem à mesma decisão.
Reflection complementa a avaliação com texto e, opcionalmente, satisfação e arrependimento de 0 a 10.
Fontes: prisma/domains/tracking/; prisma/domains/learning/; src/schemas/tracking/tracking.schema.ts; README.md.
-->

---
layout: two-cols
eyebrow: Revisão da decisão
---

::header::

# Encerrar exige avaliar o que foi esperado

::default::

## Uma revisão reúne

- Resultado e avaliações
- Medições, quando informadas
- Reflexão, quando informada

<p class="caption">POST /decisions/:id/reviews</p>

::right::

## Para concluir a decisão

Com `complete: true`, todas as expectativas precisam ter avaliação e deve existir uma reflexão.

A gravação da revisão e a conclusão ocorrem na **mesma transação**.

<!--
A requisição de revisão exige outcome e ao menos uma avaliação. measurements e reflection são opcionais na revisão comum.
Para concluir, o repositório verifica todas as expectativas e aceita avaliações e reflexão já registradas em revisões anteriores.
Não afirmar que todas precisam constar da última requisição. Se a condição falhar, a transação é revertida.
A resposta inclui outcomeId, assessmentIds, measurementIds, reflectionId e status ACTIVE ou COMPLETED.
Fontes: src/schemas/decisions/decision.schema.ts; DecisionRepository.review; requireReviewComplete.
-->

---
layout: two-cols
eyebrow: Identity + Classification
---

::header::

# Histórico e organização por usuário

::default::

## Acesso ao próprio histórico

Access token com validade de **1 hora**.

Refresh token de uso único, com validade de **7 dias** e rotação na renovação.

::right::

## Organização privada

Tags pertencem ao usuário e podem ser vinculadas às suas decisões.

A exclusão lógica retira a decisão das consultas e preserva os registros no banco.

<!--
Identity: User e RefreshToken. O banco guarda passwordHash e apenas o hash do refresh token.
O cliente deve substituir os dois tokens após POST /identity/auth/refresh.
Classification: Tag e DecisionTag; vínculos compostos garantem que tag e decisão tenham o mesmo dono.
Nas rotas de decisões e dos recursos relacionados, IDs inexistentes, de outro usuário ou excluídos retornam 404.
A exclusão lógica usa deletedAt; não há endpoint de restauração apresentado. Não há compartilhamento entre usuários.
Fontes: README.md, Autenticação; prisma/domains/identity/ e classification/; src/services/identity/auth.service.ts.
-->

---
eyebrow: Arquitetura
---

# Regras de negócio e contrato HTTP

| Parte | Responsabilidade |
| --- | --- |
| Hono + schemas Zod | Receber requisições e validar entradas |
| Controllers + services | Coordenar o caso de uso e a resposta |
| Repositories + Prisma | Consultar dados e executar transações |
| Projections + transformers | Selecionar campos e montar o contrato HTTP |
| PostgreSQL | Persistir relações e aplicar constraints |

<p class="caption">Confirmação e revisão publicam eventos após a transação.</p>

<!--
Não apresentar o projeto como microserviços: é uma API organizada em camadas e domínios.
A entrada configura middlewares, rotas e documentação em src/bootstrap/ e src/app.ts.
Transformers convertem datas para ISO 8601 e mantêm decimais como strings na saída.
O barramento de eventos é local ao processo; o subscriber grava logs estruturados sem o texto da decisão.
Não há garantia de entrega durável nem outbox implementada. A outbox aparece no README como orientação para efeitos críticos.
Fontes: README.md, Arquitetura e Transformação de dados e eventos; src/services/decisions/decision.service.ts.
-->

---
layout: code
eyebrow: Contrato atual de paginação
---

::header::

# A listagem retorna dados, totais e links

::default::

```json
{
  "data": [],
  "meta": {
    "totalItems": 0,
    "totalPages": 0
  },
  "links": {
    "self": "/decisions?page=1",
    "next": null,
    "prev": null
  }
}
```

::right::

## GET /decisions?page=1

Resposta completa de uma lista vazia.

Padrões: página **1**, limite **12**.<br>Máximos: página **100**, limite **48**.

<p class="caption">Aceita filtros por status, texto e datas, além de ordenação. Requer Bearer token.</p>

<!--
Fonte direta: src/utils/paginate.ts, createPaginatedResponse; controller listDecisions chama DecisionService.getAll.
O repositório busca a página e a contagem. meta tem totalItems e totalPages; links tem self, next e prev.
limit=12 é omitido dos links por ser o padrão, mesmo que venha explicitamente na requisição. Demais filtros são preservados.
Parâmetros inválidos retornam 422. Somente decisões não excluídas do usuário autenticado entram no resultado.
Filtros aceitos: status, search, decidedAtFrom/To, createdAtFrom/To. Ordenação: sortBy e order.
search consulta título, descrição e contexto. O padrão de ordem é createdAt desc, com id como desempate.
createPaginatedResponseWithoutCount e createCursorPaginatedResponse também existem no utilitário, mas não são o contrato de GET /decisions.
Fontes adicionais: src/schemas/decisions/decision.schema.ts; src/helpers/decisions/decision.helper.ts.
-->

---
layout: two-cols
eyebrow: System + Integração
---

::header::

# Recursos para integrar e operar

::default::

## Contratos e consulta

**OpenAPI + Scalar** documentam as rotas fora do ambiente de produção.

O relatório em **PDF** exporta a página solicitada de decisões do usuário.

::right::

## Operação

**RequestLog** persiste requisições no PostgreSQL, com consulta por data.

A regra de dias úteis é opcional e vem **desativada por padrão**.

<!--
Documentação: /doc e /reference, registradas apenas quando NODE_ENV não é production.
Relatório: GET /decisions/report.pdf. Logs: GET /request-logs?date=YYYY-MM-DD, com seleção do dia em UTC.
RequestLog registra timestamp, method, route e requestId opcional. Não é um histórico de alterações dos dados de negócio.
O código atual usa Prisma, embora a seção de logs do README ainda cite o arquivo JSONL.
WEEKDAY_ONLY_ENABLED tem padrão false em src/config/env.ts. Se true, o middleware restringe o acesso aos dias úteis,
considerando API_TIME_ZONE. O README ainda descreve a restrição como obrigatória.
Fontes: src/app.ts; src/bootstrap/openapi.ts; src/repositories/system/request-log.repository.ts; src/config/env.ts.
-->

---
eyebrow: Demonstração
---

# Uma escolha acompanhada até a revisão

1. Autenticar e criar o rascunho dos relatórios.
2. Registrar alternativa, métrica e expectativa de **até 5 s**.
3. Confirmar a escolha e consultar o **snapshot inicial**.
4. Registrar checkpoint e medição de **9 s**.
5. Revisar com avaliação, reflexão e `complete: true`.

<p class="caption">A comparação final mantém visíveis a meta original e o resultado observado.</p>

<!--
Preparação: API e PostgreSQL rodando, migrations aplicadas, coleção bruno/Echoes aberta e token válido.
Roteiro: POST /identity/auth/login; POST /decisions; POST /decisions/:id/alternatives;
POST /decisions/:id/metrics; POST /decisions/:id/expectations; POST /decisions/:id/commit.
Use os IDs retornados. Confirme com chosenAlternativeId e rationale e consulte GET /decisions/:id para ver revisions.
Em seguida, POST /tracking/checkpoints com scheduledFor e POST /tracking/metrics/:id/measurements com value: "9.0000".
Finalize em POST /decisions/:id/reviews com outcome, assessment NOT_MET para a expectativa, reflection e complete: true.
Neste exemplo há uma expectativa: avaliá-la e registrar a reflexão satisfazem a condição de conclusão.
Confira o estado COMPLETED e os links da listagem. Os números são ilustrativos, não resultados reais do projeto.
Verifique WEEKDAY_ONLY_ENABLED no ambiente da demonstração: a restrição só se aplica se estiver habilitada.
Fontes: README.md, Fluxo de decisão e Rotas dos demais domínios; contratos em src/routes/ e src/schemas/.
-->

---
layout: end
eyebrow: Perguntas
---

# Perguntas

<p class="lead">Qual decisão você gostaria de avaliar com a expectativa original em mãos?</p>

<!--
Retome a dor inicial: reconstruir o contexto de uma decisão depois do resultado.
O Echoes oferece registros relacionados para essa comparação. O aprendizado depende de registrar medições e voltar para revisar.
Abra para perguntas sobre o uso do produto, o modelo de domínio e as escolhas de implementação.
-->
