# Contrato Oficial — AuraHub ↔ Aura IA

**Documento:** `AURA_AI_API_CONTRACT`  
**Status:** Oficial (v1) — validado contra padrões e facade existentes no AuraHub  
**Versão do contrato:** `1.0.0`  
**Data:** 2026-08-12  
**Base path Aura IA:** `/api/v1/ai`  
**Endpoint canônico:** `POST /api/v1/ai/chat`

**Fora de escopo deste contrato:** CRUD de agentes, frontend, alterações no SIA, RAG, memória, tools, agentes autônomos.

**Referências AuraHub (não reinventar):**

| Tema | Onde no AuraHub |
|------|-----------------|
| Envelope HTTP | `backend/src/shared/http/envelope.ts` |
| Headers de tracing | `x-request-id`, `x-correlation-id` (request-context) |
| M2M produto → Hub | `x-api-key` + permissões (`ai:read` / `ai:write`) |
| JWT usuário/staff | `Authorization: Bearer` |
| Tenant | `tenants.service` / ADR-0009 (UUID) + `companyId` operacional |
| System / aplicação | `System.slug` (`x-aura-system` no hop) |
| Facade AI | `POST /api/v1/ai/chat`, `GET /api/v1/ai/specialists` |
| Client M2M | `backend/src/infrastructure/ai/aura-ia.client.ts` |

---

## 1. Objetivo

Definir o contrato **versionado** que permite ao **AuraHub** consumir a **Aura IA** como serviço de inteligência da Plataforma Aura.

```text
Produto (SIA / AuraFit / CRM / …)
            ↓
         AuraHub
   IDENTIDADE · AUTH · AUTHZ · TENANT · APP · LICENÇA · CAPABILITY
            ↓  M2M (x-api-key)
         Aura IA
   SPECIALIST · PROMPT · PROVIDER · MODEL · PROCESSAMENTO
            ↓
         Provider (ex.: Ollama) → Model (interno)
```

**Regra de ouro:** produtos **não** acessam a Aura IA diretamente. O hop autenticado é **somente AuraHub → Aura IA**.

---

## 2. Divisão de responsabilidades

| Responsabilidade | AuraHub | Aura IA |
|------------------|---------|---------|
| Identidade (usuário / M2M produto) | ✅ | ❌ |
| Autenticação do produto | ✅ | ❌ |
| Autorização / permissões (`ai:*`) | ✅ | ❌ |
| Tenant / company | ✅ resolve e asserta | ❌ só recebe contexto confiável |
| Aplicação (`System.slug`) | ✅ resolve | ❌ só recebe |
| Licença / feature AI | ✅ | ❌ |
| Gate de capability permitida | ✅ | ❌ (executa se pedida; não licencia) |
| Specialist | ⚠️ pode sugerir | ✅ resolve e executa |
| Prompt / system prompts | ❌ | ✅ |
| Provider / model | ❌ | ✅ (interno) |
| Processamento LLM | ❌ | ✅ |
| Rate limit produto → Hub | ✅ | — |
| Rate limit Hub → IA | ⚠️ complementar | ✅ |

Aura IA **não** revalida JWT de usuário, senha, licença comercial nem isolamento de tenant. Confia no Hub autenticado via M2M.

---

## 3. Autenticação M2M (padrão já existente)

### 3.1 O que a plataforma já usa

| Fluxo | Mecanismo |
|-------|-----------|
| Produto → AuraHub | `x-api-key` (M2M) **ou** `Authorization: Bearer` (JWT) |
| AuraHub → Aura IA | `x-api-key` (segredo dedicado Hub↔IA) |
| Tracing | `x-request-id` (obrigatório no hop; gerado no Hub se ausente) |
| Correlação | `x-correlation-id` (recomendado) |
| Contexto empresa | `x-company-id` / body `tenant.companyId` |
| System | `x-aura-system` / body `application` |

**Não inventar:** `X-Client-App`, `Authorization` como auth principal do hop Hub→IA, Pascal-Case de headers.

### 3.2 Headers — Hub → Aura IA

| Header | Obrigatório | Descrição |
|--------|-------------|-----------|
| `x-api-key` | **Sim** | Segredo M2M Hub↔Aura IA (`AURA_HUB_M2M_API_KEY` / `AURA_IA_API_KEY`) |
| `x-request-id` | **Sim** | Deve coincidir com `body.requestId` |
| `Content-Type` | **Sim** | `application/json` |
| `x-correlation-id` | Recomendado | Correlação end-to-end |
| `x-tenant-id` | Recomendado | Espelho de `tenant.id` |
| `x-company-id` | Opcional | Espelho de `tenant.companyId` |
| `x-aura-system` | Recomendado | Espelho de `application` |
| `x-aura-gateway` / `x-aura-gateway-route` | Opcional | Se passou pelo aura-gateway |

Constantes TypeScript: `src/types/contract/headers.ts` (`AURA_AI_HEADERS`).

---

## 4. Versionamento

| Item | Valor |
|------|-------|
| Prefixo oficial | `/api/v1/...` |
| Breaking change | Somente em `/api/v2/...` (ou major do contrato) |
| Legado Aura IA | `POST /api/ai/chat` — **não** é contrato Hub; apenas compatibilidade |

Endpoints Aura IA cobertos por este contrato:

| Método | Path | Uso |
|--------|------|-----|
| `POST` | `/api/v1/ai/chat` | **Canônico** — processamento AI |
| `GET` | `/api/v1/ai/specialists` | Catálogo (Hub / ops) |
| `GET` | `/api/v1/ai/health` | Health autenticado M2M |

Rotas de capability (`/sql/*`, `/code/*`) são extensão operacional da Aura IA; o contrato **oficial** de integração Hub é `POST /api/v1/ai/chat` com `capability` no body.

Facade AuraHub (já alinhada):

| Método | Path |
|--------|------|
| `POST` | `/api/v1/ai/chat` |
| `GET` | `/api/v1/ai/specialists` |

---

## 5. Request — `AIRequest`

Body JSON de `POST /api/v1/ai/chat` (Aura IA), montado **pelo AuraHub** após authz/tenant/licença.

### 5.1 Conceitual (campos de negócio)

```json
{
  "specialist": "sql",
  "capability": "sql.generate",
  "prompt": "Liste os clientes ativos ordenados por nome"
}
```

O contexto de **tenant**, **application**, **user** e **requestId** segue o padrão Hub (não é inventado pelo produto):

```json
{
  "requestId": "9f3c2a1e-4b77-4d2a-9c1e-0a1b2c3d4e5f",
  "application": "sia",
  "tenant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "companyId": "clxyz0123456789abcdefgh"
  },
  "user": {
    "id": "user_sia_123"
  },
  "specialist": "sql",
  "capability": "sql.generate",
  "prompt": "Liste os clientes ativos ordenados por nome",
  "context": {
    "schema": "CREATE TABLE clientes (id INT, nome VARCHAR(120), ativo TINYINT);",
    "locale": "pt-BR"
  },
  "metadata": {
    "feature": "atendimentos.sql-helper"
  }
}
```

### 5.2 Schema TypeScript / Zod

Arquivo: `src/types/contract/ai-request.ts` (`aiRequestSchema`, tipo `AIRequest`).

| Campo | Obrigatório | Notas |
|-------|-------------|-------|
| `requestId` | Sim | = `x-request-id` |
| `application` | Sim | slug `^[a-z][a-z0-9_-]*$` (ex.: `sia`, `aurafit`, `crm`) |
| `tenant.id` | Sim | UUID (ADR-0009) |
| `tenant.companyId` | Não | cuid operacional Hub |
| `user` | Não | id / roles / email (evitar PII) |
| `prompt` | Sim | limite de tamanho na Aura IA |
| `specialist` | Não* | ex.: `sql`, `crm`, `general` |
| `capability` | Não* | ex.: `sql.generate` |
| `context` | Não | `schema`, `locale`, … |
| `metadata` | Não | mapa string→scalar |

\* Recomendado informar ao menos um; a Aura IA resolve defaults via registry.

**Proibido no request:** `model`, `provider` (`.strict()` rejeita).

### 5.3 Facade Hub (produto → Hub)

O produto **não** envia `tenant` / `requestId` como fonte de verdade. O Hub aceita body enxuto (já implementado):

```json
{
  "prompt": "...",
  "specialist": "sql",
  "capability": "sql.generate",
  "context": { "schema": "..." },
  "metadata": {},
  "companyId": "...",
  "application": "sia"
}
```

e monta o `AIRequest` completo no client M2M.

---

## 6. Response — envelope AuraHub + `AIResult`

### 6.1 Conceitual (campos que o consumidor precisa)

```json
{
  "success": true,
  "requestId": "...",
  "response": "...",
  "specialist": "sql",
  "capability": "sql.generate"
}
```

No protocolo real da plataforma, isso mapeia para o **envelope padrão do AuraHub** (`success`, `message`, `data`, `errors`, `meta`):

| Conceitual | Onde no envelope |
|------------|------------------|
| `success` | `success` |
| `requestId` | `meta.requestId` e `data.requestId` |
| `response` | `data.response` |
| `specialist` | `data.specialist` |
| `capability` | `data.capability` |

### 6.2 Exemplo de sucesso

```json
{
  "success": true,
  "message": "",
  "data": {
    "requestId": "9f3c2a1e-4b77-4d2a-9c1e-0a1b2c3d4e5f",
    "response": "SELECT id, nome FROM clientes WHERE ativo = 1 ORDER BY nome;",
    "specialist": "sql",
    "specialistVersion": "1.0.0",
    "capability": "sql.generate",
    "durationMs": 842,
    "usage": {
      "promptTokens": null,
      "completionTokens": null,
      "totalTokens": null
    }
  },
  "errors": [],
  "meta": {
    "requestId": "9f3c2a1e-4b77-4d2a-9c1e-0a1b2c3d4e5f",
    "correlationId": "7a1b0c2d-1111-2222-3333-444455556666",
    "durationMs": 842
  }
}
```

### 6.3 Detalhes internos do provider

| Campo | Política v1 |
|-------|-------------|
| `provider` | **Opcional** no hop Hub↔IA (auditoria). Produtos **não** devem depender. Hub pode omitir na facade pública. |
| `model` | **Opcional** no hop (auditoria interna). **Nunca** escolhido pelo consumidor. Não é contrato de produto. |
| Stack traces / URLs Ollama | **Nunca** no body ao consumidor |

DTO: `src/types/contract/ai-response.ts` (`AIResult`, `AIResponse`, helpers `buildAISuccessResponse` / `buildAIErrorResponse`).

---

## 7. Erros oficiais

Códigos canônicos (`errors[].code`):

| Código | HTTP típico | Quando |
|--------|-------------|--------|
| `AUTHENTICATION_ERROR` | 401 | `x-api-key` ausente/inválida |
| `AUTHORIZATION_ERROR` | 403 | Autenticado sem permissão de hop |
| `VALIDATION_ERROR` | 400 | Body inválido / campos inconsistentes |
| `RATE_LIMITED` | 429 | Limite do hop Hub→IA |
| `PROVIDER_TIMEOUT` | 504 | Timeout do LLM/provider |
| `PROVIDER_ERROR` | 502 | Falha do provider |
| `AI_ERROR` | 502 | Falha de processamento AI (não-provider) |
| `INTERNAL_ERROR` | 500 | Erro inesperado |

Constantes: `src/types/contract/error-codes.ts` (`AURA_AI_ERROR_CODES`).

Códigos auxiliares permitidos (não quebram o envelope): `SPECIALIST_NOT_FOUND`, `CAPABILITY_NOT_FOUND`, `REQUEST_ID_MISMATCH`, `NOT_FOUND`. Preferir documentá-los no Hub como mapeáveis a `VALIDATION_ERROR` / `AI_ERROR` na facade de produto, se desejado.

### 7.1 Exemplo de erro

```json
{
  "success": false,
  "message": "Timeout ao consultar provider",
  "data": null,
  "errors": [
    {
      "code": "PROVIDER_TIMEOUT",
      "message": "Timeout ao consultar provider"
    }
  ],
  "meta": {
    "requestId": "9f3c2a1e-4b77-4d2a-9c1e-0a1b2c3d4e5f",
    "correlationId": "7a1b0c2d-1111-2222-3333-444455556666",
    "durationMs": 60012
  }
}
```

Stack trace **não** é exposto ao consumidor.

---

## 8. Capabilities e specialists (Aura IA)

O Hub pode **autorizar** quais capabilities um tenant/produto usa. A Aura IA **executa** specialists/capabilities registrados.

Specialists (registry): `sql`, `database`, `nodejs`, `typescript`, `crm`, `devops`, `docker`, `linux`, `git` (+ `general`).

Capabilities iniciais: `sql.generate`, `sql.analyze`, `code.generate`, `code.review`, `crm.message.generate`, `database.analyze`, `logs.analyze`.

---

## 9. Compatibilidade validada com o AuraHub

| Item | Status |
|------|--------|
| Envelope `{ success, message, data, errors, meta }` | ✅ Idêntico ao Hub |
| Headers kebab-case (`x-api-key`, `x-request-id`, …) | ✅ Usados pelo `aura-ia.client` |
| Body `AIRequest` no hop | ✅ Montado por `ai.service` / tipado no client |
| Facade `POST /api/v1/ai/chat` no Hub | ✅ Existe (`modules/ai`) |
| Produto não escolhe model | ✅ Schema Hub + Aura IA `.strict()` |
| Permissões `ai:read` / `ai:write` | ✅ Catálogo Hub |
| SIA | ❌ Não modificado por este contrato |

**Gap residual (não bloqueia o contrato):** enforcement de licença comercial AI no Hub (feature/plano) — responsabilidade Hub, fora deste documento de API.

---

## 10. Segurança

1. Key M2M Hub↔IA distinta das keys de produtos; produtos nunca a recebem.
2. Aura IA preferencialmente em rede interna.
3. Specialists geram texto — não executam SQL/comandos.
4. Logs estruturados; evitar PII desnecessária em `user.email` / prompts.
5. Breaking changes apenas em nova versão de API.

---

## 11. Artefatos

| Arquivo | Conteúdo |
|---------|----------|
| `docs/AURA_AI_API_CONTRACT.md` | **Este contrato oficial** |
| `docs/AURAHUB_AI_CONTRACT.md` | Ponteiro / histórico → este documento |
| `docs/INTEGRACAO_AURAHUB.md` | Guia operacional de env/keys |
| `src/types/contract/*` | DTOs Zod + headers + error codes |

**Não incluído:** CRUD de agentes, UI, mudanças no SIA.

---

## 12. Checklist de aceite

- [x] Divisão Hub (identidade/authz/tenant/app/licença/capability) vs Aura IA (specialist/prompt/provider/model)
- [x] M2M com `x-api-key` (padrão Hub)
- [x] `requestId` / tenant / application / user no padrão Hub
- [x] `POST /api/v1/ai/chat` versionado
- [x] Response em envelope Hub; campos conceituais mapeados
- [x] Códigos de erro oficiais padronizados
- [x] Sem model/provider no request
- [x] DTOs TypeScript/Zod versionados
- [x] Compatibilidade conferida com client/facade AuraHub
- [x] Sem CRUD de agentes / sem alteração no SIA
