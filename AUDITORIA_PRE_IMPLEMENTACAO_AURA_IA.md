# Auditoria Pré-Implementação — Aura IA

**Data:** 12/08/2026  
**Projeto:** `aurafit-ai-api` (Aura IA)  
**Escopo:** auditoria estática do estado atual **antes** de novas implementações  
**Ações neste documento:** nenhuma alteração de código, dependências ou migrations

Arquitetura-alvo da plataforma:

```text
SIA Web / AuraFit / CRM / futuros
            ↓
         AuraHub
   (auth, authz, tenant, app, licença, capabilities, governança)
            ↓
         Aura IA
   (LLM, specialists, prompts, providers, modelos, contexto de IA)
            ↓
         Provider → LLM
```

---

## 1. Resumo executivo

A Aura IA **já deixou de ser um proxy mínimo** e possui base de plataforma: estrutura em camadas, `ILlmProvider`, specialists/capabilities, contrato Hub (`AIRequest`/`AIResponse`), M2M e facade no AuraHub.

Ainda **não está pronta como cérebro central consolidado em produção** porque:

1. o endpoint legado `POST /api/ai/chat` permanece **sem M2M**;
2. CORS default `*` e superfície pública de health;
3. gate de **licença comercial AI** no Hub ainda não existe;
4. auditoria é só log efêmero (sem persistência);
5. SIA ainda pode ter IA paralela (OpenAI) — risco de dois cérebros;
6. deploy/produção já apresentou crash loop por `.env`/PM2 (mitigações recentes no código; validar VPS).

**Veredito:** apta para **evoluir** (Fase 2 consolidação → memória/RAG depois), desde que se feche segurança operacional e cutover via Hub antes de features avançadas.

---

## 2. Estado atual

### 2.1 Estrutura de diretórios

```text
aurafit-ai-api/
├── src/
│   ├── config/env.ts
│   ├── controllers/chat.controller.ts
│   ├── middlewares/   (cors, error, validate, request-context, hub-m2m-auth, hub-rate-limit)
│   ├── providers/llm/ (ILlmProvider, OllamaProvider)
│   ├── services/      (aura-ai, specialist, chat)
│   ├── specialists/   (registry + 10 specialists)
│   ├── prompts/       (specialists + security shared)
│   ├── routes/        (ai.routes legado + v1/ai.routes)
│   ├── types/         (chat, errors, capability, specialist, contract/)
│   ├── utils/logger.ts
│   └── server.ts
├── tests/             (registry, selection, capability, prompts, provider, contract, m2m)
├── docs/              (contrato Hub, integração, CI/CD, análises)
├── scripts/deploy.sh
├── ROADMAP_AURA_IA.md
├── ANALISE_AURA_IA_ARQUITETURA.md
└── package.json
```

**Ausentes (esperado nesta etapa):** `rag/`, `embeddings/`, `tools/`, `agents/`, persistência, OpenAPI na Aura IA, Docker.

### 2.2 Stack

| Item | Valor |
|------|--------|
| Runtime | Node.js + TypeScript (strict) |
| HTTP | Express 5 |
| Validação | Zod 4 |
| LLM client | Axios → Ollama |
| Testes | Vitest |
| Deploy | GitHub Actions + SSH + PM2 |

### 2.3 Rotas

| Método | Path | Auth | Observação |
|--------|------|------|------------|
| `GET` | `/` | Público | Health deploy |
| `GET` | `/health` | Público | Health simples |
| `POST` | `/api/ai/chat` | **Nenhuma** | Legado — risco |
| `GET` | `/api/v1/ai/health` | M2M | |
| `GET` | `/api/v1/ai/specialists` | M2M + rate limit | |
| `POST` | `/api/v1/ai/chat` | M2M + rate limit | Contrato `AIRequest` |
| `POST` | `/api/v1/ai/chat/legacy-body` | M2M | Body transitório |

### 2.4 Controllers / Services / Providers

| Camada | Arquivos | Papel |
|--------|----------|-------|
| Controller | `chat.controller.ts` | Legado, v1 transitório, contrato Hub, listagem |
| Services | `AuraAiService`, `SpecialistService`, `ChatService` | Orquestração |
| Provider | `ILlmProvider`, `OllamaProvider` | Geração; timeout; model interno |
| Registry | `SpecialistRegistry` | Resolve specialist/capability |

Specialists **não** importam Axios/Ollama — regra respeitada.

### 2.5 Ollama / configuração / environment

| Variável | Obrigatória no boot | Uso |
|----------|---------------------|-----|
| `OLLAMA_URL` | Sim | Base do provider |
| `MODEL` | Sim | Modelo interno |
| `PORT` | Default 3000 | Listen `0.0.0.0` |
| `AURA_HUB_M2M_API_KEY` | Não (opcional) | M2M; sem key → `/api/v1/ai` 503 |
| `M2M_AUTH_REQUIRED` | Default true | Liga auth nas rotas v1 |
| `CORS_ORIGINS` | Default `*` | Aberto |
| `OLLAMA_TIMEOUT_MS`, `MAX_PROMPT_LENGTH`, rate limits | Defaults | |

Dotenv: candidatos de path relativos ao projeto (mitiga cwd do PM2).

### 2.6 Segurança

| Controle | Status |
|----------|--------|
| Helmet | ✅ |
| M2M `x-api-key` (timing-safe) em `/api/v1/ai` | ✅ |
| Tenant header **não** autentica sozinho | ✅ (só consistência com body) |
| Legado `/api/ai/chat` sem auth | ❌ risco |
| CORS `*` | ⚠️ |
| Rate limit hop Hub→IA (in-memory) | ✅ básico |
| Secrets hardcoded | ✅ nenhum encontrado |
| Execução SQL/comandos | ✅ negada nos prompts (`allowExecution: false`) |

### 2.7 Logs e erros

- Logger JSON: requestId, application, tenant, specialist, capability, provider, model, duration, status
- Envelope de erro alinhado ao Hub (`success`, `message`, `data`, `errors`, `meta`)
- Códigos: `UNAUTHORIZED`, `VALIDATION_ERROR`, `PROVIDER_TIMEOUT`, `SPECIALIST_NOT_FOUND`, etc.
- **Não há** auditoria persistente nem métricas timeseries

### 2.8 Specialists e capabilities

**Specialists:** `general`, `sql`, `database`, `nodejs`, `typescript`, `crm`, `devops`, `docker`, `linux`, `git`

**Capabilities:** `sql.generate`, `sql.analyze`, `code.generate`, `code.review`, `crm.message.generate`, `database.analyze`, `logs.analyze`

SQL: regra de não inventar schema presente nos prompts.

### 2.9 Testes

| Suíte | Cobertura |
|-------|-----------|
| Registry / selection / capability | ✅ |
| Prompt loading | ✅ |
| Provider abstraction (mock) | ✅ |
| Contrato DTOs | ✅ |
| M2M (parcial; com `M2M_AUTH_REQUIRED=false` em test) | ⚠️ |
| Testes de integração HTTP / E2E Hub | ❌ |
| Testes de carga / timeout real Ollama | ❌ |

### 2.10 Integração AuraHub (lado Hub)

Já existe no repositório AuraHub (fora deste pacote, mas relevante à auditoria):

- Facade `POST /api/v1/ai/chat`, `GET /api/v1/ai/specialists`
- Client M2M `infrastructure/ai/aura-ia.client.ts`
- Env `AURA_IA_*`, permissões `ai:read` / `ai:write`
- OpenAPI tag AI

**Não** implementado no Hub: gate de licença feature AI; cutover dos produtos; auditoria AI dedicada.

---

## 3. O que já está implementado

1. Fundação estrutural (config, middlewares, services, types).
2. Abstração de provider (`ILlmProvider` + Ollama).
3. Plataforma de specialists/capabilities + registry.
4. Contrato versionado Hub↔IA + DTOs Zod.
5. Auth M2M nas rotas `/api/v1/ai/*`.
6. Facade AuraHub → Aura IA (código).
7. Observabilidade básica via logs.
8. CI/CD (build/deploy PM2) + melhorias recentes de dotenv/deploy.
9. Documentação: análise, contrato, integração, roadmap.
10. Compatibilidade do endpoint legado `POST /api/ai/chat` (resposta `{ success, response }`).

---

## 4. O que está incompleto

| Item | Lacuna |
|------|--------|
| Produção M2M | Key pode estar ausente na VPS; v1 responde 503 |
| Cutover produtos | SIA/AuraFit/CRM ainda podem não usar só o Hub |
| Licença AI | Sem feature/plano no Hub |
| Auditoria | Sem store consultável |
| Legado sem auth | `/api/ai/chat` aberto |
| CORS produção | Default permissivo |
| Health Ollama | `/` e `/health` não checam provider |
| Tokens reais | `usage` null no `AIResult` |
| OpenAPI na Aura IA | Ausente |
| Memória / RAG / tools / agentes | Fora do baseline (roadmap Fases 3–6) |
| Multi-provider | Só Ollama |
| Testes E2E M2M com auth ligado | Fracos |

---

## 5. Problemas encontrados

| # | Problema | Severidade |
|---|----------|------------|
| P1 | `POST /api/ai/chat` sem autenticação | Alta |
| P2 | CORS `*` por default | Média–Alta |
| P3 | Naming/package ainda `ia-api.aurafitpro.com.br` / PM2 `aurafit-ai-api` (acoplamento semântico AuraFit) | Média (estratégico) |
| P4 | Rate limit in-memory (não compartilhado entre instâncias) | Média |
| P5 | Sem ready check de Ollama | Média (ops) |
| P6 | Deploy já falhou com HTTP 000 / crash loop PM2 | Alta (ops) — mitigado no código; validar VPS |
| P7 | M2M test desligado no setup (`M2M_AUTH_REQUIRED=false`) | Baixa–Média (qualidade) |
| P8 | Possível IA duplicada no SIA (OpenAI) | Alta (plataforma) |
| P9 | Envelope legado ≠ envelope Hub em `/api/ai/chat` | Baixa (esperado) |
| P10 | Controllers acumulam vários handlers no mesmo arquivo | Baixa (manutenção) |

---

## 6. Riscos

### 6.1 Arquiteturais / acoplamento

| Risco | Descrição |
|-------|-----------|
| Bypass do Hub | Cliente chama legado ou Ollama direto → sem tenant/licença |
| Dois cérebros | SIA OpenAI + Aura Ollama → políticas e qualidade divergentes |
| Branding AuraFit | Dificulta percepção multi-produto |
| Confiança cega no body tenant | OK **somente** com M2M Hub; se legado existir, body é forjável |

### 6.2 Segurança

| Risco | Mitigação recomendada (futura) |
|-------|--------------------------------|
| Endpoint legado aberto | Exigir M2M ou desligar em produção |
| Key M2M vazada | Rotação; rede interna; nunca em produtos |
| Prompt injection | Já há regras; tools futuras precisam validation rígida |
| Logs com PII | Política de retenção/redaction |

### 6.3 Conflitos potenciais com AuraHub

| Tema | Conflito | Recomendação |
|------|----------|--------------|
| Licença | Duplicar gate na IA | **Só Hub** |
| Identidade | Validar JWT de usuário na IA | **Não** no hop atual; Hub resolve |
| Envelope | Respostas divergentes | Manter envelope Hub em `/api/v1`; legado isolado |
| Capabilities | Hub lista scopes `ai:*` vs catálogo IA | Mapear capability IA ↔ permission Hub |
| Tenant | Hub usa UUID + company cuid | Já no `AIRequest`; não inventar terceiro ID |
| Rate limit | Hub + IA | Hub é SoT de entrada; IA complementar |
| Gateway | Proxy público para IA | Preferir só Hub→IA interno |
| Auditoria | Onde gravar | Hub agrega governança; IA pode espelhar usage |

---

## 7. Arquivos que precisam ser alterados (próximas implementações)

Ordem típica de consolidação Fase 2 / hardening — **não alterar agora**:

| Arquivo | Motivo futuro |
|---------|---------------|
| `src/routes/ai.routes.ts` | Auth M2M ou feature-flag para desligar legado |
| `src/server.ts` | CORS estrito; health/ready Ollama; deprecar legado |
| `src/config/env.ts` | `CORS_ORIGINS` obrigatório em produção; flags de legado |
| `src/middlewares/hub-m2m-auth.middleware.ts` | Rotação/multi-key se necessário |
| `src/controllers/chat.controller.ts` | Separar handlers; auditoria |
| `src/services/aura-ai.service.ts` | Usage real; conversationId (Fase 3) |
| `src/providers/llm/ollama.provider.ts` | Métricas tokens se API Ollama expuser |
| `package.json` | Rename semântico eventual |
| `scripts/deploy.sh` / CI | Já melhorado; acompanhar logs VPS |
| **Hub:** `modules/ai/*` | Gate licença; audit; cutover docs |
| **Hub:** permissions / licensing | Feature `aura-ia` |

---

## 8. Arquivos que precisam ser criados (próximas fases)

| Quando | Artefatos |
|--------|-----------|
| Hardening já | OpenAPI Aura IA; `GET /ready` (Ollama); testes E2E M2M on |
| Fase 2 fechamento | Doc cutover produtos; runbook keys; audit writer |
| Fase 3 | Módulo conversations / store |
| Fase 4 | `IEmbeddingProvider`, `IVectorStore`, ingest |
| Fase 5 | `tools/` registry + contracts |
| Fase 6 | agents / workflows / approval |
| Fase 7 | providers cloud OpenAI-compatible |
| Fase 8 | exporters métricas / dashboards |

**Não criar pastas vazias** sem código na mesma entrega.

---

## 9. Dependências

### 9.1 Já presentes (Aura IA)

`express`, `axios`, `cors`, `dotenv`, `helmet`, `zod`, `typescript`, `vitest`

### 9.2 Prováveis (futuro — não instalar agora)

| Necessidade | Candidatos |
|-------------|------------|
| OpenAPI | swagger-ui / scalar |
| Persistência conversas | Prisma + MySQL/Postgres |
| Métricas | pino-opentelemetry / prom-client |
| Rate limit distribuído | Redis (alinhar Hub) |
| Embeddings / vector | TBD (port first) |

### 9.3 Plataforma

| Sistema | Dependência |
|---------|-------------|
| Ollama | URL + modelo estáveis |
| AuraHub | Facade enabled + M2M key + scopes `ai:*` |
| Produtos | Clientes HTTP só no Hub |
| Rede | Preferir IA interna |

---

## 10. Ordem recomendada de implementação

> Aguardar autorização da próxima etapa antes de codar.

### Etapa A — Hardening operacional (curto)

1. Validar VPS: `.env` (`PORT`, `OLLAMA_URL`, `MODEL`), PM2 estável, health 200.
2. Configurar `AURA_HUB_M2M_API_KEY` (IA) = `AURA_IA_API_KEY` (Hub); `AURA_IA_ENABLED=true`.
3. Restringir CORS em produção.
4. Proteger ou desabilitar `POST /api/ai/chat` em produção.
5. Testes E2E M2M com auth ligado.

### Etapa B — Fechar integração Hub (Fase 2)

1. Gate de licença/feature AI **no Hub** (não na IA).
2. Auditoria mínima persistente (requestId, tenant, app, capability, status, duration).
3. Cutover de **um** produto (ex.: SIA) para Hub-only; desligar IA paralela.
4. Deprecar legado com data.

### Etapa C — Evolução (roadmap)

1. Fase 3 Memória  
2. Fase 4 RAG (vector DB só com requisito)  
3. Fase 5 Tools (permission + audit + timeout + validation)  
4. Fase 6 Agentes + HITL  
5. Fase 7 Multi-provider / Fase 8 Observabilidade (podem avançar em paralelo após B)

---

## 11. Compatibilidade do endpoint atual

| Endpoint | Preservar? | Notas |
|----------|------------|-------|
| `POST /api/ai/chat` → `{ success, response }` | Sim, até cutover | **Risco de segurança** se permanecer público |
| `POST /api/v1/ai/chat` (`AIRequest`) | Sim — contrato Hub | Caminho oficial |
| `GET /` health | Sim — CI/CD | Manter público ou probe interno |

Qualquer breaking no contrato Hub exige versão `/api/v2` ou deprecation explícita.

---

## 12. Preparação para AuraHub — checklist

| Critério | Status |
|----------|--------|
| Produtos não falam com Ollama/modelo/prompts infra | ⚠️ código OK na IA; legado e SIA paralelo ainda ameaçam |
| Hub autentica produtos | ✅ (código) |
| Hub→IA M2M | ✅ (código) |
| Tenant/application no request | ✅ |
| Specialists/capabilities | ✅ |
| Licença no Hub | ❌ |
| Auditoria | ❌ parcial (logs) |
| Rede/ops estável | ⚠️ validar pós-deploy |

---

## 13. Conclusão e próximos passos

A Aura IA está **estruturalmente alinhada** à visão Plataforma Aura (Hub no meio, IA como Resource Server de inteligência). O maior gap não é “falta de pasta RAG”, e sim **fechar o perímetro**: legado autenticado/desligado, M2M em produção, licença e cutover de produtos, auditoria.

**Não implementar nada até a próxima etapa autorizada.**

Aguardando o próximo prompt para execução (provável: hardening A ou fechamento Fase 2).

---

*Auditoria somente leitura — 12/08/2026.*
