/**
 * Códigos de erro oficiais do contrato AuraHub ↔ Aura IA (v1).
 * @see docs/AURA_AI_API_CONTRACT.md
 */
export const AURA_AI_ERROR_CODES = [
  "AUTHENTICATION_ERROR",
  "AUTHORIZATION_ERROR",
  "VALIDATION_ERROR",
  "RATE_LIMITED",
  "PROVIDER_TIMEOUT",
  "PROVIDER_ERROR",
  "AI_ERROR",
  "INTERNAL_ERROR",
] as const;

export type AuraAiErrorCode = (typeof AURA_AI_ERROR_CODES)[number];

/**
 * Códigos auxiliares (ainda válidos no envelope `errors[].code`).
 * Preferir mapear para um código oficial quando possível.
 */
export const AURA_AI_EXTENDED_ERROR_CODES = [
  ...AURA_AI_ERROR_CODES,
  "BAD_REQUEST",
  "NOT_FOUND",
  "SPECIALIST_NOT_FOUND",
  "CAPABILITY_NOT_FOUND",
  "REQUEST_ID_MISMATCH",
] as const;

export type AuraAiExtendedErrorCode =
  (typeof AURA_AI_EXTENDED_ERROR_CODES)[number];
