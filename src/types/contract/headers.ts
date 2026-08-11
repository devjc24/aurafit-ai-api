/**
 * Headers canônicos do hop AuraHub → Aura IA (M2M).
 * Alinhados aos padrões já usados no AuraHub / aura-gateway / SIA.
 *
 * NÃO inventar Pascal-Case (ex.: X-Client-App) neste contrato.
 */
export const AURA_AI_HEADERS = {
  /** Autenticação M2M Hub↔Aura IA (obrigatório). */
  apiKey: "x-api-key",
  /** ID da requisição (obrigatório; ecoado na resposta). */
  requestId: "x-request-id",
  /** Correlação end-to-end (recomendado). */
  correlationId: "x-correlation-id",
  /** Tenant UUID global — ADR-0009 (recomendado). */
  tenantId: "x-tenant-id",
  /** Company cuid operacional do Hub (opcional). */
  companyId: "x-company-id",
  /** Slug do system/aplicação: sia | aurafit | crm | ... */
  system: "x-aura-system",
  /** Marcação do aura-gateway (opcional). */
  gateway: "x-aura-gateway",
  gatewayRoute: "x-aura-gateway-route",
} as const;

export type AuraAiHeaderName =
  (typeof AURA_AI_HEADERS)[keyof typeof AURA_AI_HEADERS];
