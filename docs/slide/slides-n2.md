---
layout: cover
title: Echoes N2
transition: push | push-back
---

<div class="eyebrow">PSW2 · Atividade N2 · IFCE Crato</div>

# Echoes N2

<p class="lead">A API já funcionava.<br><span class="fg">Agora ela está na nuvem, protegida e verificável.</span></p>

<div class="cover-credits">
  <span>MÁRIO LUCAS · MOISÉS IATAGAN · JOÃO MARCOS</span>
  <span>11.11.2026</span>
</div>

<!--
[ABERTURA · 30s] Situe a plateia: o Echoes da primeira entrega registra decisões e compara expectativa com resultado.
Nesta segunda parte o professor pediu oito melhorias (A a H). Diga: "Vou mostrar cada uma, o que existe de verdade e como ver funcionando."
Fonte: AtividadeN2.pdf; backend/docs/divisao-de-tarefas.md.
-->

---
eyebrow: Retrospectiva
title: O que já existia
transition: pan | pan-back
---


# Registrar antes. <span class="gradient">Medir depois.</span>

<div class="brief">
  <div class="brief-row" v-click>
    <span class="idx">01</span>
    <span class="lab">Problema</span>
    <p>Justificativa, meta e resultado vivem em lugares diferentes, e a memória reescreve o que se esperava.</p>
  </div>
  <div class="brief-row" v-click>
    <span class="idx">02</span>
    <span class="lab">Ideia</span>
    <p>Congelar a expectativa com uma meta numérica e medir o resultado depois.</p>
  </div>
  <div class="brief-row" v-click>
    <span class="idx">03</span>
    <span class="lab">Diferencial</span>
    <p>O commit grava um snapshot da decisão que <code>UPDATE</code> e <code>DELETE</code> não conseguem alterar.</p>
  </div>
</div>

<!--
[RETROSPECTIVA · 1 min] Resuma a apresentação anterior sem repeti-la. Três ideias:
1. Problema: o contexto se espalha e o viés retrospectivo faz lembrar a expectativa como mais alinhada ao resultado.
2. Ideia: registrar a expectativa antes (meta numérica) e medir depois.
3. Diferencial: o commit cria DecisionRevision (snapshot JSONB versionado) protegida por trigger no PostgreSQL.
Fonte: docs/slide/slides.md (primeira apresentação), README.md.
-->

---
eyebrow: Retrospectiva
title: O ciclo de quatro verbos
transition: iris | iris-back
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
    <p>Expectativas com métrica, operador e meta. Depois, o commit.</p>
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

<p class="caption">Exemplo: meta de 5 s, resultado de 9 s. Melhorou, mas não cumpriu.</p>

<!--
[RETROSPECTIVA] Mesmo ciclo da primeira apresentação. Rotas: POST /decisions → alternatives, metrics, expectations →
POST /decisions/:id/commit → POST /tracking/metrics/:id/measurements → POST /decisions/:id/reviews (complete: true).
O exemplo de 12 s → 5 s (meta) → 9 s (resultado) é ilustrativo. A avaliação (MET, PARTIALLY_MET, NOT_MET, INCONCLUSIVE) é do usuário.
Transição: "A N2 não muda esse ciclo. Ela muda onde os dados vivem e quem pode acessá-los."
-->

---
eyebrow: Retrospectiva
title: A base em números
transition: push | push-back
---

# Engenharia <span class="muted">desde o primeiro commit.</span>

<div class="proof">
  <div>
    <div class="num"><CountUp :to="6" /></div>
    <div class="lbl">domínios</div>
    <div class="src">prisma/domains/</div>
  </div>
  <div>
    <div class="num"><CountUp :to="16" /></div>
    <div class="lbl">modelos</div>
    <div class="src">schema multi-arquivo</div>
  </div>
  <div>
    <div class="num"><CountUp :to="15" /></div>
    <div class="lbl">regras CHECK</div>
    <div class="src">no PostgreSQL</div>
  </div>
  <div>
    <div class="num"><CountUp :to="40" suffix="+" /></div>
    <div class="lbl">endpoints</div>
    <div class="src">em OpenAPI</div>
  </div>
  <div>
    <div class="num"><CountUp :to="2" /></div>
    <div class="lbl">relatórios PDF</div>
    <div class="src">panorama e individual</div>
  </div>
</div>

<p class="caption">Sobre essa base, a N2 acrescenta nuvem, segurança, testes e exportação.</p>

<!--
[RETROSPECTIVA] Números da primeira apresentação: 6 domínios (identity, decisions, tracking, learning, classification, system),
16 modelos, 15 regras CHECK, 40+ endpoints. Os relatórios em PDF (GET /decisions/report.pdf e /decisions/:id/report.pdf) já existiam.
Também já existiam: JWT com refresh de uso único, senhas com scrypt, rate limit, OpenAPI com Scalar e coleção Bruno.
Fontes: slides.md (primeira apresentação), prisma/domains/**, src/routes/.
-->

---
layout: statement
title: O desafio
transition: pan | pan-back
---

<h1 class="mega">Guardar decisões<br>exige <em>confiança</em>.</h1>

<p class="lead">Nuvem, senha protegida, duas etapas e testes.</p>

<!--
[TENSÃO] Conecte à tese do Echoes: se o produto guarda o que você esperava de uma decisão, ele precisa ser confiável.
Os oito requisitos da N2 são exatamente isso: onde os dados vivem (A, B), quem pode acessar (E, F, G),
como sabemos que funciona (C, D) e como o usuário leva seus dados (H).
-->

---
eyebrow: Visão geral
title: Visão geral
transition: iris | iris-back
---


# Oito requisitos <span class="muted">em três frentes.</span>

<div class="fronts">
  <section class="front">
    <h2>Nuvem</h2>
    <div class="it"><span class="k">A</span><div><b>MongoDB Atlas</b><span>usuários na nuvem</span></div></div>
    <div class="it"><span class="k">B</span><div><b>Cloudinary</b><span>foto de perfil</span></div></div>
  </section>
  <section class="front">
    <h2>Segurança</h2>
    <div class="it"><span class="k">E</span><div><b>Senha com scrypt</b><span>salt aleatório</span></div></div>
    <div class="it"><span class="k">F</span><div><b>CORS</b><span>só o mesmo servidor</span></div></div>
    <div class="it"><span class="k">G</span><div><b>Segundo fator</b><span>código por e-mail</span></div></div>
  </section>
  <section class="front">
    <h2>Prova e entrega</h2>
    <div class="it"><span class="k">C</span><div><b>Testes</b><span>221, todas as rotas</span></div></div>
    <div class="it"><span class="k">D</span><div><b>README</b><span>rotas e configuração</span></div></div>
    <div class="it"><span class="k">H</span><div><b>Exportar</b><span>decisões em CSV</span></div></div>
  </section>
</div>

<!--
[MAPA] Passe rápido; cada item ganha um slide. Divisão: Mário (A, B, G), João Marcos (C, D, E, F, H).
Se o professor perguntar: o item C usa Vitest, que tem API compatível com Jest (describe/it/expect/vi). Há um slide sobre isso.
Fonte: backend/docs/divisao-de-tarefas.md.
-->

---
eyebrow: Requisito A
title: MongoDB Atlas
transition: push | push-back
---

# Usuários no <span class="gradient">MongoDB Atlas.</span>

<div class="split">
  <div class="glow" v-click>
    <div class="k">Nuvem · MongoDB Atlas</div>
    <h3>Fonte dos usuários</h3>
    <div class="chips">
      <span class="chip">id</span>
      <span class="chip">name</span>
      <span class="chip"><b>email</b> único</span>
      <span class="chip">passwordHash</span>
      <span class="chip">avatarUrl</span>
    </div>
    <p>Cadastro, login, perfil e foto leem e gravam aqui.</p>
  </div>
  <div class="split-link" v-click><IconArrow /></div>
  <div class="glow" v-click>
    <div class="k">PostgreSQL · mantido</div>
    <h3>Todo o resto do ciclo</h3>
    <div class="chips">
      <span class="chip">decisões</span>
      <span class="chip">expectativas</span>
      <span class="chip">métricas</span>
      <span class="chip">tags</span>
      <span class="chip"><b>users</b> espelho</span>
    </div>
    <p>Triggers, transações e chaves compostas ficam onde já funcionam.</p>
  </div>
</div>

<p class="caption" v-click>Migração parcial, de propósito. O espelho guarda só o mesmo <code>id</code>, para as chaves estrangeiras. Sem <code>MONGODB_URI</code>, tudo volta ao PostgreSQL.</p>

<style>
.split {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: stretch;
  gap: 18px;
  margin-top: 28px;
}
.split .glow {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.split .glow h3,
.split .glow p {
  margin: 0;
}
.split .chips {
  justify-content: flex-start;
  gap: 8px;
}
.split .chip {
  padding: 6px 12px;
  font-size: 15px;
}
.split .glow p {
  margin-top: auto;
}
.split + .caption {
  margin-top: 28px;
}
.split-link {
  display: grid;
  place-items: center;
  color: var(--muted);
}
.split-link svg {
  width: 28px;
  height: 28px;
}
</style>

<!--
[A] Mostre o Atlas aberto na aba "Browse Collections" depois de cadastrar um usuário no live code.
Implementação: src/database/mongo.ts (conexão lazy + índice único), src/repositories/identity/user.mongo.repository.ts,
UserRepository escolhe a implementação conforme MONGODB_URI. Se o espelho no Postgres falhar, o insert no Mongo é desfeito.
Seja honesto: migrar tudo exigiria reescrever ~50 arquivos e perder garantias do PostgreSQL (trigger de imutabilidade da revisão).
Pergunta provável: "Por que não tudo no Mongo?" Resposta acima.
Teste real contra o Atlas: faça antes da apresentação.
-->

---
eyebrow: Requisito B
title: Imagem em nuvem
transition: pan | pan-back
---

# A foto vai para a nuvem. <span class="muted">O banco guarda só o link.</span>

<div class="flow">
  <div v-click>
    <span class="n">01</span>
    <h3>Escolher</h3>
    <p>Página <code>/profile</code>: JPEG, PNG ou WebP, até 5 MB.</p>
    <span class="state state--draft">FRONT-END</span>
  </div>
  <div v-click>
    <span class="n">02</span>
    <h3>Enviar</h3>
    <p>Requisição <code>multipart</code> para a rota de avatar da API.</p>
    <span class="state state--active">API</span>
  </div>
  <div v-click>
    <span class="n">03</span>
    <h3>Armazenar</h3>
    <p>Upload assinado para o Cloudinary, sem expor o segredo.</p>
    <span class="state state--active">CLOUDINARY</span>
  </div>
  <div v-click>
    <span class="n">04</span>
    <h3>Registrar</h3>
    <p>A URL retornada é salva em <code>avatarUrl</code> do usuário.</p>
    <span class="state state--completed">MONGODB</span>
  </div>
</div>

<p class="caption"><code>PUT /identity/users/me/avatar</code> · tipo e tamanho validados antes de chamar a nuvem.</p>

<!--
[B] Arquivos: src/services/storage/image-storage.service.ts (assinatura SHA-1 com API secret, folder, public_id = id do usuário),
src/services/identity/avatar.service.ts (validações), rota em src/routes/identity/user.routes.ts.
O limite global de corpo é 10 KB; só essa rota aceita até 6 MB.
Erros: 401 sem token, 422 arquivo ausente/tipo inválido/maior que 5 MB, 502 se o Cloudinary falhar.
Demo: envie uma foto em /profile e abra a URL res.cloudinary.com no navegador.
-->

---
eyebrow: Requisito C
title: Testes automatizados
transition: iris | iris-back
---

# Testado <span class="muted">rota por rota.</span>

<div class="proof">
  <div>
    <div class="num"><CountUp :to="221" /></div>
    <div class="lbl">testes</div>
    <div class="src">pnpm test</div>
  </div>
  <div>
    <div class="num"><CountUp :to="45" /></div>
    <div class="lbl">rotas</div>
    <div class="src">no documento OpenAPI</div>
  </div>
  <div>
    <div class="num"><CountUp :to="30" /></div>
    <div class="lbl">arquivos</div>
    <div class="src">de teste</div>
  </div>
  <div>
    <div class="num"><CountUp :to="2" /></div>
    <div class="lbl">camadas</div>
    <div class="src">unit · api</div>
  </div>
  <div>
    <div class="num"><CountUp :to="6" suffix=" s" /></div>
    <div class="lbl">para rodar tudo</div>
    <div class="src">sem banco real</div>
  </div>
</div>

<p class="caption">Uma matriz gerada do OpenAPI testa o 401 de toda rota protegida.</p>

<!--
[C] Seja direto sobre o Jest: o enunciado diz "JEST". O projeto usa Vitest, cuja API é compatível
(describe, it, expect, vi). Os mesmos testes rodam em Jest com ajustes mínimos de import. Diga isso ANTES que perguntem.
(Se o grupo migrar para Jest antes da apresentação, atualize este slide e esta nota.)
tests/api/shared/route-coverage.test.ts percorre app.getOpenAPI31Document() e testa 401 em cada rota protegida.
Além disso há testes de sucesso e erro para auth, decisões, alternativas, relatórios PDF, CSV, CORS, 2FA e avatar.
Limite honesto: rotas de tracking, learning e tags têm a matriz de 401 e testes de validação, não todos os cenários de sucesso.
Demo: rode pnpm test ao vivo (cerca de 6 s).
-->

---
eyebrow: Requisito D
title: Documentação
transition: push | push-back
---

# Quem chega <span class="gradient">consegue usar.</span>

<div class="roadmap">
  <div class="now">
    <div class="phase">README.md</div>
    <h3>Para rodar</h3>
    <ul>
      <li>Stack e arquitetura</li>
      <li>Instalação e variáveis de ambiente</li>
      <li>Docker, Prisma e migrations</li>
    </ul>
  </div>
  <div class="now">
    <div class="phase">README.md</div>
    <h3>Para integrar</h3>
    <ul>
      <li>Endpoints, autenticação e erros</li>
      <li>2FA, CORS e senhas</li>
      <li>Upload, MongoDB e exportação CSV</li>
    </ul>
  </div>
  <div class="now">
    <div class="phase">Referência viva</div>
    <h3>Para explorar</h3>
    <ul>
      <li>OpenAPI com Scalar em <code>/reference</code></li>
      <li>Coleção Bruno com o fluxo inteiro</li>
    </ul>
  </div>
</div>

<!--
[D] Os endpoints novos do N2 estão no README: GET /export/csv, POST /identity/auth/verify-2fa, PUT /identity/users/me/avatar.
Limite honesto: a tabela completa de todas as rotas (corpo, resposta, erros) está no OpenAPI/Scalar; no README ela está resumida.
Se der tempo antes da apresentação, complete a tabela no README.
-->

---
eyebrow: Requisito E
title: Senha criptografada
transition: pan | pan-back
---

# A senha nunca existe <span class="muted">em texto puro.</span>

```text
scrypt:131072:8:1:3f9c…a1b2:9d41…e07c
```

<div class="chips">
  <span class="chip"><b>scrypt</b> algoritmo</span>
  <span class="chip"><b>131072 · 8 · 1</b> custo (N, r, p)</span>
  <span class="chip"><b>3f9c…</b> salt de 16 bytes</span>
  <span class="chip"><b>9d41…</b> hash de 64 bytes</span>
</div>

<p class="caption">Salt diferente a cada senha e comparação em tempo constante.</p>

<!--
[E] Mostre um documento da coleção users no Atlas: o campo passwordHash tem este formato.
Código: src/utils/password.ts (hashPassword, verifyPassword). Cadastro e login usam essa função.
Os logs censuram campos password e token; a resposta da API nunca inclui o hash.
Testes: tests/unit/identity/password.test.ts (hash diferente a cada chamada, verificação, formatos inválidos).
-->

---
eyebrow: Requisito F
title: CORS
transition: iris | iris-back
---


# Só o mesmo servidor <span class="gradient">passa.</span>

<div class="gate">
  <div class="gate-head"><span>Origem da requisição</span><span></span><span>Resposta da API</span><span>Navegador</span></div>
  <div class="gate-row" v-click>
    <div class="g-origin"><code>http://localhost:3333</code><em>mesmo servidor</em></div>
    <div class="g-wire"><i></i></div>
    <div class="g-res"><code>Access-Control-Allow-Origin: http://localhost:3333</code></div>
    <div class="g-verdict ok"><span class="mark"></span>Permitido</div>
  </div>
  <div class="gate-row" v-click>
    <div class="g-origin"><code>https://evil.com</code><em>outro site</em></div>
    <div class="g-wire"><i></i></div>
    <div class="g-res none"><code>sem Access-Control-Allow-Origin</code></div>
    <div class="g-verdict no"><span class="mark"></span>Bloqueado</div>
  </div>
</div>

<p class="caption" v-click>Origens extras entram só por <code>CORS_ALLOWED_ORIGINS</code>. O front-end chama a API pelo servidor do Next, então continua funcionando.</p>

<!--
[F] Código: src/config/cors.ts (resolveCorsOrigin). Testes: tests/unit/config/cors.test.ts e tests/api/system/cors.test.ts.
Demo opcional: curl -H "Origin: https://evil.com" -i http://localhost:3333/health e mostre que não há o cabeçalho de permissão.
Compare com -H "Origin: http://localhost:3333". O pré-voo (OPTIONS) também só responde para a origem permitida.
-->

---
eyebrow: Requisito G
title: Segundo fator
transition: push | push-back
---

# Senha certa <span class="muted">não basta.</span>

<div class="flow">
  <div v-click>
    <span class="n">01</span>
    <h3>Senha</h3>
    <p>O login valida e-mail e senha, sem emitir token.</p>
    <span class="state state--draft">PASSO 1</span>
  </div>
  <div v-click>
    <span class="n">02</span>
    <h3>Código</h3>
    <p>6 dígitos enviados por e-mail, válidos por 5 minutos.</p>
    <span class="state state--active">E-MAIL</span>
  </div>
  <div v-click>
    <span class="n">03</span>
    <h3>Confirmação</h3>
    <p>O usuário envia o código para <code>/verify-2fa</code>.</p>
    <span class="state state--active">PASSO 2</span>
  </div>
  <div v-click>
    <span class="n">04</span>
    <h3>Tokens</h3>
    <p>Só agora a API emite o JWT e o refresh token.</p>
    <span class="state state--completed">SESSÃO</span>
  </div>
</div>

<p class="caption"><code>POST /identity/auth/login</code> → <code>POST /identity/auth/verify-2fa</code> · o código não é guardado, só um HMAC dele.</p>

<!--
[G] Código: src/services/identity/two-factor.service.ts, rota em auth.routes.ts, SMTP via nodemailer (SMTP_* no .env).
Sem SMTP_HOST fora de produção, o código aparece no log da API (útil como plano B na demo).
O challengeToken é um JWT de 5 min com audiência própria; código errado, expirado ou token adulterado = 401.
Limite honesto: dentro dos 5 minutos o mesmo desafio pode ser reutilizado por quem tem o código; o rate limit de 20 tentativas por IP limita ataques.
O front-end tem a tela "Código de verificação" depois do login.
Demo: faça login e mostre o e-mail chegando.
-->

---
eyebrow: Requisito H
title: Exportar
transition: pan | pan-back
---


# Exportar baixa as decisões em <span class="gradient">CSV.</span>

<div class="export">
  <div class="ex-left" v-click>
    <div class="ex-btn">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14"/></svg>
      Exportar
    </div>
    <div class="chips">
      <span class="chip">autenticado</span>
      <span class="chip">text/csv</span>
      <span class="chip">attachment</span>
    </div>
  </div>
  <div class="ex-arrow" v-click><IconArrow /></div>
  <div class="ex-file" v-click>
    <div class="ex-bar"><i></i><i></i><i></i><span>echoes-decisoes-2026-11-11.csv</span></div>
<pre class="ex-code"><span class="c1">id,titulo,descricao,contexto,status,decidida_em,…</span>
9f1c2e4a,<mark>"Mudar, ""agora"""</mark>,,,ACTIVE,2026-11-01,…
b14738e0,Migrar o relatório,,,DRAFT,,…</pre>
    <div class="ex-note">vírgulas e aspas escapadas · fórmulas de planilha neutralizadas</div>
  </div>
</div>

<!--
[H] Código: src/export/csv.export.ts, src/services/system/export.service.ts, rota src/routes/system/export.routes.ts (GET /export/csv).
Front: frontend/src/features/export-decisions (rota /api/export repassa o CSV com o token da sessão).
Exporta apenas as decisões do usuário logado, sem as excluídas. Prefixo ' evita que células iniciadas por = + - @ virem fórmulas no Excel.
BOM UTF-8 mantém os acentos corretos no Excel. Colunas: id, titulo, descricao, contexto, status, decidida_em, criada_em, atualizada_em.
Demo: clique no botão e abra o arquivo no Excel ou no editor.
-->

---
layout: livecode
title: Demonstração
transition: iris | iris-back
---

<span class="live-badge">Ao vivo</span>

# Demo

<p class="lead">Do cadastro ao CSV, passando pelas oito camadas.</p>

<div class="chips">
  <span class="chip"><b>1</b> Cadastro</span>
  <span class="chip-arrow"><IconArrow /></span>
  <span class="chip"><b>2</b> Login + código</span>
  <span class="chip-arrow"><IconArrow /></span>
  <span class="chip"><b>3</b> Foto de perfil</span>
  <span class="chip-arrow"><IconArrow /></span>
  <span class="chip"><b>4</b> Decisão</span>
  <span class="chip-arrow"><IconArrow /></span>
  <span class="chip"><b>5</b> Exportar</span>
</div>

<!--
[DEMO] Preparação (faça antes): API e front-end rodando, .env com MONGODB_URI, CLOUDINARY_* e SMTP_*; pnpm prisma:deploy aplicado;
abas abertas: Atlas (Browse Collections), Cloudinary (Media Library), caixa de e-mail.
Roteiro:
1. /register: crie a conta. Atlas → coleção users → mostre o passwordHash (A, E).
2. Saia e entre em /login: a tela pede o código; pegue-o no e-mail (G).
3. /profile: envie a foto; abra a URL do Cloudinary e mostre avatarUrl no Atlas (B).
4. Crie uma decisão na página inicial.
5. Clique em "Exportar" e abra o CSV (H).
6. Terminal: curl com Origin: https://evil.com e sem o cabeçalho de CORS (F).
7. Terminal: pnpm test (C). Abra o README e o /reference (D).
Plano B: se o e-mail não chegar, use o código escrito no log da API. Se a nuvem falhar, mostre os testes e o README.
-->

---
layout: end
title: Encerramento
transition: push | push-back
---

<h1 class="mega">Dados em nuvem. Acesso em duas etapas.<br><em>Tudo verificável.</em></h1>

<p class="lead">Mesmo ciclo de decisões. Agora pronto para ser confiado.</p>

<a class="repo-link" href="https://github.com/mariolucass/echoes" target="_blank" rel="noopener noreferrer">github.com/mariolucass/echoes <IconArrow /></a>

<!--
[FECHAMENTO] Resuma em uma frase: "O Echoes passou de uma API funcional para uma API que protege e prova o que faz."
Convide as perguntas.
-->

---
layout: end
eyebrow: Perguntas
title: Perguntas
transition: pan | pan-back
---

# Perguntas

<p class="lead">Qual requisito você quer ver de novo?</p>

<!--
Respostas curtas:
- "Por que não todo o banco no Mongo?" Migração parcial deliberada: o PostgreSQL garante transações, chaves compostas e o trigger de imutabilidade do snapshot. Usuários no Atlas cumprem A com baixo risco.
- "Por que Vitest e não Jest?" API compatível; já era o runner do projeto e é mais rápido com TypeScript ESM. Migrar é mecânico.
- "O código do 2FA fica salvo?" Não: o desafio JWT carrega apenas um HMAC; o código vai por e-mail.
- "O CORS quebra o front?" Não: o Next chama a API pelo servidor, sem CORS no navegador.
- "A senha pode ser recuperada?" Não: scrypt é de uma via; só se verifica.
-->
