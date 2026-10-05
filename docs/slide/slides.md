---
layout: cover
title: Echoes
---

<div class="eyebrow">Echoes · API de inteligência para decisões</div>

# Echoes

<p class="lead">Toda decisão deixa um eco.<br><span class="fg">Agora você consegue ouvi-lo.</span></p>

<div class="cover-credits">
  <span>MÁRIO LUCAS · MOISÉS IATAGAN · JOÃO MARCOS</span>
  <span>05.10.2026</span>
</div>

<!--
[ABERTURA · 30s] Não comece explicando a API. Comece com silêncio e uma pergunta:
"Levante a mão quem já tomou uma decisão importante no trabalho nos últimos seis meses."
(Todos levantam.) "Agora mantenha a mão levantada quem consegue dizer, com números, o que esperava dela."
As mãos descem. Esse é o produto. Deixe a pausa trabalhar.
Fonte: README.md, introdução.
-->

---
layout: statement
title: Toda empresa decide
---

<h1 class="mega">Toda empresa decide.<br>Quase nenhuma lembra <em>por quê</em>.</h1>

<!--
[TENSÃO] Fale devagar. Esta é a tese do talk inteiro.
Times decidem o tempo todo: trocar de stack, reescrever um módulo, contratar, mudar um processo.
O ato de decidir é celebrado. O momento de conferir se a decisão funcionou quase nunca acontece.
Não apresente números de mercado. A identificação da plateia sustenta o argumento melhor do que uma estatística.
-->

---
eyebrow: O problema
title: O contexto se espalha
---

# O contexto não desaparece.<br><span class="muted">Ele se espalha.</span>

<div class="fragments">
  <div class="fragment" v-click>
    <span class="where">#canal-do-time · thread</span>
    <h3>A justificativa</h3>
    <p>Morreu em uma conversa de 140 mensagens que ninguém vai reler.</p>
  </div>
  <div class="fragment" v-click>
    <span class="where">metas_Q3_final_v2.xlsx</span>
    <h3>A expectativa</h3>
    <p>Ficou numa planilha que não tem dono e não tem histórico.</p>
  </div>
  <div class="fragment" v-click>
    <span class="where">dashboard · /metrics</span>
    <h3>O resultado</h3>
    <p>Está num gráfico, sem ligação com o que foi prometido.</p>
  </div>
</div>

<p class="caption" v-click>Três fontes. Nenhuma conversa entre elas. A revisão vira arqueologia.</p>

<!--
[AGITAÇÃO] Revele um fragmento por clique. Cada um deve gerar um "isso acontece aqui".
Os nomes de arquivo e canal são ilustrativos. O ponto: justificativa, meta e resultado vivem em lugares diferentes,
então ligar um ao outro meses depois exige reconstrução manual.
Frase de transição: "E tem um problema ainda pior do que a bagunça."
-->

---
eyebrow: O VIÉS
title: A memória reescreve
clicks: 4
---

# Depois do resultado,<br>a memória <span class="gradient">reescreve</span> a expectativa.

<BiasFork />

<!--
[O GANCHO PSICOLÓGICO] Este é o slide mais importante do argumento.
O viés retrospectivo é um fenômeno descrito na psicologia: depois de conhecer o desfecho,
as pessoas tendem a lembrar das próprias previsões como mais alinhadas ao resultado do que realmente foram.
Não é desonestidade. É assim que a memória funciona. Por isso, lembrar não basta: é preciso registrar antes.
Cite o conceito; os 60% são apenas parte do exemplo ilustrativo. Referência: Fischhoff, B. (1975), "Hindsight ≠ foresight".
Pergunte: "Qual das duas frases você já ouviu numa retrospectiva?"
-->

---
layout: statement
title: O custo real
---

<h1 class="mega">O erro caro não é decidir errado.<br>É <em>não aprender</em> com isso.</h1>

<p class="lead">Sem o registro do que você esperava, cada um lembra a versão que lhe convém. A próxima decisão começa do zero.</p>

<!--
[AVERSÃO À PERDA] Mude o enquadramento: o custo não é o erro, é o aprendizado perdido.
Decidir errado faz parte. O que dói é repetir o mesmo erro porque não sobrou referência para comparar.
Pausa longa antes de virar o slide. O próximo é a revelação.
-->

---
layout: cover
title: Apresentando Echoes
---

<div class="eyebrow">Apresentando</div>

# Echoes.

<p class="lead">A camada de memória para decisões.</p>

<p class="caption">Registre a escolha. Congele a expectativa. Meça o resultado. Aprenda de verdade.</p>

<!--
[REVELAÇÃO] Estilo keynote: o nome aparece sozinho, grande.
Uma frase só: "Echoes é uma API que transforma decisões em registros comparáveis."
Ela não decide por você e não prevê o futuro. Ela garante que, quando o resultado chegar,
a expectativa original ainda esteja lá, intacta.
-->

---
eyebrow: Como funciona
title: Quatro verbos
---

# Quatro verbos. <span class="muted">Um ciclo completo.</span>

<div class="flow">
  <div v-click>
    <span class="n">01</span>
    <h3>Decida</h3>
    <p>Rascunho com contexto, alternativas, prós e contras.</p>
    <span class="state state--draft">DRAFT</span>
  </div>
  <div v-click>
    <span class="n">02</span>
    <h3>Prometa</h3>
    <p>Expectativas com métrica, operador e meta numérica. Depois, o commit.</p>
    <span class="state state--active">ACTIVE</span>
  </div>
  <div v-click>
    <span class="n">03</span>
    <h3>Meça</h3>
    <p>Medições datadas e checkpoints ao longo do tempo.</p>
    <span class="state state--active">ACTIVE</span>
  </div>
  <div v-click>
    <span class="n">04</span>
    <h3>Aprenda</h3>
    <p>Resultado, avaliação de cada expectativa e reflexão.</p>
    <span class="state state--completed">COMPLETED</span>
  </div>
</div>

<p class="caption">O commit só é aceito com ao menos uma alternativa, uma expectativa e a justificativa da escolha.</p>

<!--
[SIMPLICIDADE] A complexidade do domínio cabe em quatro verbos. Isso vende.
Mapeamento real: POST /decisions (DRAFT) → alternatives, metrics, expectations → POST /decisions/:id/commit (ACTIVE)
→ POST /tracking/metrics/:id/measurements e /tracking/checkpoints → POST /decisions/:id/reviews com complete: true (COMPLETED).
O enum também tem ABANDONED e ARCHIVED, ainda sem endpoints de transição. Não demonstrar.
Fontes: decision.prisma; README.md, Fluxo de decisão.
-->

---
layout: two-cols
eyebrow: O momento-chave
title: O commit
---

::header::

# O commit congela o que você esperava. <span class="muted">Literalmente.</span>

::default::

<div class="glow" v-click>
  <div class="k">Snapshot versionado</div>
  <h3>Uma fotografia da decisão</h3>
  <p>Título, contexto, opção escolhida, justificativa, alternativas, métricas, expectativas e metas, registrados em JSONB com <code>schemaVersion</code>.</p>
</div>

::right::

<div class="glow" v-click>
  <div class="k">Garantido pelo banco</div>
  <h3>Ninguém reescreve o passado</h3>
  <p>Um trigger no PostgreSQL bloqueia <code>UPDATE</code> e <code>DELETE</code> da revisão. A mudança de estado e o snapshot acontecem na mesma transação.</p>
</div>

<p class="caption" v-click>Pense em Git aplicado às decisões. O viés retrospectivo não tem onde se esconder.</p>

<!--
[DIFERENCIAL] Este é o "one more thing" técnico. Conecte de volta ao slide do viés:
a memória reescreve; o snapshot não.
Fatos: DecisionRevision versão 1 é criada em DecisionRepository.commit, na mesma transação que muda para ACTIVE.
Migration 20260927220000_decision_commit_and_targets cria prevent_decision_revision_change() e o trigger
"DecisionRevision_immutable_trigger". A FK da revisão usa onDelete: Restrict.
Não prometer armazenamento à prova de adulteração por quem tem acesso de superusuário ao banco.
Fontes: decision-revision.prisma; migration.sql; decision-snapshot.transformer.ts.
-->

---
eyebrow: Na prática · exemplo ilustrativo
title: Melhorou ou cumpriu
clicks: 4
---

# O relatório ficou rápido o suficiente?

<GoalVsResult />

<!--
[O "AHA"] Sem o Echoes, esse projeto seria comemorado: "ficou 25% mais rápido!".
Com o Echoes, o time vê que prometeu 5 s e entregou 9 s. As duas verdades coexistem. Isso é aprendizado.
Números fictícios: baselineValue 12, targetValue 5 (operador LTE), MetricMeasurement.value 9.
(12 − 9) / 12 = 25%. A API NÃO deduz o NOT_MET: quem avalia é o usuário, via ExpectationAssessment.
Os relatórios PDF exibem a comparação numérica ao lado da avaliação, sem substituí-la.
Fontes: expectation-target.prisma; metric-measurement.prisma; expectation-assessment.prisma; README.md, relatórios.
-->

---
eyebrow: A PROMESSA, EM JSON
title: Expectativa mensurável
clicks: 6
---

# Uma promessa <span class="muted">que dá para conferir.</span>

<ExpectationExample />

<!--
[CONCRETUDE] Mostre que "expectativa" deixa de ser frase vaga e vira contrato verificável.
Crie antes a métrica (POST /decisions/:id/metrics, name "Tempo de geração", unit "s"). UUID ilustrativo.
expectedImpact é número de -10 a 10 (opcional). evaluateAt é opcional; a data do exemplo é futura.
Metas e medições trafegam como strings decimais com até 4 casas. FKs compostas garantem metricId da mesma decisão.
Fontes: src/schemas/decisions/expectation.schema.ts; expectation-target.prisma.
-->

---
eyebrow: O que a API resolve
title: O que resolve
---

# Tudo o que uma decisão <span class="muted">precisa.</span>

<div class="decision-essentials">
  <div class="decision-hero" v-click>
    <div class="decision-hero-label">Avaliação</div>
    <h2>Honestidade em 4 níveis</h2>
    <div class="decision-outcomes">
      <span class="decision-outcome decision-outcome--met">MET</span>
      <span class="decision-outcome decision-outcome--partial">PARTIALLY_MET</span>
      <span class="decision-outcome decision-outcome--not-met">NOT_MET</span>
      <span class="decision-outcome decision-outcome--inconclusive">INCONCLUSIVE</span>
    </div>
    <p>Cada expectativa é julgada contra a meta congelada.</p>
  </div>
  <div class="decision-essentials-list">
    <div class="decision-line" v-click>
      <span class="decision-line-label">Contexto</span>
      <h3>A decisão inteira</h3>
      <p>Alternativas, prós, contras e justificativa no mesmo registro.</p>
    </div>
    <div class="decision-line" v-click>
      <span class="decision-line-label">Metas e medições</span>
      <h3>Do alvo ao resultado</h3>
      <p>Baseline, operador, alvo e checkpoints datados.</p>
    </div>
    <div class="decision-line" v-click>
      <span class="decision-line-label">Reflexão</span>
      <h3>O que ficou</h3>
      <p>Satisfação e arrependimento de 0 a 10.</p>
    </div>
    <div class="decision-line" v-click>
      <span class="decision-line-label">Relatórios</span>
      <h3>Prontos para a reunião</h3>
      <p>PDF do panorama e de cada decisão.</p>
    </div>
  </div>
</div>

<!--
[VALOR] A avaliação é o centro: revele-a primeiro, depois contexto, metas e medições, reflexão e relatórios.
INCONCLUSIVE é um diferencial ético: a API permite dizer "não sabemos" em vez de forçar sucesso ou fracasso.
Os PDFs tratam ausência de medição como lacuna, sem classificar a decisão como fracasso.
Rotas: GET /decisions/report.pdf e GET /decisions/:id/report.pdf.
Fontes: prisma/domains/**; README.md, relatórios PDF.
-->

---
layout: two-cols
eyebrow: API-first
title: A fundação
---

::header::

# A base sobre a qual <span class="gradient">o resto se constrói.</span>

::default::

## Onde o Echoes pode viver

- No **front-end** do seu produto interno
- Na **automação** que envia medições
- No **pipeline** que registra decisões técnicas
- No **relatório** da reunião de resultados

::right::

## O que já vem pronto

- Contratos **OpenAPI** com referência **Scalar**
- Validação **Zod** em toda entrada
- Coleção **Bruno** cobrindo o fluxo inteiro
- Erros em formato único, com `requestId`

<!--
[POSICIONAMENTO] Apps competem por atenção; infraestrutura vira padrão. Echoes é a segunda categoria.
A coluna da esquerda mostra POSSIBILIDADES de integração. Os clientes não estão neste repositório. Diga "pode viver".
A da direita é real: src/bootstrap/openapi.ts (/doc e /reference fora de produção), src/schemas/, bruno/Echoes,
errorHandler em app.ts com { success, error: { code, message, requestId, timestamp } }.
-->

---
eyebrow: Construído para durar
title: Prova em números
---

# Engenharia <span class="muted">desde o primeiro commit.</span>

<div class="proof">
  <div>
    <div class="num">6</div>
    <div class="lbl">domínios</div>
    <div class="src">prisma/domains/</div>
  </div>
  <div>
    <div class="num">16</div>
    <div class="lbl">modelos</div>
    <div class="src">schema multi-arquivo</div>
  </div>
  <div>
    <div class="num">15</div>
    <div class="lbl">regras CHECK</div>
    <div class="src">no PostgreSQL</div>
  </div>
  <div>
    <div class="num">40+</div>
    <div class="lbl">endpoints</div>
    <div class="src">documentados em OpenAPI</div>
  </div>
  <div>
    <div class="num">4</div>
    <div class="lbl">camadas de teste</div>
    <div class="src">unit · api · integration · e2e</div>
  </div>
</div>

<p class="caption">Cada número acima pode ser conferido no repositório.</p>

<!--
[AUTORIDADE] Números verificáveis geram confiança. A frase final convida a plateia a checar.
6 domínios: identity, decisions, tracking, learning, classification, system.
16 modelos: User, RefreshToken, Decision, DecisionAlternative, DecisionRevision, Expectation, ExpectationTarget,
Checkpoint, Metric, MetricMeasurement, Outcome, ExpectationAssessment, Reflection, Tag, DecisionTag, RequestLog.
15 CHECK: faixas de impacto/notas, textos não vazios, e-mail normalizado, estado DRAFT coerente, versão positiva, snapshot objeto.
40+: rotas createRoute em src/routes/. Testes: tests/unit, tests/api, tests/integration, tests/e2e.
-->

---
eyebrow: Confiança
title: Confiança por padrão
---

# Confiável <span class="muted">por padrão.</span>

<div class="guarantees">
  <div class="guarantee"><span class="check"><IconCheck /></span><div><strong>Isolamento no banco</strong><span>FKs compostas impedem ligar dados de usuários ou decisões diferentes.</span></div></div>
  <div class="guarantee"><span class="check"><IconCheck /></span><div><strong>Operações atômicas</strong><span>Commit e revisão gravam tudo ou nada, na mesma transação.</span></div></div>
  <div class="guarantee"><span class="check"><IconCheck /></span><div><strong>Sessões seguras</strong><span>JWT de 1 h, refresh de uso único com rotação e só o hash armazenado.</span></div></div>
  <div class="guarantee"><span class="check"><IconCheck /></span><div><strong>Senhas com scrypt</strong><span>Salt aleatório; nenhuma senha ou hash sai na resposta.</span></div></div>
  <div class="guarantee"><span class="check"><IconCheck /></span><div><strong>Nada vaza por ID</strong><span>Recurso de outro usuário responde 404, como se não existisse.</span></div></div>
  <div class="guarantee"><span class="check"><IconCheck /></span><div><strong>Histórico preservado</strong><span>Exclusão lógica mantém expectativas, medições e reflexões.</span></div></div>
</div>

<!--
[REDUÇÃO DE RISCO] Público enterprise compra segurança antes de comprar features.
Fatos: @@unique([id, userId]) e [id, decisionId] + relações compostas (DecisionTag, ExpectationTarget, ExpectationAssessment).
Rate limit: 100 req/15 min por IP; 20 tentativas/15 min nas rotas de auth.
Não anunciar SSO, RBAC, criptografia em repouso ou certificações. Esses recursos não existem no projeto.
Fontes: prisma/domains/**; src/services/identity/auth.service.ts; README.md, Autenticação e Segurança.
-->

---
eyebrow: Arquitetura
title: Arquitetura
clicks: 3
---

# Cada camada com uma responsabilidade.

<ArchitectureFlow />

<!--
[CLAREZA] Não vender como microserviços: é um monólito modular em camadas e domínios. Essa estrutura
permite começar rápido sem perder fronteiras.
Eventos: barramento local ao processo, publicado após a transação; subscriber grava log estruturado sem textos da decisão.
Fontes: README.md, Arquitetura; src/app.ts; src/services/decisions/decision.service.ts.
-->

---
eyebrow: ESCALABILIDADE · PRISMA/
title: Pronto para escalar
clicks: 4
---

# A escala foi pensada <span class="gradient">no schema</span>.

<SchemaScale />

<!--
[ESCALA] Mensagem: escalar não vai exigir reescrever o modelo. As decisões difíceis já foram tomadas no schema.
O diagrama simplificado mostra Decision, DecisionRevision, Expectation, ExpectationTarget, Metric e MetricMeasurement.
userId é coluna de Decision; nos demais modelos, o escopo do dono é alcançado pelas relações.
ExpectationTarget liga Expectation e Metric por chaves compostas; MetricMeasurement chega a Decision via Metric.
schemaVersion está dentro do snapshot JSONB construído em decision-snapshot.transformer.ts, não é coluna de DecisionRevision.
Índices reais em decision.prisma: [userId, deletedAt, createdAt, id], [userId, deletedAt, status, createdAt, id],
[userId, deletedAt, decidedAt, id]. MetricMeasurement: [metricId, recordedAt, id]. RequestLog: [timestamp, id].
createCursorPaginatedResponse existe em src/utils/paginate.ts, mas GET /decisions usa paginação por página hoje.
"Base para multi-tenant" e "módulo independente" são caminhos de evolução, não funcionalidades atuais.
docs/data-model.md recomenda validar planos com EXPLAIN ANALYZE quando houver volume real.
-->

---
eyebrow: Roadmap
title: O que vem a seguir
---

# Isto é só o começo.

<div class="roadmap">
  <div class="now">
    <div class="phase">Disponível hoje</div>
    <h3>O ciclo completo</h3>
    <ul>
      <li>Rascunho, commit e revisão</li>
      <li>Snapshot imutável</li>
      <li>Metas, medições e checkpoints</li>
      <li>Relatórios PDF e OpenAPI</li>
    </ul>
  </div>
  <div class="next" v-click>
    <div class="phase">Próximo · planejado</div>
    <h3>Rastro e lembretes</h3>
    <ul>
      <li>Histórico de mudanças de estado</li>
      <li>Lembretes de checkpoint com retries</li>
      <li>Outbox para eventos duráveis</li>
      <li>Política de retenção auditável</li>
    </ul>
  </div>
  <div class="vision" v-click>
    <div class="phase">Visão</div>
    <h3>Inteligência de decisão</h3>
    <ul>
      <li>Workspaces e decisões de time</li>
      <li>Webhooks e integrações</li>
      <li>Taxa de acerto por time e tag</li>
      <li>Busca por decisões semelhantes</li>
    </ul>
  </div>
</div>

<!--
[FUTURO] Separe com clareza o que existe, o que está planejado e o que é visão. Essa honestidade AUMENTA a credibilidade.
Próximo (documentado em docs/data-model.md e README.md): DecisionStatusChange (fromStatus, toStatus, reason, mesma transação);
Reminder (checkpointId, scheduledFor, sentAt, status, attempts), com worker, retries e idempotência;
outbox gravada na mesma transação da decisão; política explícita de retenção/purga auditável.
Visão: NÃO está planejada no repositório. É para onde o modelo atual aponta (chaves compostas, tags, avaliações estruturadas).
-->

---
layout: statement
title: Imagine
---

<h1 class="mega">Imagine saber se as suas apostas <em>costumam acertar</em>.</h1>

<p class="lead">Cada avaliação registrada vira um dado. Somados, eles mostram onde o seu time é preciso e onde tende a ser otimista demais.</p>

<p class="whisper">Visão de produto</p>

<!--
[VISÃO EMOCIONAL] Este é o sonho que você vende. Fale no presente do futuro: "imagine".
Hoje a API já guarda os insumos: ExpectationAssessment com MET / PARTIALLY_MET / NOT_MET / INCONCLUSIVE,
tags privadas e datas. Agregar isso em "calibração" é visão. Deixe explícito que ainda não existe.
Frase de impacto: "Empresas que medem as próprias apostas aprendem mais rápido do que as que só fazem apostas."
-->

---
eyebrow: Para quem
title: Para quem decide
---

# Feito para quem <span class="gradient">decide</span>.

<AudienceColumns />

<!--
[IDENTIFICAÇÃO] Cada pessoa na plateia deve se ver em uma coluna:
- Engenharia: Reescritas, migrações e trocas de stack com meta e medição.
- Produto: Cada iniciativa com hipótese explícita e avaliação honesta.
- Liderança: Estado, pendências e expectativas atendidas em um relatório.
- Pessoas: Carreira, estudos e finanças com reflexão e arrependimento medidos.
Hoje o modelo é por usuário; o uso em time acontece com cada pessoa registrando suas decisões.
Workspaces compartilhados estão na visão, não no produto atual.
Transição: "Chega de slides. Vamos ver funcionando."
-->

---
layout: livecode
title: Live Code
---

<span class="live-badge">Ao vivo</span>

# Live Code

<p class="lead">Uma decisão real, do rascunho ao aprendizado, em minutos.</p>

<div class="chips">
  <span class="chip"><b>POST</b> /decisions</span>
  <span class="chip-arrow"><IconArrow /></span>
  <span class="chip"><b>POST</b> /expectations</span>
  <span class="chip-arrow"><IconArrow /></span>
  <span class="chip"><b>POST</b> /commit</span>
  <span class="chip-arrow"><IconArrow /></span>
  <span class="chip"><b>POST</b> /measurements</span>
  <span class="chip-arrow"><IconArrow /></span>
  <span class="chip"><b>POST</b> /reviews</span>
</div>

<!--
[DEMO] Preparação: API e PostgreSQL rodando, migrations aplicadas, coleção bruno/Echoes aberta, token válido.
Verifique WEEKDAY_ONLY_ENABLED no .env (padrão false). Se true, a API recusa requisições no fim de semana.
Roteiro:
1. POST /identity/auth/login
2. POST /decisions → "Reescrever o módulo de relatórios" (DRAFT)
3. POST /decisions/:id/alternatives → "Reescrever com consultas agregadas" (+ uma segunda opção)
4. POST /decisions/:id/metrics → name "Tempo de geração", unit "s"
5. POST /decisions/:id/expectations → LTE, baseline "12.0000", target "5.0000"
6. POST /decisions/:id/commit → chosenAlternativeId + rationale. Mostre status ACTIVE e revisionId.
7. GET /decisions/:id → mostre o snapshot em revisions. MOMENTO-CHAVE: "isto não pode mais ser alterado".
8. POST /tracking/checkpoints (scheduledFor) e POST /tracking/metrics/:id/measurements → value "9.0000"
9. POST /decisions/:id/reviews → outcome, assessment NOT_MET, reflection, complete: true → COMPLETED
10. GET /decisions/:id/report.pdf → abra o PDF para fechar com impacto visual.
Plano B: se algo falhar, mostre o Scalar em /reference e o PDF gerado previamente.
-->

---
layout: end
title: Encerramento
---

<h1 class="mega">Decisões passam.<br><em>O aprendizado fica.</em></h1>

<p class="lead">Comece pela próxima decisão que você vai tomar.</p>

<div class="cta"><code>pnpm dev</code> · e registre a primeira.</div>

<a class="repo-link" href="https://github.com/mariolucass/echoes" target="_blank" rel="noopener noreferrer">github.com/mariolucass/echoes <IconArrow /></a>

<!--
[FECHAMENTO] Volte à pergunta da abertura: "Quem aqui consegue dizer o que esperava da última grande decisão?"
"Da próxima vez, vocês vão conseguir."
Call to action concreto e pequeno: uma decisão só. Pedidos pequenos têm mais adesão do que pedidos grandes.
-->

---
layout: end
eyebrow: Perguntas
title: Perguntas
---

# Perguntas

<p class="lead">Qual decisão você gostaria de revisar com a expectativa original em mãos?</p>

<!--
Perguntas prováveis e respostas curtas:
- "A API avalia sozinha se deu certo?" Não. Ela compara números nos relatórios, mas a avaliação cabe ao usuário.
- "Funciona para times?" Hoje é por usuário; workspaces estão na visão. O schema com chaves compostas facilita essa evolução.
- "E se eu errar o snapshot?" Ele é imutável por design. Corrigir o passado é exatamente o que o produto evita.
- "Escala?" Índices compostos alinhados às consultas, utilitário de cursor e domínios separados. Validar com EXPLAIN ANALYZE em volume real.
-->
