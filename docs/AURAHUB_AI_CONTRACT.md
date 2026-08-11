# Contrato Técnico — AuraHub ↔ Aura IA

**Status:** Implementado (hop M2M Hub ↔ Aura IA)  
**Data:** 2026-08-10  
**Versão do contrato:** `1.0.0`  
**Base path Aura IA:** `/api/v1/ai`  
**Escopo:** contrato M2M para o AuraHub consumir a Aura IA.  
**Facade Hub:** `POST /api/v1/ai/chat`, `GET /api/v1/ai/specialists`  
**Fora de escopo:** RAG, tools, agents, providers externos, duplicação de licença/identidade.

---

## 1. Objetivo

Estabelecer o contrato que permite à **Aura IA** atuar como serviço de inteligência da Plataforma Aura, consumido **exclusivamente via AuraHub**, por múltiplos produtos (SIA Web, AuraFit, CRM e futuros).

```text
SIA Web / AuraFit / CRM / futuros
            ↓
         AuraHub
   (auth, authz, tenant, app, licença, capability gate)
            ↓
         Aura IA
   (specialist, prompt, provider, model, processamento)
            ↓
         Provider (ex.: Ollama)
            ↓
         Model (interno)
```

**Regra de ouro:** produtos **não** acessam a Aura IA diretamente.

---

## 2. Princípios e divisão de responsabilidades

| Responsabilidade | AuraHub | Aura IA |
|------------------|---------|---------|
| Autenticação do produto (M2M/JWT) | ✅ | ❌ |
| Autorização / permissões | ✅ | ❌ |
| Resolução de tenant / company | ✅ | ❌ (apenas recebe contexto confiável) |
| Identidade da aplicação (system) | ✅ | ❌ (apenas recebe) |
| Licenciamento / feature AI | ✅ | ❌ |
| Gate de capability permitida ao tenant/produto | ✅ | ❌ |
| Rate limit de entrada (produto → Hub) | ✅ | ⚠️ complementar no hop Hub→IA |
| Seleção de specialist | ⚠️ pode sugerir | ✅ resolve e executa |
| System prompts / specialists | ❌ | ✅ |
| Escolha de provider/model | ❌ | ✅ (interno) |
| Processamento LLM | ❌ | ✅ |
| Auditoria de uso AI (tokens/duração) | ✅ (agrega) | ✅ (emite métricas no response) |

**Não duplicar:** Aura IA **não** revalida senha, JWT de usuário final, licença comercial nem isolamento de tenant. Ela confia no Hub como caller autenticado M2M.

---

## 3. Autenticação (M2M) — alinhada ao AuraHub

### 3.1 Padrão já adotado na plataforma

Análise do AuraHub / SIA / gateway:

| Uso | Header / scheme | Onde |
|-----|-----------------|------|
| M2M produto → Hub | `x-api-key` | Hub `authenticate`, `aura-gateway`, cliente SIA |
| Usuário/console → Hub | `Authorization: Bearer <JWT>` | Hub JWT |
| Tracing | `x-request-id` | Hub `request-context` (gera se ausente) |
| Correlação | `x-correlation-id` | Hub + cliente SIA |
| Contexto empresa (staff) | `x-company-id` | Hub (override operacional) |
| Gateway hop | `x-aura-gateway`, `x-aura-gateway-route` | `aura-gateway` |

**Conclusão:** o hop **Hub → Aura IA** deve usar **`x-api-key` (M2M)**, não `Authorization` como esquema principal.  
`Authorization: Bearer` permanece reservado a identidade de usuário no Hub; não é o padrão M2M atual da plataforma.

### 3.2 Headers obrigatórios — Hub → Aura IA

| Header | Obrigatório | Origem | Descrição |
|--------|-------------|--------|-----------|
| `x-api-key` | **Sim** | Segredo M2M Hub↔Aura IA | Autentica o caller como AuraHub (nunca produto final) |
| `x-request-id` | **Sim** | Hub (propaga ou gera) | ID da requisição; Aura IA ecoa na resposta |
| `Content-Type` | **Sim** | Hub | `application/json` |

### 3.3 Headers recomendados — Hub → Aura IA

| Header | Obrigatório | Descrição |
|--------|-------------|-----------|
| `x-correlation-id` | Recomendado | Correlação end-to-end (produto → Hub → IA) |
| `x-tenant-id` | Recomendado | UUID do Tenant (ADR-0009); espelho do body `tenant.id` |
| `x-company-id` | Opcional | Company cuid operacional do Hub; espelho do body `tenant.companyId` |
| `x-aura-system` | Recomendado | Slug do system/aplicação (`sia`, `aurafit`, `crm`, …); espelho de `application` |
| `x-aura-gateway` | Opcional | `1` se a chamada passou pelo `aura-gateway` |
| `x-aura-gateway-route` | Opcional | ID da `GatewayRoute` |

### 3.4 O que **não** usar neste hop (por enquanto)

| Header | Motivo |
|--------|--------|
| `Authorization: Bearer` (usuário) | Pertence ao Hub; Aura IA não é IdP nem Resource Server de usuário neste contrato v1 |
| `X-Client-App` (nome genérico) | Não é padrão atual do Hub; preferir `x-aura-system` + campo `application` no body |
| `X-Tenant-Id` (Pascal-Case inventado) | Plataforma usa **kebab-case** minúsculo (`x-tenant-id`, `x-request-id`) |

### 3.5 Confiança do contexto

Campos de tenant/aplicação/usuário no body são **assertados pelo Hub** após authz/licença.

- Aura IA aceita esses campos **somente** de caller autenticado com a API Key M2M do Hub.
- Aura IA **não** deve aceitar chamadas públicas de produtos com esses headers/body como fonte de verdade.

---

## 4. Versionamento e endpoints

Base: **`/api/v1/ai`**

| Método | Path | Descrição | Estado |
|--------|------|-----------|--------|
| `POST` | `/api/v1/ai/chat` | Processa solicitação AI (contrato Hub) | Preparar / adotar DTO abaixo |
| `GET` | `/api/v1/ai/specialists` | Catálogo de specialists/capabilities | Já existe (transicional) |
| `GET` | `/api/v1/ai/health` | Health do serviço AI (futuro) | Planejado |

**Legado (compatibilidade, não é contrato Hub):**

| Método | Path | Nota |
|--------|------|------|
| `POST` | `/api/ai/chat` | Mantido para clientes antigos; **não** usar no fluxo Plataforma |

Fluxo alvo de produtos:

```text
Produto → AuraHub (facade / gateway) → Aura IA /api/v1/ai/chat
```

---

## 5. Request — `AIRequest`

DTO enviado pelo **AuraHub** no body JSON de `POST /api/v1/ai/chat`.

### 5.1 Schema conceitual

```ts
AIRequest {
  requestId: string;           // = x-request-id (deve coincidir)
  application: string;         // slug do system: sia | aurafit | crm | ...
  tenant: {
    id: string;                // tenant UUID (ADR-0009)
    companyId?: string;        // company cuid Hub (operacional)
  };
  user?: {
    id?: string;               // platformUserId / sia_user_id correlacionado
    roles?: string[];
    email?: string;            // evitar PII desnecessária; opcional
  };
  specialist?: string;         // ex.: sql | crm | general
  capability?: string;         // ex.: sql.generate | crm.message.generate
  prompt: string;              // entrada do usuário/sistema
  metadata?: Record<string, string | number | boolean | null>;
  context?: {
    schema?: string;           // DDL / schema para SQL/database
    locale?: string;           // pt-BR, en-US, ...
    [key: string]: unknown;
  };
}
```

### 5.2 Regras de validação

| Campo | Regra |
|-------|-------|
| `requestId` | Obrigatório; UUID/string não vazia; deve bater com `x-request-id` se ambos presentes |
| `application` | Obrigatório; slug conhecido pelo Hub |
| `tenant.id` | Obrigatório no contrato Hub; UUID |
| `prompt` | Obrigatório; tamanho máx. configurável na Aura IA |
| `specialist` / `capability` | Ao menos um recomendado; se ambos, capability deve ser suportada pelo specialist |
| `model` | **Proibido** no request — escolha interna da Aura IA |
| `provider` | **Proibido** no request |

### 5.3 Exemplo

```http
POST /api/v1/ai/chat HTTP/1.1
Host: ia-api.exemplo.interno
Content-Type: application/json
x-api-key: <HUB_TO_AURA_IA_M2M_KEY>
x-request-id: 9f3c2a1e-4b77-4d2a-9c1e-0a1b2c3d4e5f
x-correlation-id: 7a1b0c2d-1111-2222-3333-444455556666
x-tenant-id: 550e8400-e29b-41d4-a716-446655440000
x-aura-system: sia

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
  "capability": "sql.generate",
  "prompt": "Liste os clientes ativos ordenados por nome",
  "context": {
    "schema": "CREATE TABLE clientes (id INT, nome VARCHAR(120), ativo TINYINT);",
    "locale": "pt-BR"
  },
  "metadata": {
    "feature": "atendimentos.sql-helper",
    "productVersion": "2.4.0"
  }
}
```

---

## 6. Response — `AIResponse`

Alinhado ao **envelope padrão do AuraHub**:

```ts
{
  success: boolean;
  message: string;
  data: AIResult | null;
  errors: Array<{ code: string; message: string; field?: string }>;
  meta: {
    requestId: string;
    correlationId?: string;
    durationMs?: number;
  };
}
```

O payload de negócio (`data`) é o **`AIResult`**:

```ts
AIResult {
  requestId: string;
  response: string;            // texto gerado
  specialist: string;
  specialistVersion?: string;
  capability?: string;
  provider: string;            // ex.: ollama (interno, informativo)
  model: string;               // modelo efetivo (auditoria; não escolhido pelo produto)
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  durationMs: number;
  error?: null;                // em sucesso
}
```

Em falha operacional do processamento AI (sem quebrar o envelope):

```ts
// success: false
data: null
errors: [{ code: "PROVIDER_ERROR", message: "..." }]
meta.requestId / meta.durationMs
```

### 6.1 Exemplo de sucesso

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
    "provider": "ollama",
    "model": "qwen2.5-coder:3b",
    "usage": {
      "promptTokens": null,
      "completionTokens": null,
      "totalTokens": null
    },
    "durationMs": 842
  },
  "errors": [],
  "meta": {
    "requestId": "9f3c2a1e-4b77-4d2a-9c1e-0a1b2c3d4e5f",
    "correlationId": "7a1b0c2d-1111-2222-3333-444455556666",
    "durationMs": 842
  }
}
```

> `usage.*` pode ser `null` enquanto o provider (Ollama `/api/generate`) não expuser tokens de forma estável. O campo existe para forward-compatibility.

### 6.2 Exemplo de erro

```json
{
  "success": false,
  "message": "Erro ao consultar provider",
  "data": null,
  "errors": [
    {
      "code": "PROVIDER_ERROR",
      "message": "Timeout ao consultar Ollama"
    }
  ],
  "meta": {
    "requestId": "9f3c2a1e-4b77-4d2a-9c1e-0a1b2c3d4e5f",
    "correlationId": "7a1b0c2d-1111-2222-3333-444455556666",
    "durationMs": 60012
  }
}
```

### 6.3 Códigos de erro sugeridos

| HTTP | `errors[].code` | Quando |
|------|-----------------|--------|
| 400 | `VALIDATION_ERROR` | Body inválido |
| 401 | `UNAUTHORIZED` | `x-api-key` ausente/inválida |
| 403 | `FORBIDDEN` | Key válida mas sem permissão de hop (futuro) |
| 404 | `SPECIALIST_NOT_FOUND` / `CAPABILITY_NOT_FOUND` | Seleção inválida |
| 409 | `REQUEST_ID_MISMATCH` | Body `requestId` ≠ header |
| 429 | `RATE_LIMITED` | Proteção do hop Hub→IA |
| 502 | `PROVIDER_ERROR` | Falha Ollama/provider |
| 504 | `PROVIDER_TIMEOUT` | Timeout do provider |
| 500 | `INTERNAL_ERROR` | Erro inesperado |

---

## 7. Facade AuraHub (visão — sem implementar agora)

Contrato **público** dos produtos permanece no Hub, por exemplo:

```text
POST /api/v1/ai/chat          (facade Hub — futuro)
```

O Hub:

1. Autentica produto (`x-api-key` ou JWT).
2. Resolve `tenant` / `company` / `system` (nunca confia no client externo).
3. Verifica licença / feature AI / capability permitida.
4. Monta `AIRequest` + headers M2M.
5. Chama Aura IA `POST /api/v1/ai/chat`.
6. Devolve ao produto o envelope Hub (pode ser o mesmo shape, com `data` = `AIResult`).

Exposição via `aura-gateway` (opcional): cadastrar `GatewayRoute` apontando ao upstream interno da Aura IA, mantendo auth `x-api-key` no gateway **ou** restrito à rede interna Hub→IA.

---

## 8. Segurança

1. Aura IA escuta preferencialmente em rede interna / não pública.
2. API Key Hub↔IA distinta das keys de produtos.
3. Especialists **não executam** SQL/comandos/código (somente geram texto).
4. SQL não inventa schema; exige `context.schema` quando necessário.
5. Logs: mascarar PII em `prompt`/`response` conforme política futura.
6. Produtos jamais recebem a key M2M Hub→IA.

---

## 9. Compatibilidade e migração

| Fase | Ação |
|------|------|
| Agora | Documento + DTOs TypeScript/Zod na Aura IA |
| Seguinte | Aura IA aceitar `AIRequest` em `/api/v1/ai/chat` (além do body transicional atual) |
| Hub | Facade + licença + proxy (repositório AuraHub — outro PR) |
| Cutover | Produtos chamam só o Hub; legado `/api/ai/chat` deprecado |

Body transicional atual da Aura IA (`prompt`, `specialist?`, `capability?`, `context?`) **não** substitui este contrato; coexistirá até o Hub adotar `AIRequest`.

---

## 10. Artefatos na Aura IA

| Arquivo | Conteúdo |
|---------|----------|
| `docs/AURAHUB_AI_CONTRACT.md` | Este contrato |
| `src/types/contract/ai-request.ts` | DTO + Zod `AIRequest` |
| `src/types/contract/ai-response.ts` | DTO + helpers `AIResponse` / `AIResult` |
| `src/types/contract/headers.ts` | Nomes canônicos dos headers |
| `src/types/contract/index.ts` | Reexports |

**Não incluído neste entrega:** middlewares de auth M2M, mudanças no AuraHub, cadastro de `GatewayRoute`, persistência de usage.

---

## 11. Decisões em aberto (para ADRs futuros)

1. Facade Hub: path final exatamente `/api/v1/ai/chat` ou `/api/v1/intelligence/chat`?
2. Licença: feature flag global `aura-ia` vs capabilities individuais por plano?
3. `model` no `AIResult`: sempre retornar ao produto ou só ao Hub (strip na facade)?
4. Quotas de tokens por tenant: enforcement no Hub, na IA, ou ambos?
5. mTLS / IP allowlist além de `x-api-key` no hop interno?

---

## 12. Checklist de aceite do contrato

- [x] Produtos não falam direto com Aura IA
- [x] M2M baseado em `x-api-key` (padrão Hub), não em header inventado
- [x] Tracing com `x-request-id` / `x-correlation-id`
- [x] Tenant UUID + application no request
- [x] Specialist/capability no request; model/provider internos
- [x] Response em envelope compatível com Hub
- [x] Versionamento `/api/v1/ai`
- [x] Responsabilidades não duplicadas
- [x] DTOs versionados na Aura IA
- [ ] Implementação de auth/facade (próximos prompts)
