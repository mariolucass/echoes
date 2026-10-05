# Arquitetura de testes

Os testes ficam fora de `src` para não entrarem no build da API. Organize cada teste pelo limite que ele exercita e depois pelo domínio.

| Pasta                   | Escopo                                          | Dependências                                |
| ----------------------- | ----------------------------------------------- | ------------------------------------------- |
| `unit/<domínio>`        | Regras, serviços, transformadores e eventos     | Fakes locais, sem banco                     |
| `api/<domínio>`         | Rotas Hono, validação, autenticação e respostas | `app.request()` com persistência controlada |
| `integration/<domínio>` | Repositórios, Prisma, transações e constraints  | PostgreSQL exclusivo de teste               |
| `e2e/<domínio>`         | Jornada completa pela API                       | Aplicação e PostgreSQL reais                |
| `support`               | Builders, fakes, HTTP e ciclo de vida do banco  | Compartilhar somente abstrações estáveis    |

## Comandos

```sh
pnpm test                 # unit + api, sem PostgreSQL
pnpm test:unit
pnpm test:api
pnpm test:typecheck
```

Para os testes com banco, copie o valor de `.env.test.example` para a variável de ambiente `ECHOES_TEST_DATABASE_URL` no seu shell. Inicie o Docker e execute:

```sh
pnpm test:db:up
pnpm test:db             # aplica migrations; roda integration e depois e2e
pnpm test:db:down
```

`pnpm test:integration` e `pnpm test:e2e` executam as camadas separadamente. O script define `DATABASE_URL` a partir de `ECHOES_TEST_DATABASE_URL`, define `NODE_ENV=test` e rejeita URLs cujo nome de banco não termine em `_test`. O Compose de testes usa o projeto `echoes-test`, porta 5433 e armazenamento temporário. A limpeza de dados é permitida apenas após a mesma validação.

## Convenções

- Nomeie o arquivo pelo comportamento ou componente, com `.test.ts`.
- Crie os dados necessários no próprio teste. Use builders para valores padrão e altere somente o que o cenário exige.
- Use fakes de repositório e de eventos nos testes de serviço. Para verificar queries, transações ou constraints, use `integration` com banco real.
- Em `api`, use `app.request()` e verifique status, corpo e efeitos observáveis. Evite repetir detalhes internos do Prisma que já são verificados em `integration`.
- Restaure spies, relógio e variáveis de ambiente após cada teste. Não compartilhe estado mutável entre arquivos.
- Mantenha poucos fluxos `e2e`, cobrindo jornadas críticas. Não deixe dependências ausentes gerarem `skip` silencioso.
- A suíte padrão deve ser rápida. Execute `pnpm test:db` no CI após iniciar o serviço PostgreSQL de teste.

Os projetos `unit` e `api` recebem uma URL de banco inválida no `setupFiles`. Se um mock faltar, o teste falha em vez de acessar o banco de desenvolvimento.

Os arquivos migrados mantêm seus cenários atuais. Ao ampliar a cobertura, prefira extrair testes compostos por assuntos diferentes para arquivos específicos do domínio e da camada.
