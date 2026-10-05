# Domínios e evolução dos modelos

## Organização atual

| Domínio | Modelos | Responsabilidade |
| --- | --- | --- |
| `identity` | `User` | Identidade e titularidade das decisões. |
| `decisions` | `Decision`, `DecisionAlternative`, `DecisionRevision`, `Expectation`, `ExpectationTarget`, `DecisionStatus` e `TargetOperator` (enums) | Rascunho, escolha, versão inicial e metas das expectativas. |
| `tracking` | `Checkpoint`, `Metric`, `MetricMeasurement` | Revisões programadas e séries de medições. |
| `learning` | `Outcome`, `Reflection`, `ExpectationAssessment` | Resultados observados e comparação com expectativas. |
| `classification` | `Tag`, `DecisionTag` | Tags privadas e vínculos limitados ao mesmo usuário. |

Os arquivos se relacionam pelos nomes dos modelos, sem imports. Cada modelo ou
enum deve ser declarado uma única vez em `prisma/domains/`. A organização física
dos arquivos não cria isolamento de acesso entre domínios.

## Regras implementadas

- `Decision` nasce em `DRAFT`. A confirmação exige alternativa escolhida e ao menos uma expectativa, registra justificativa e data da escolha e muda para `ACTIVE`. A revisão pode concluí-la (`COMPLETED`) após avaliar todas as expectativas e registrar reflexão. Os endpoints de rascunho só aceitam `DRAFT`; o de revisão aceita `ACTIVE`.
- `Decision.chosenAlternativeId` tem FK composta com o ID da decisão, impedindo selecionar uma alternativa de outra decisão. `DecisionRevision` versão 1 guarda em JSONB título, contexto, opção escolhida, justificativa, alternativas, métricas, expectativas e metas. Um trigger impede `UPDATE` e `DELETE` da revisão. A confirmação e a inserção do snapshot ocorrem na mesma transação.
- `ExpectationTarget` vincula uma expectativa a uma métrica da mesma decisão por duas FKs compostas. `operator` é `GTE`, `LTE` ou `EQ`; `targetValue` e `baselineValue` são `Decimal(18,4)`. O par `(expectationId, metricId)` é único.

- `Checkpoint.score`, `Reflection.satisfactionScore` e `Reflection.regretScore`: inteiros de 0 a 10, ou `NULL` quando ainda não avaliados.
- `Expectation.expectedImpact` e `Outcome.impact`: escala assinada de -10 a +10, com até duas casas decimais. Sinal negativo representa efeito desfavorável; positivo, favorável. `NULL` significa não avaliado.
- `MetricMeasurement.value`: `Decimal(18,4)` na unidade definida por `Metric.unit`; medições da mesma métrica podem compartilhar o instante `recordedAt` e são ordenadas por `(recordedAt, id)`.
- `ExpectationAssessment.result`: `MET`, `PARTIALLY_MET`, `NOT_MET` ou `INCONCLUSIVE`. Existe no máximo uma avaliação por par expectativa–resultado. Chaves estrangeiras compostas asseguram que ambos pertençam à mesma decisão.
- Título de decisão e descrições obrigatórias não aceitam texto composto apenas por espaços. As regras de faixa e texto são `CHECK` na migration SQL porque o schema Prisma não expressa esses checks diretamente.
- `Decision.deletedAt` registra exclusão lógica. Listagens e relatórios usam somente decisões com `deletedAt IS NULL`; expectativas, resultados e medições permanecem guardados. A chave estrangeira impede a exclusão física de um usuário enquanto ele possuir decisões. A purga física fica reservada a uma futura política explícita de retenção.
- `Tag` pertence a `User`, com nome único por usuário. `DecisionTag` usa chaves estrangeiras compostas para impedir o vínculo de uma tag com a decisão de outro usuário.
- `User.email` é armazenado em minúsculas e sem espaços nas extremidades; a migration verifica colisões antes de normalizar dados antigos e o banco rejeita gravações fora desse formato.

Antes de aplicar a migration corretiva em um banco com dados, revise valores fora das faixas, textos vazios e títulos com mais de 200 caracteres. A conversão de `Float` para `Decimal(4,2)` arredonda impactos com mais de duas casas.

A migration de tags privadas interrompe a aplicação se houver tags globais sem decisões vinculadas, pois não é possível inferir seu dono. Associe-as a uma decisão ou trate-as manualmente antes de aplicar. Uma tag usada por vários usuários é duplicada por dono, com os vínculos preservados. Também corrija e-mails que se tornariam duplicados após normalização.

## Próximos modelos sugeridos

Estas são propostas; ainda não foram adicionadas ao schema ou ao banco.

| Prioridade | Modelo / domínio | Campos iniciais sugeridos | Relações e benefício |
| --- | --- | --- | --- |
| 1 | `DecisionStatusChange` / decisions | `id`, `decisionId`, `fromStatus`, `toStatus`, `reason?`, `createdAt` | Histórico de mudanças de estado. Gravar junto da atualização de `Decision` na mesma transação. |
| 2 | `Reminder` / tracking | `id`, `checkpointId`, `scheduledFor`, `sentAt?`, `status`, `attempts` | Lembretes de checkpoints. Adicionar quando existir um worker de notificações, com política de retries e idempotência. |

`DecisionAlternative`, `DecisionRevision` e `ExpectationTarget` já estão implementados. Decisões antigas permanecem sem versão inicial; a migration não inventa alternativas nem justificativa retroativas.

## Decisões de modelagem antes de expandir

- **Medições:** definir a unidade de cada `Metric` antes de registrar valores; `unit`
  permanece opcional para permitir métricas sem unidade.
- **Alternativa escolhida:** a FK composta garante que pertença à decisão; há uma única escolha na confirmação.
- **Expectativas versus resultados:** a mesma decisão é garantida no banco; os endpoints do fluxo verificam a titularidade da decisão antes de gravar ou consultar recursos filhos.
- **Índices:** a listagem atual tem índices para `(userId, deletedAt, createdAt, id)`, filtro adicional por status e filtro por data da decisão. Verifique os planos com `EXPLAIN ANALYZE` quando houver volume real de dados.
- **Histórico:** definir uma política futura de retenção. A revisão inicial bloqueia a exclusão física da decisão; uma eventual purga precisará de procedimento explícito e auditável.
- **Autorização:** a exclusão lógica e a listagem usam o `userId` autenticado no filtro do banco; os futuros endpoints de tags e recursos filhos devem seguir a mesma regra.

O fluxo de decisão possui endpoints autenticados para criar rascunho, adicionar alternativas, métricas e expectativas, confirmar escolha, registrar revisão e consultar os dados. Todas as operações filtram pela titularidade da decisão e ignoram decisões excluídas logicamente.
