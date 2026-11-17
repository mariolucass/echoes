# Divisão de tarefas — Seminário

Requisitos do professor (A–H) divididos entre os dois integrantes da dupla.
Cada integrante é dono de um conjunto de itens e das pastas/arquivos listados, para evitar conflito de merge.

| Item | Requisito | Responsável |
| ---- | --------- | ----------- |
| A | Armazenar os dados com MongoDB em nuvem (Atlas) | Mario |
| B | Salvar imagem em nuvem (Cloudinary/S3 etc.) | Mario |
| C | Testes automatizados para todas as rotas | João Marcos |
| D | Documentar a API no README.md | João Marcos |
| E | Criptografar a senha do usuário no banco | João Marcos |
| F | Configurar CORS (apenas o mesmo servidor) | João Marcos |
| G | Segundo fator de segurança (código por SMS ou e-mail) | Mario |
| H | Botão/endpoint "Exportar" (CSV) | João Marcos |

---

## Mario — A, B, G

### A. MongoDB em nuvem
- Criar cluster no MongoDB Atlas e configurar `MONGODB_URI` em `.env` / `.env.example`.
- Substituir a camada de persistência (hoje Prisma + PostgreSQL) por MongoDB.
- Ajustar `src/database/`, `prisma/` e os `services/` para usar a nova conexão.
- Garantir que a aplicação sobe e todas as rotas existentes continuam funcionando.

**Arquivos:** `src/database/*`, `src/config/env.ts`, `src/services/**`, `docker-compose*.yml`.

### B. Imagem em nuvem
- Escolher o provedor (ex.: Cloudinary) e configurar as credenciais no `.env`.
- Criar rota de upload (ex.: foto de perfil do usuário) recebendo `multipart/form-data`.
- Salvar no banco apenas a URL retornada pelo provedor.

**Arquivos:** `src/services/storage/*` (novo), rota de upload em `src/routes/identity/user.routes.ts`.

### G. Segundo fator (2FA)
- No login, após validar a senha, gerar um código de 6 dígitos com expiração curta.
- Enviar o código por e-mail (ou SMS) e criar a rota `POST /auth/verify-2fa`.
- Só emitir o token JWT depois da verificação do código.

**Arquivos:** `src/services/identity/auth.service.ts`, `src/routes/identity/auth.routes.ts`, `src/middlewares/auth/*`, serviço de envio (novo).

---

## João Marcos — C, D, E, F, H

### C. Testes automatizados (todas as rotas)
- Cobrir com testes cada rota em `src/routes/` (identity, decisions, classification, learning, tracking, system): caso de sucesso e casos de erro (400/401/404).
- Atenção: o projeto usa **Vitest** (API compatível com Jest: `describe`, `it`, `expect`, `vi`). Se o professor exigir Jest literalmente, avisar a dupla antes de começar.
- Manter os testes em `tests/api/` e `tests/unit/`; rodar com `pnpm test`.
- Entregar uma lista/tabela de rotas × testes para provar a cobertura total.

**Arquivos:** `tests/**`, `vitest.config.ts`.

### D. Documentação no README.md
- Descrever o projeto, stack, como instalar e rodar, variáveis de ambiente.
- Documentar todas as rotas: método, caminho, autenticação, corpo da requisição, resposta e códigos de erro (com exemplos).
- Incluir seções de CORS, 2FA, upload de imagem e exportação CSV quando esses itens estiverem prontos.

**Arquivos:** `README.md`.

### E. Criptografar a senha
- Revisar `src/utils/password.ts` (já usa hash `scrypt` com salt) e confirmar que o cadastro e o login usam essa função.
- Garantir que a senha em texto puro nunca é salva nem aparece em logs ou respostas.
- Escrever testes para `hashPassword` / `verifyPassword` e mostrar no seminário um registro do banco com o hash.

**Arquivos:** `src/utils/password.ts`, `src/services/identity/auth.service.ts`, `tests/unit/**`.

### F. CORS
- Ajustar `src/config/cors.ts` para aceitar apenas a origem do próprio servidor (origem configurável via `.env`).
- Testar: requisição da origem permitida passa; de outra origem é bloqueada.

**Arquivos:** `src/config/cors.ts`, `src/bootstrap/middlewares.ts`, `tests/api/**`.

### H. Exportar (CSV)
- Criar endpoint `GET /export/csv` (ou similar) autenticado, que retorna alguns dados do banco (ex.: decisões do usuário) com `Content-Type: text/csv` e `Content-Disposition: attachment`.
- Escapar corretamente vírgulas, aspas e quebras de linha.
- Se houver front-end, ligar ao botão "Exportar"; senão, documentar o endpoint e demonstrar no seminário.

**Arquivos:** `src/routes/system/export.routes.ts` (novo), `src/export/csv.export.ts` (novo).

---

## Ordem sugerida e dependências

1. **Início (em paralelo):** Mario começa A; João Marcos começa E, F e D (estrutura do README).
2. **Depois de A pronto:** Mario faz B e G; João Marcos faz H e escreve os testes (C).
3. **Final:** João Marcos completa o README (D) com as rotas novas; os dois ensaiam a apresentação.

## Apresentação

Cada um apresenta e demonstra os itens pelos quais é responsável (A, B, G / C, D, E, F, H).
