# Echoes

Echoes é uma API para registrar decisões, acompanhar suas consequências ao longo do tempo e comparar expectativas com resultados reais.

A proposta do projeto é permitir que decisões sejam revisitadas posteriormente, relacionando o que era esperado no momento da escolha com aquilo que realmente aconteceu.

## Stack

- TypeScript
- Node.js
- Hono
- Prisma ORM
- PostgreSQL
- pnpm
- Docker

## Arquitetura

O projeto utiliza uma organização em camadas, mantendo responsabilidades separadas e permitindo que a aplicação evolua sem concentrar regras de negócio em controllers ou rotas.

```text
prisma/
src/
├── config/
├── contexts/
├── controllers/
├── database/
├── docs/
├── errors/
├── events/
├── helpers/
├── interfaces/
├── middlewares/
├── projections/
├── repositories/
├── routes/
├── schemas/
├── services/
├── subscribers/
├── tests/
├── transformers/
└── utils/
```

A estrutura poderá evoluir conforme novos domínios e funcionalidades forem adicionados ao projeto.

---

## Requisitos

Para executar o projeto localmente:

- Node.js `22.12+` ou `24.x`
- pnpm `12.6.0`
- Docker
- PostgreSQL

---

## Configuração

Clone o repositório e instale as dependências:

```sh
pnpm install
```

Crie o arquivo `.env` a partir do `.env.example`.

```sh
cp .env.example .env
```

Configure as variáveis necessárias, principalmente:

```env
DATABASE_URL=
JWT_SECRET=
CORS_ALLOWED_ORIGINS=
```

`JWT_SECRET` deve possuir uma chave aleatória segura com pelo menos 32 bytes.

Em produção, configure `CORS_ALLOWED_ORIGINS` com as origens permitidas separadas por vírgula.

---

## Banco de dados

O PostgreSQL pode ser iniciado através do Docker:

```sh
docker compose up -d
```

Para aplicar as migrations existentes em desenvolvimento:

```sh
pnpm exec prisma migrate dev
```

O Prisma Client é gerado automaticamente antes dos comandos `dev` e `build`.

Após modificar qualquer model do Prisma durante o desenvolvimento, execute:

```sh
pnpm prisma:generate
```

---

## Executando o projeto

Inicie o servidor em modo de desenvolvimento:

```sh
pnpm dev
```

---

# Prisma

O Echoes utiliza **Prisma 7.10.0** com o schema organizado em múltiplos arquivos.

O arquivo:

```text
prisma.config.ts
```

é responsável por indicar a localização dos schemas, carregar as variáveis de ambiente e configurar migrations e conexão com o banco.

O arquivo principal:

```text
prisma/schema.prisma
```

mantém apenas as configurações globais do Prisma, como `generator` e `datasource`.

Os models e enums ficam separados por domínio.

```text
prisma/
├── schema.prisma
├── domains/
│   ├── identity/
│   │   └── User
│   │
│   ├── decisions/
│   │   ├── Decision
│   │   ├── Expectation
│   │   └── DecisionStatus
│   │
│   ├── tracking/
│   │   ├── Checkpoint
│   │   ├── Metric
│   │   └── MetricMeasurement
│   │
│   ├── learning/
│   │   ├── Outcome
│   │   ├── Reflection
│   │   └── ExpectationAssessment
│   │
│   └── classification/
│       ├── Tag
│       └── DecisionTag
│
└── migrations/
```

Essa organização utiliza o recurso de **multi-file schema** do Prisma.

Ela não deve ser confundida com múltiplos schemas do PostgreSQL utilizando `@@schema`. Aqui, os arquivos são separados apenas para melhorar a organização do modelo de dados da aplicação.

---

## Prisma Client

O generator `prisma-client` gera o client TypeScript em:

```text
src/generated/prisma/
```

Esse diretório é gerado automaticamente e não é versionado pelo Git.

A aplicação utiliza:

```text
@prisma/adapter-pg
```

para conexão com PostgreSQL.

---

## Comandos do Prisma

Formatar os schemas:

```sh
pnpm prisma:format
```

Validar o modelo:

```sh
pnpm prisma:validate
```

Gerar o Prisma Client:

```sh
pnpm prisma:generate
```

Os comandos `pnpm dev` e `pnpm build` geram o client apenas quando ele não existe ou quando mudam os schemas, a configuração do Prisma ou as dependências. `pnpm prisma:generate` força a geração manualmente.

Criar uma migration em desenvolvimento:

```sh
pnpm prisma:migrate --name descricao_da_alteracao
```

Aplicar migrations versionadas:

```sh
pnpm prisma:deploy
```

Durante o desenvolvimento utilize `migrate dev`.

Em ambientes de produção utilize `migrate deploy`.

> Não utilize `--schema prisma/schema.prisma` nos comandos do Prisma, pois isso pode fazer com que apenas o arquivo principal seja considerado e os schemas dos domínios sejam ignorados.

A CLI necessita de `DATABASE_URL` para operações relacionadas ao banco de dados. Operações como formatar, validar e gerar o client não precisam de uma conexão ativa.

---

## Modelo de domínio

A estrutura inicial gira em torno de uma `Decision`.

```text
User
 └── Decision
      ├── Expectation
      ├── Checkpoint
      ├── Metric ── MetricMeasurement
      ├── Outcome
      ├── Reflection
      ├── ExpectationAssessment
      └── DecisionTag ── Tag
```

De forma simplificada:

```text
Decisão
   ↓
Expectativas
   ↓
Acompanhamento
   ↓
Resultados
   ↓
Reflexão
```

Uma decisão pode possuir expectativas iniciais, métricas com medições ao longo do tempo, checkpoints e resultados observados posteriormente. `ExpectationAssessment` vincula uma expectativa a um resultado da mesma decisão.

Pontuações de checkpoint e reflexão usam a faixa de 0 a 10. Impactos esperado e observado usam a faixa de -10 a +10, com duas casas decimais. Essas faixas são protegidas por constraints no PostgreSQL.

Tags são privadas por usuário. Decisões usam exclusão lógica: `deletedAt` marca a exclusão e mantém o histórico relacionado no banco.

Esse histórico permite comparar aquilo que o usuário esperava com aquilo que efetivamente ocorreu.

A evolução planejada do modelo de dados está documentada em:

```text
docs/data-model.md
```

---

## Autenticação

A API utiliza tokens JWT assinados com `jose` através do algoritmo `HS256`.

As operações estão centralizadas em:

```text
src/utils/jwt.ts
```

Principais funções:

```ts
signAccessToken(userId)
verifyAccessToken(token)
```

Os access tokens possuem validade de **1 hora**.

O registro e o login emitem tokens JWT válidos por uma hora:

```http
POST /identity/auth/register
Content-Type: application/json

{"name":"Lucas","email":"lucas@example.com","password":"uma-senha-segura"}
```

```http
POST /identity/auth/login
Content-Type: application/json

{"email":"lucas@example.com","password":"uma-senha-segura"}
```

Registro e login retornam `user` (sem senha ou hash) e `session`:

```json
{
  "user": {
    "id": "fa8e66e7-ef11-4054-83cb-c82e6cae4b7c",
    "name": "Lucas",
    "email": "lucas@example.com",
    "createdAt": "2026-09-27T02:17:38.817Z"
  },
  "session": {
    "accessToken": "<accessToken>",
    "refreshToken": "<refreshToken>",
    "tokenType": "Bearer",
    "accessTokenExpiresAt": "2026-09-27T03:17:38.000Z",
    "refreshTokenExpiresAt": "2026-10-04T02:17:38.000Z"
  }
}
```

O registro responde com `201` e o login com `200`. As datas de expiração
correspondem ao `exp` dos respectivos tokens JWT.
E-mails são armazenados em letras minúsculas. Senhas têm de
8 a 128 caracteres e são armazenadas com `scrypt` e salt aleatório.

Quando o access token expirar, envie o refresh token no corpo da requisição:

```http
POST /identity/auth/refresh
Content-Type: application/json

{"refreshToken":"<refreshToken>"}
```

A resposta contém `user` e uma nova `session` com `accessToken`, `refreshToken`
e suas datas de expiração. Substitua
ambos os tokens no cliente: cada refresh token pode ser usado uma única vez e
expira após 7 dias. O servidor armazena somente o hash do refresh token. Um
token expirado, já usado ou do tipo access retorna `401`.

Use o token em rotas protegidas:

```http
GET /identity/auth/me
Authorization: Bearer <accessToken>
```

O e-mail duplicado retorna `409`; credenciais incorretas retornam `401`;
entrada inválida retorna `422`. As rotas de registro, login e refresh têm limite de
20 tentativas por IP a cada 15 minutos, além do limite global da API.

### Respostas de erro da autenticação

As entradas são validadas pelos middlewares do domínio `middlewares/auth`
antes das consultas ao banco e novamente pelas rotas OpenAPI. O registro usa
`ensureEmailAvailable`; o login usa `verifyCredentials`; o refresh usa
`verifyRefreshToken`; e `/me` usa `authenticate` seguido de
`requireExistingUser`. Esses middlewares lançam erros da aplicação ou do Zod.
Conflitos de unicidade que ocorram entre a consulta e a criação também viram
`409` no serviço. Todos chegam ao `app.onError(errorHandler)`
registrado em `app.ts`, que produz o mesmo formato JSON:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password.",
    "requestId": "...",
    "timestamp": "2026-09-26T12:00:00.000Z"
  }
}
```

O campo `requestId` aparece quando a requisição passa pelo middleware global;
`details` aparece quando o erro inclui detalhes públicos. Os blocos `responses`
em `auth.routes.ts` documentam os códigos e esse formato no `/doc`; eles não
enviam a resposta por conta própria.

---

## Fluxo de decisão

### Transformação de dados e eventos

As consultas Prisma em `src/projections/` definem os campos e relações carregados.
As funções em `src/transformers/decisions/` convertem esses dados para o contrato
HTTP e montam o snapshot versionado da confirmação. Datas saem em ISO 8601 e
valores decimais permanecem como strings.

Após a transação de confirmação ou revisão terminar, `DecisionService` publica
um evento tipado em `src/events/`. O subscriber registrado na inicialização do
servidor grava um log estruturado com IDs, estado e horário, sem textos da decisão.
O barramento é local ao processo: seus eventos servem a efeitos não críticos e
não são persistidos para reprocessamento. Efeitos que precisem sobreviver a uma
queda do processo devem usar uma outbox gravada na mesma transação da decisão.

Toda rota abaixo exige `Authorization: Bearer <accessToken>`. O acesso é restrito ao dono da decisão; IDs inexistentes, de outro usuário ou excluídos retornam `404`. Estado incompatível retorna `409`; corpo inválido ou referência a recurso de outra decisão retorna `422`.

| Etapa | Endpoint | Campos principais | Resposta |
| --- | --- | --- | --- |
| Criar rascunho | `POST /decisions` | `title`, `description?`, `context?` | `201`, `id`, `status: DRAFT` |
| Registrar opção | `POST /decisions/:id/alternatives` | `title`, `description?`, `pros?`, `cons?` | `201`, `id` |
| Definir métrica | `POST /decisions/:id/metrics` | `name`, `unit?` | `201`, `id` |
| Definir expectativa | `POST /decisions/:id/expectations` | `description`, `expectedImpact?`, `targets?` | `201`, `id` |
| Confirmar escolha | `POST /decisions/:id/commit` | `chosenAlternativeId`, `rationale` | `200`, `status: ACTIVE`, `revisionId` |
| Registrar revisão | `POST /decisions/:id/reviews` | `outcome`, `measurements?`, `assessments`, `reflection?`, `complete?` | `201`, IDs criados e estado |
| Consultar histórico | `GET /decisions/:id` | — | `200`, decisão e relações |

Uma meta em `targets` tem `metricId`, `operator` (`GTE`, `LTE` ou `EQ`), `targetValue`, e opcionalmente `baselineValue` e `evaluateAt` (data ISO 8601). Valores de métricas e metas são strings decimais de até quatro casas, por exemplo `"12000.00"`. Impactos são números entre `-10` e `10`, com até duas casas. Para confirmar, a decisão precisa ter ao menos uma alternativa e uma expectativa; a alternativa escolhida deve pertencer à decisão. A confirmação cria `DecisionRevision` versão 1, um snapshot imutável da escolha e das condições iniciais, na mesma transação que muda o estado para `ACTIVE`.

Em `POST /decisions/:id/reviews`, `outcome` recebe `description`, `impact?` e `occurredAt?`. Cada medição recebe `metricId`, `value`, `recordedAt?` e `notes?`. Cada avaliação recebe `expectationId`, `result` (`MET`, `PARTIALLY_MET`, `NOT_MET` ou `INCONCLUSIVE`) e `notes?`. `reflection` recebe `content`, `satisfactionScore?` e `regretScore?` (0 a 10). Com `complete: true`, todas as expectativas da decisão precisam ter avaliação e deve existir uma reflexão. A revisão e a mudança de estado são atômicas.

Decisões criadas antes desta evolução permanecem com seus estados e dados originais. Não se cria um snapshot retroativo sem informação sobre as alternativas e a escolha.

## Endpoints atuais

### Health check

```http
GET /health
```

Retorna `200` quando PostgreSQL, a configuração de autenticação e a gravação dos logs de requisição estão disponíveis; caso contrário, retorna `503` com `status: "degraded"`. O JSON inclui o resultado de cada verificação, tempo da consulta ao banco, horário UTC, ambiente, tempo de atividade, versão do Node.js e uso de memória do processo. Erros internos e segredos não são expostos. A consulta ao banco tem limite de 3 segundos e a resposta não é armazenada em cache. A restrição de acesso aos dias úteis também se aplica a esta rota.

### Listar decisões

```http
GET /decisions
```

Requer autenticação:

```http
Authorization: Bearer <token>
```

Aceita `page` (padrão `1`, máximo `100`) e `limit` (padrão `12`, máximo `48`). Valores informados fora dessas faixas ou com formato inválido retornam `422`. A resposta contém somente decisões não excluídas do usuário autenticado, ordenadas da mais recente para a mais antiga:

```json
{
  "data": [],
  "meta": { "totalItems": 0, "totalPages": 0 },
  "links": { "self": "/decisions?page=1", "next": null, "prev": null }
}
```

### Excluir uma decisão

```http
DELETE /decisions/:id
Authorization: Bearer <token>
```

Responde `204` após marcar `deletedAt`; as expectativas, medições e reflexões permanecem no banco. IDs inválidos retornam `422`. Uma decisão inexistente, de outro usuário ou já excluída retorna `404`.

### Gerenciar alternativas de uma decisão

Todas as operações exigem autenticação e uma decisão não excluída do usuário autenticado.

| Operação | Endpoint | Resposta |
| --- | --- | --- |
| Cadastrar | `POST /decisions/:id/alternatives` | `201`, alternativa criada |
| Listar | `GET /decisions/:id/alternatives` | `200`, array de alternativas |
| Buscar pelo código | `GET /decisions/:id/alternatives/:alternativeId` | `200`, alternativa |
| Excluir | `DELETE /decisions/:id/alternatives/:alternativeId` | `204`, sem corpo |

`id` é o UUID da decisão e `alternativeId` é o UUID da alternativa.
O cadastro recebe `title` obrigatório e `description`, `pros` e `cons` opcionais.
Cadastro e exclusão exigem `DRAFT`; outros estados retornam `409`.
A exclusão é definitiva e usa a mesma transação com bloqueio da decisão usada no cadastro e na confirmação.

A listagem não possui paginação: retorna as alternativas em ordem crescente de
`createdAt`, com desempate por `id`, ou `[]` quando não há alternativas.
Cada objeto contém `id`, `title`, `description`, `pros`, `cons` e `createdAt` em ISO 8601.
Consultas continuam disponíveis após a confirmação.
Recursos inexistentes, inacessíveis ou alternativas vinculadas a outra decisão retornam `404`
(em exclusões de decisões fora de `DRAFT`, a verificação do estado ocorre primeiro).
Parâmetros inválidos nas novas rotas retornam `400`; token ausente ou inválido retorna `401`.

### Consultar requisições por data

```http
GET /request-logs?date=2026-09-25
Authorization: Bearer <token>
```

`date` é obrigatória no formato `YYYY-MM-DD`. A consulta considera o dia em UTC e retorna `{ "date": "...", "logs": [...] }`. Cada registro contém `timestamp` em ISO 8601 UTC, `method` e `route` (caminho sem query string). Requisições recusadas e rotas inexistentes também são registradas.

Os registros são gravados em `data/request-logs.jsonl`, criado automaticamente e ignorado pelo Git. O processo precisa de permissão de escrita nesse diretório. Para executar várias instâncias ou preservar os registros entre substituições de containers, monte um volume compartilhado ou troque a implementação de `RequestLogRepository` por armazenamento centralizado.

### Baixar lista de decisões em PDF

```http
GET /decisions/report.pdf
Authorization: Bearer <token>
```

Retorna `application/pdf` como anexo `decisions.pdf`. O relatório contém a página solicitada de decisões do usuário autenticado e aceita os mesmos parâmetros `page` e `limit` da listagem.

### Acesso em dias úteis

Todas as rotas aceitam requisições apenas de segunda a sexta. Aos sábados e domingos a API responde com `403`. O dia é calculado no fuso definido por `API_TIME_ZONE` (padrão: `America/Sao_Paulo`); o horário registrado continua em UTC.

---

### Rotas dos demais domínios

Todas as rotas abaixo exigem `Authorization: Bearer <accessToken>`. A consulta por `decisionId` aceita apenas decisões do usuário autenticado que não foram excluídas. IDs de recursos de outro usuário retornam `404`.

| Domínio | Rotas |
| --- | --- |
| Tracking | `GET/POST /tracking/checkpoints`, `GET/PATCH/DELETE /tracking/checkpoints/:id`, `GET /tracking/metrics`, `GET /tracking/metrics/:id`, `GET/POST /tracking/metrics/:id/measurements` |
| Learning | `GET /learning/outcomes`, `GET /learning/outcomes/:id`, `GET /learning/outcomes/:id/assessments`, `GET /learning/reflections`, `GET /learning/reflections/:id` |
| Classification | `GET/POST /classification/tags`, `PATCH/DELETE /classification/tags/:id`, `GET /decisions/:id/tags`, `PUT/DELETE /decisions/:id/tags/:tagId` |
| Identity | `PATCH /identity/users/me` |

As listagens de tracking e learning exigem `?decisionId=<uuid>`. Checkpoints podem ser criados e alterados enquanto a decisão está em `DRAFT` ou `ACTIVE`; medições avulsas exigem `ACTIVE`. Resultados, avaliações e reflexões são criados juntos pela rota de revisão da decisão. A atualização de perfil aceita somente `name`.

A coleção em `bruno/Echoes` contém exemplos para todas essas rotas. Registre ou faça login, crie uma decisão, adicione alternativa, métrica e expectativa, confirme a escolha, crie checkpoint e medição, e então registre a revisão. As requisições salvam os IDs retornados como variáveis de execução para as próximas etapas.

---

## Segurança e infraestrutura

A API possui algumas configurações básicas de proteção.

### Rate limiting

Cada IP pode realizar até:

```text
100 requisições / 15 minutos
```

### Compressão

As respostas HTTP são comprimidas quando aplicável.

### Proxy

Caso a aplicação seja executada atrás de um proxy confiável, configure:

```env
TRUST_PROXY_HOPS=
```

O valor representa a quantidade de proxies existentes entre o cliente e a aplicação.

---

## Migrations

As migrations estão em `prisma/migrations/`, incluindo constraints, medições, avaliações, tags privadas e exclusão lógica. Versione esse diretório junto com os schemas Prisma. A migration de tags exige tratamento manual para tags sem decisões e para e-mails que colidiriam após normalização; consulte `docs/data-model.md` antes de aplicá-la em um banco com dados.

Para um banco novo, aplique o histórico existente:

```sh
pnpm exec prisma migrate dev
```

Caso o projeto seja conectado a um banco que já possua tabelas e dados, deverá ser realizado um **baseline** antes que o Prisma Migrate passe a gerenciar esse banco.

---

## Documentação

Documentação sobre a evolução do modelo:

```text
docs/data-model.md
```

Referências utilizadas para a configuração do Prisma:

- [Prisma ORM — Upgrade para Prisma 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)
- [Prisma Schema — Multi-file schema](https://www.prisma.io/docs/orm/prisma-schema/overview/location)

---

## Status

O Echoes está em desenvolvimento.

A estrutura base da API e do banco de dados já está preparada para a implementação dos principais fluxos do domínio:

```text
Decision → Expectation → Checkpoint → Outcome → Reflection
```
