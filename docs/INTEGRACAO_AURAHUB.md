# Integração AuraHub ↔ Aura IA

Fluxo de produção:

```text
Produto (SIA / AuraFit / CRM)
   ↓  x-api-key / JWT + permissão ai:write
AuraHub  POST /api/v1/ai/chat
   ↓  x-api-key M2M (AURA_IA_API_KEY)
Aura IA  POST /api/v1/ai/chat
```

## Configuração

### Aura IA

| Variável | Descrição |
|----------|-----------|
| `AURA_HUB_M2M_API_KEY` | Segredo M2M (mín. 16 chars) |
| `M2M_AUTH_REQUIRED` | `true` em produção |
| `HUB_RATE_LIMIT_*` | Rate limit do hop |

### AuraHub

| Variável | Descrição |
|----------|-----------|
| `AURA_IA_ENABLED` | `true` para ativar facade |
| `AURA_IA_BASE_URL` | URL interna da Aura IA |
| `AURA_IA_API_KEY` | **Mesmo valor** de `AURA_HUB_M2M_API_KEY` |
| `AURA_IA_TIMEOUT_MS` | Timeout do hop |

Produtos **nunca** recebem `AURA_IA_API_KEY`.

## Permissões Hub

- `ai:read` — listar specialists
- `ai:write` — chat

## Contrato detalhado

Ver [AURA_AI_API_CONTRACT.md](./AURA_AI_API_CONTRACT.md) (contrato oficial v1).
