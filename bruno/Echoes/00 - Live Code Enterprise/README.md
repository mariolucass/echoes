# Roteiro Live Code Enterprise — Apresentação da API Echoes

Este fluxo foi desenhado especialmente para apresentações executivas e técnicas em **Deploy de Produção (Render)** com PostgreSQL dedicado.

---

## 🎯 Caso de Uso Corporativo (Demo)
> **Decisão Real de Engenharia / Liderança:**  
> *"Migração da Infraestrutura de Relatórios para Microsserviço de Leitura"*  
> **Problema Real:** Fechamentos fiscais com queries lentas (baseline: **12 segundos**).  
> **Meta Congelada no Commit:** Executar em **≤ 5 segundos**.  
> **Resultado Medido em Produção:** **9 segundos** (melhoria real de 25%, porém classificado honestamente como `NOT_MET` por ficar +4s acima da meta contratada).

---

## 🚀 Como Executar no Bruno

1. **Selecione o Environment:**
   - No canto superior direito do Bruno, altere de `Echoes` (localhost) para `Render (Production)`.
   - Edite a variável `baseUrl` no environment caso sua URL no Render seja personalizada (ex.: `https://sua-api.onrender.com`).

2. **Execute a pasta `00 - Live Code Enterprise` em sequência:**

| Passo | Requisição | O que demonstra ao vivo |
|---|---|---|
| **01** | `01 - POST - Register Enterprise Admin` | Criação de conta corporativa isolada. Armazena `token` e `refreshToken` automaticamente. |
| **02** | `02 - POST - Login Enterprise` | Sessão com rotação de token scrypt/JWT. |
| **03** | `03 - POST - Create Decision (Draft)` | Rascunho com contexto de negócio. Captura `decisionId`. |
| **04** | `04 - POST - Add Alternative` | Registro de alternativas técnicas (prós e contras ponderados). |
| **05** | `05 - POST - Add Metric (SLA)` | Métrica de SLA (`Tempo de Geração`, unidade `s`). |
| **06** | `06 - POST - Add Measurable Expectation` | Contrato numérico com meta imutável: operador `LTE`, baseline `12.0000`, target `5.0000`. |
| **07** | `07 - POST - Commit Decision` | **MOMENTO-CHAVE:** O commit congela a decisão com trigger PostgreSQL e gera a primeira revisão imutável. Status muda para `ACTIVE`. |
| **08** | `08 - GET - Verify Immutable Snapshot` | Demonstra que o snapshot em JSONB com `schemaVersion` está gravado e protegido contra alterações no banco. |
| **09** | `09 - POST - Create Audit Checkpoint` | Agendamento de checkpoint datado para auditoria da entrega. |
| **10** | `10 - POST - Record Production Measurement` | Telemetria do Render gravando medição datada de `9.0000 s`. |
| **11** | `11 - POST - Review Decision & Honest Outcome` | Fechamento do ciclo: avaliação humana honesta (`NOT_MET` mesmo com 25% de ganho), notas de reflexão e score de arrependimento. Status muda para `COMPLETED`. |
| **12** | `12 - GET - Download Decision Audit Report (PDF)` | Gera e baixa em tempo real o PDF executivo com a régua visual, tabela de expectativas e histórico inviolável da decisão. |
| **13** | `13 - GET - Download Global Executive Overview (PDF)` | Relatório corporativo consolidado com panorama de todas as decisões da organização. |
| **14** | `14 - GET - System Audit & Request Logs` | Auditoria completa com `requestId`, tempo de resposta e conformidade de segurança. |

---

## 🛡️ Dica para a Apresentação
- Todas as requisições utilizam variáveis de runtime dinâmicas (`{{decisionId}}`, `{{metricId}}`, `{{expectationId}}`, etc.), ou seja, **você não precisa copiar e colar nenhum ID manualmente**. Basta clicar em `Send` uma por uma.
- Ao rodar o passo 12, abra o PDF gerado diretamente para impactar a banca/diretoria com o design editorial do relatório do Echoes.
