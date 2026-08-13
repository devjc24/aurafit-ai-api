# Roadmap Técnico — Aura IA

**Data:** 12/08/2026  
**Escopo:** evolução futura da Aura IA como serviço de inteligência da Plataforma Aura  
**Princípio:** Produto → AuraHub → Aura IA → Provider → Model  
**Este documento não implementa código** — apenas fases, dependências, riscos e pré-requisitos.

Documentos relacionados:

- `ANALISE_AURA_IA_ARQUITETURA.md`
- `docs/AURAHUB_AI_CONTRACT.md`
- `docs/INTEGRACAO_AURAHUB.md`

---

## Estado atual (baseline)

| Capacidade | Status |
|------------|--------|
| API Express `/api/v1/ai` + legado `/api/ai/chat` | ✅ |
| Config tipada, erros, CORS, rate limit hop | ✅ |
| `ILlmProvider` + OllamaProvider | ✅ |
| Specialists + capabilities + registry | ✅ |
| Logs estruturados (requestId, tenant, specialist…) | ✅ parcial |
| Contrato Hub + DTOs `AIRequest`/`AIResponse` | ✅ |
| M2M Hub↔IA (`x-api-key`) + facade Hub | ✅ |
| Tenant/application context no request | ✅ (assertado pelo Hub) |
| Autorização/licença comercial | ⚠️ Hub (parcial: `ai:read`/`ai:write`; gate de licença feature ainda aberto) |
| Auditoria persistente de uso AI | ❌ (só logs efêmeros) |
| Histórico / conversas | ❌ |
| RAG / tools / agentes | ❌ |
| Multi-provider | ❌ (só Ollama) |
| Observabilidade avançada (custos, tokens/tenant) | ❌ |

```text
Hoje:
  Produto ──► AuraHub (auth, tenant, ai:*) ──► Aura IA (specialist/capability) ──► Ollama

Ainda não:
  memória · RAG · tools · agentes · multi-LLM · métricas de custo
```

---

## Visão por fases

| Fase | Nome | Horizonte | Dependência forte |
|------|------|-----------|-------------------|
| 1 | Fundação | Concluída (baseline) | — |
| 2 | Integração Hub | Em andamento / consolidar | Fase 1 |
| 3 | Memória | Curto–médio | Fase 2 estável |
| 4 | RAG | Médio | Fase 3 (contexto) + política de dados |
| 5 | Tools | Médio–longo | Fase 2 (authz) + 4 (opcional) |
| 6 | Agentes | Longo | Fase 5 |
| 7 | Multi-provider | Paralelo a 4–6 | Fase 1 (`ILlmProvider`) |
| 8 | Observabilidade avançada | Contínuo a partir da 2 | Telemetria mínima na 1–2 |

---

## Fase 1 — Fundação

**Status:** ✅ Concluída (manutenção evolutiva)

### Objetivo

API estável, segura o suficiente para serviço interno, com abstração de provider e plataforma de specialists/capabilities.

### Entregues

- API versionada `/api/v1/ai`
- Segurança básica (Helmet, CORS configurável, validação Zod, error envelope)
- `ILlmProvider` + Ollama
- Specialists (sql, database, nodejs, typescript, crm, devops, docker, linux, git, general)
- Capabilities (`sql.*`, `code.*`, `crm.*`, `database.*`, `logs.*`)
- Logs JSON (requestId, application, tenant, specialist, capability, provider, model, duration, status)
- Sem execução automática de SQL/comandos/código

### Pré-requisitos (operacionais)

- `.env` com `PORT`, `OLLAMA_URL`, `MODEL`
- PM2 com cwd correto / dotenv pelo path do projeto
- Health `GET /` e `GET /health` para CI/CD

### Riscos residuais

| Risco | Mitigação |
|-------|-----------|
| Crash se `.env` ausente | Deploy valida `.env`; dotenv por path absoluto do app |
| Modelo fraco para domínios complexos | Evoluir na Fase 7; specialists não compensam modelo insuficiente |
| Legado `/api/ai/chat` aberto | Deprecar após cutover total via Hub |

### Dependências futuras que esta fase desbloqueia

Fases 2–8 reutilizam provider, registry, envelope e logging.

---

## Fase 2 — Integração AuraHub

**Status:** 🟡 Parcialmente implementada — consolidar em produção

### Objetivo

Aura IA como **serviço interno** consumido só pelo Hub; produtos nunca falam direto com a IA.

### Escopo

| Item | Estado | Notas |
|------|--------|-------|
| AuraHub facade `/api/v1/ai/chat` | ✅ | Client M2M |
| M2M `x-api-key` Hub↔IA | ✅ | Secret compartilhado em env |
| Tenant / company / application no `AIRequest` | ✅ | Assertado pelo Hub |
| Autorização produto (`ai:read` / `ai:write`) | ✅ | Catálogo Hub |
| Gate de licença / feature `aura-ia` | ❌ | Não duplicar na IA; implementar no Hub |
| Auditoria persistente (quem pediu o quê) | ❌ | Hub audit + opcional store na IA |
| Cadastro `GatewayRoute` / rede só interna | ⚠️ | Opcional; preferir rede privada |
| Cutover SIA/AuraFit/CRM → só Hub | ❌ | Remover IAs paralelas (ex.: OpenAI no SIA) |

### Pré-requisitos

1. `AURA_HUB_M2M_API_KEY` (IA) = `AURA_IA_API_KEY` (Hub)
2. `AURA_IA_ENABLED=true` + `AURA_IA_BASE_URL` no Hub
3. API Keys de produto com scopes `ai:*`
4. Política: Aura IA não pública na internet (ou só health público)
5. Decisão de licenciamento: feature global vs capability por plano

### Dependências

- AuraHub auth, tenant UUID, systems, permissions
- Contrato `docs/AURAHUB_AI_CONTRACT.md` estável (evitar breaking sem versão)

### Riscos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Key M2M vazada | Acesso irrestrito à IA | Rotação; rede interna; não expor a produtos |
| Produto chama IA direto | Bypass de licença/tenant | Firewall / M2M obrigatório / deprecar legado |
| Duplicar licença na IA | Drift de regras comerciais | Gate só no Hub |
| Auditoria só em log de arquivo | Sem compliance | Persistência + retenção (Hub e/ou IA) |

### Critérios de saída da Fase 2

- [ ] Produção com M2M ativo e health estável
- [ ] Pelo menos um produto (ex.: SIA) consumindo **apenas** via Hub
- [ ] Gate de licença AI definido e enforce no Hub
- [ ] Trilha de auditoria consultável (mínimo: requestId + tenant + app + capability + status)

---

## Fase 3 — Memória (histórico e conversas)

**Status:** ⚪ Não iniciada

### Objetivo

Preservar contexto multi-turn sem o cliente reenviar todo o histórico ad hoc.

### Escopo sugerido

```text
Conversation
  ├── id, tenantId, application, userId
  ├── specialist / capability default
  └── messages[] (role, content, createdAt, tokens?)
```

- APIs: criar/continuar conversa; listar (com paginação); expirar/arquivar
- Contexto injetado no specialist antes do LLM
- Políticas de retenção e PII por tenant

### Pré-requisitos

- Fase 2 estável (tenant/user confiáveis vindos do Hub)
- Decisão de storage: DB próprio da Aura IA **ou** store no Hub (evitar banco compartilhado sem necessidade — preferir DB da IA ou serviço de memória)
- LGPD / retenção / mascaramento de prompt

### Dependências

- Contrato: estender `AIRequest` com `conversationId` (versionar)
- Specialists devem aceitar `messages[]`, não só `prompt` string

### Riscos

| Risco | Mitigação |
|-------|-----------|
| PII em histórico | Criptografia at-rest; TTL; redaction |
| Contexto estoura janela do modelo | Truncamento / summarization |
| Vazamento cross-tenant | Isolamento obrigatório por `tenantId` em toda query |
| Acoplamento ao Hub DB | Store dedicado na Aura IA |

### Fora de escopo nesta fase

RAG, tools, agentes.

---

## Fase 4 — RAG

**Status:** ⚪ Não iniciada

### Pipeline-alvo

```text
documents → embeddings → retriever → vector store → context → LLM
```

### Objetivo

Respostas fundamentadas em documentação/código/base interna **sem inventar** fatos (alinhar ao specialist SQL que já exige schema).

### Escopo

- Ingestão de documentos (upload/sync)
- Interface `IEmbeddingProvider` + `IVectorStore` (ports)
- Retriever com filtros por tenant/produto/capability
- Montagem de context no prompt do specialist
- Citações / fontes na `AIResponse` (metadados)

### Pré-requisitos

- Fase 3 (ou ao menos session id) para amarrar retrieval a conversa
- Classificação de documentos (público plataforma vs tenant)
- Decisão **não prematura** de vector DB — escolher só com requisito de escala/SLA

### Vector store — postura

**Não fixar engine agora.** Candidatos a avaliar quando houver requisito:

| Opção | Quando considerar |
|-------|-------------------|
| PgVector | Já há Postgres na plataforma / ops simples |
| Qdrant | Isolamento e filtros ricos |
| Chroma / outro | PoC local |
| Managed cloud | Sem ops de vetor interno |

Abstrair atrás de `IVectorStore` desde o dia 1 da fase.

### Dependências

- Provider de embeddings (pode ser Ollama ou externo — liga à Fase 7)
- Quotas de armazenamento por tenant (Hub licença)

### Riscos

| Risco | Mitigação |
|-------|-----------|
| Alucinação mesmo com RAG | Prompt: “só use trechos recuperados”; devolver fontes |
| Contaminação cross-tenant | Metadata filter obrigatório `tenantId` |
| Custo/latência de embed | Batch ingest; cache |
| Lock-in de vector DB | Port/adapter |

---

## Fase 5 — Tools

**Status:** ⚪ Não iniciada

### Objetivo

Capabilities que **invocam sistemas** (não só geram texto), com governança completa.

### Tools iniciais

| Tool | Domínio | Exemplos |
|------|---------|----------|
| SQL | Dados | Explicar/gerar (execução só com aprovação — ver Fase 6) |
| CRM | Mensagens / fichas | Buscar cliente, rascunhar (envio = sensível) |
| SIA | Operações backoffice | Consultas read-only primeiro |
| Documentation | Docs internas | Busca (pode usar RAG) |
| Git | Código | Diff/PR summary (sem push forçado) |
| HTTP | Integrações | Chamadas a APIs allowlisted |

### Contrato obrigatório por tool

Toda tool **deve** ter:

| Requisito | Descrição |
|-----------|-----------|
| **capability** | ID estável (ex.: `sia.ticket.read`) |
| **permission** | Scope Hub (`ai:tool:sia.read`, etc.) |
| **authentication** | Identidade do caller via Hub (M2M + contexto) |
| **audit** | Quem, quando, tenant, args (sanitizados), resultado |
| **timeout** | Limite duro por invocação |
| **validation** | Schema de input/output (Zod); deny by default |

### Pré-requisitos

- Fase 2: authz no Hub por capability/tool
- Allowlist de destinos HTTP
- Secrets de tools no Hub/cofre — **nunca** no prompt
- Specialists **sem** `allowExecution` implícito (já é regra atual)

### Dependências

- Registry de tools paralelo ao de specialists
- Possível uso de RAG (Fase 4) na tool Documentation
- Rate limit por tool/tenant

### Riscos

| Risco | Mitigação |
|-------|-----------|
| Execução destrutiva | Default read-only; write = Fase 6 + human approval |
| Prompt injection → tool call | Sanitizar args; não confiar no LLM para auth |
| Lateral movement via HTTP tool | Allowlist + negação de metadados internos |
| Timeout em cascata | Budgets por hop Hub→IA→tool |

### Regra

Specialist sugere / planeja; **tool só executa** se capability + permission + validation passarem.

---

## Fase 6 — Agentes

**Status:** ⚪ Não iniciada

### Objetivo

Orquestração multi-step: planning → tool calling → specialists → workflows, com **aprovação humana** em operações sensíveis.

### Escopo

- Planner (decompõe tarefa)
- Loop de tool calling com teto de iterações
- Orquestração de múltiplos specialists
- Workflows duráveis (estado, retry, compensação)
- Human-in-the-loop para: execução SQL write, envio CRM, mutações SIA, git push, HTTP não-GET

### Pré-requisitos

- Fase 5 (tools maduras e auditadas)
- Fase 3 (memória de sessão do agente)
- UX nos produtos para aprovar/rejeitar ações pendentes
- Políticas Hub: quais roles podem aprovar o quê

### Dependências

- Fila/workers (padrão Hub já tem async) **ou** worker na Aura IA
- Idempotency keys por ação

### Riscos

| Risco | Mitigação |
|-------|-----------|
| Loop infinito / custo | Max steps, max tokens, circuit breaker |
| Ação sensível sem humano | Deny-by-default + fila de aprovação |
| Estado inconsistente | Sagas / outbox |
| Complexidade prematura | Só após tools read-only estáveis em produção |

---

## Fase 7 — Multi-provider

**Status:** ⚪ Não iniciada (interface já preparada)

### Objetivo

Trocar/combinar backends LLM sem mudar contrato dos produtos.

### Providers

| Provider | Uso típico |
|----------|------------|
| Ollama (atual) | On-prem, baixo custo, dados sensíveis |
| OpenAI-compatible | Qualidade / embeddings / tools nativas |
| Outros (Azure, Gemini, Anthropic…) | Sob requisito comercial |

### Escopo

- Factory de provider por capability / tenant / fallback
- Routing: “sql.generate → modelo X”; “crm.message → modelo Y”
- Fallback se Ollama cair (política explícita)
- Normalizar `usage.tokens` no `AIResult`

### Pré-requisitos

- Secrets só em env/cofre
- Decisão de dados: o que pode sair para cloud
- Contratos de custo (liga à Fase 8)

### Dependências

- `ILlmProvider` (já existe)
- Possível `IEmbeddingProvider` (Fase 4)

### Riscos

| Risco | Mitigação |
|-------|-----------|
| Vazamento de PII para cloud | Classificação de dados; opt-in por tenant |
| Drift de qualidade entre modelos | Eval suite por capability |
| Vendor lock prompt | Prompts versionados; testes de regressão |

---

## Fase 8 — Observabilidade avançada

**Status:** ⚪ Não iniciada (logs básicos existem)

### Objetivo

Operar AI como produto mensurável: custo, SLO e consumo por empresa/produto.

### Métricas-alvo

| Dimensão | Exemplos |
|----------|----------|
| Latência | p50/p95 Hub→IA, IA→provider |
| Tokens | prompt/completion/total |
| Custos | estimado por provider/modelo |
| Erro | taxa por código (`PROVIDER_TIMEOUT`, etc.) |
| Disponibilidade | uptime IA + Ollama |
| Consumo | por `tenantId`, `application`, capability |
| Negócio | req/dia, conversas ativas, tools invocadas |

### Pré-requisitos

- Emitir `usage` real (Fase 7 ajuda)
- Correlation id ponta a ponta (já no contrato)
- Backend de métricas (Prometheus/Hub observability/OpenTelemetry) — decidir com ops

### Dependências

- Fase 2 (tenant/application confiáveis)
- Dashboards no Hub (padrão observability existente)

### Riscos

| Risco | Mitigação |
|-------|-----------|
| Cardinalidade alta de labels | Agregar por tenant/produto, não por user em metrics |
| Custo de storage de logs de prompt | Amostragem; não logar body completo em prod |
| Números de custo imprecisos | Tabelas de preço versionadas por modelo |

---

## Matriz de dependências (resumo)

```text
Fase 1 Fundação ─────────────────────────────► (base)
    │
    ├─► Fase 2 Integração Hub ──► Fase 3 Memória ──► Fase 4 RAG
    │         │                         │
    │         └──────────► Fase 5 Tools ─┴──► Fase 6 Agentes
    │
    ├─► Fase 7 Multi-provider (paralela; reforça 4–6)
    │
    └─► Fase 8 Observabilidade (contínua desde 2)
```

---

## Princípios que valem para todas as fases

1. **Produtos nunca acessam Aura IA direto** — sempre Hub.
2. **Não duplicar** identidade, tenant nem licença na IA.
3. **Capability-first** — specialist/tool/agent expõem capabilities versionadas.
4. **Deny by default** — execução e tools write exigem permission + (se sensível) humano.
5. **Config > hardcode** — models, URLs, keys só via env/cofre.
6. **Ports & adapters** — LLM, embed, vector, tools atrás de interfaces.
7. **Sem vector DB definitivo** até requisito claro (Fase 4).
8. **Versionar contrato** `/api/v1` — breaking changes em `/api/v2`.

---

## Backlog de decisões (bloqueiam fases)

| # | Decisão | Bloqueia |
|---|---------|----------|
| D1 | Feature AI por plano vs add-on | Fase 2 saída |
| D2 | Aura IA só rede interna? | Fase 2 segurança |
| D3 | Onde persiste conversa/auditoria (IA vs Hub) | Fase 3 |
| D4 | Vector store + embeddings on-prem vs cloud | Fase 4 |
| D5 | Tools write permitidas antes de agentes? | Fase 5–6 |
| D6 | Quais dados podem ir a provider cloud | Fase 7 |
| D7 | Stack de métricas (OTel / Hub / Prometheus) | Fase 8 |

---

## Próximo passo recomendado (sem implementar neste doc)

1. **Fechar Fase 2 em produção:** M2M keys, Hub enabled, um produto no fluxo Hub-only.  
2. **Auditoria mínima persistente** (requestId, tenant, app, capability, status, duration).  
3. Só então iniciar **Fase 3 (memória)** ou **Fase 7 (segundo provider)** conforme dor de negócio.

---

*Documento vivo — atualizar status das fases a cada entrega relevante.*
