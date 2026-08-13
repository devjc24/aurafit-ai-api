import { z } from "zod";

/**
 * Item de erro alinhado ao envelope AuraHub.
 * Códigos oficiais: docs/AURA_AI_API_CONTRACT.md
 */
export const aiErrorItemSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  field: z.string().optional(),
});

export const aiUsageSchema = z.object({
  promptTokens: z.number().int().nonnegative().nullable().optional(),
  completionTokens: z.number().int().nonnegative().nullable().optional(),
  totalTokens: z.number().int().nonnegative().nullable().optional(),
});

/**
 * Payload de negócio (`data`) do hop Hub → Aura IA.
 *
 * Campos públicos do contrato: requestId, response, specialist, capability.
 * provider/model são opcionais (auditoria Hub); produtos não devem depender deles.
 */
export const aiResultSchema = z.object({
  requestId: z.string().min(1),
  response: z.string(),
  specialist: z.string().min(1),
  specialistVersion: z.string().optional(),
  capability: z.string().optional(),
  /** Somente auditoria no hop Hub↔IA — não é API pública de produtos. */
  provider: z.string().min(1).optional(),
  /** Modelo efetivo — interno; nunca escolhido pelo consumidor. */
  model: z.string().min(1).optional(),
  usage: aiUsageSchema.optional(),
  durationMs: z.number().int().nonnegative(),
  error: z.null().optional(),
});

export const aiResponseMetaSchema = z.object({
  requestId: z.string().min(1),
  correlationId: z.string().optional(),
  durationMs: z.number().int().nonnegative().optional(),
});

/**
 * Envelope HTTP alinhado ao padrão AuraHub:
 * { success, message, data, errors, meta }
 */
export const aiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: aiResultSchema.nullable(),
  errors: z.array(aiErrorItemSchema),
  meta: aiResponseMetaSchema,
});

export type AIErrorItem = z.infer<typeof aiErrorItemSchema>;
export type AIUsage = z.infer<typeof aiUsageSchema>;
export type AIResult = z.infer<typeof aiResultSchema>;
export type AIResponseMeta = z.infer<typeof aiResponseMetaSchema>;
export type AIResponse = z.infer<typeof aiResponseSchema>;

export function buildAISuccessResponse(
  result: AIResult,
  meta: Pick<AIResponseMeta, "correlationId"> & { message?: string } = {}
): AIResponse {
  return {
    success: true,
    message: meta.message ?? "",
    data: result,
    errors: [],
    meta: {
      requestId: result.requestId,
      correlationId: meta.correlationId,
      durationMs: result.durationMs,
    },
  };
}

export function buildAIErrorResponse(input: {
  requestId: string;
  correlationId?: string;
  message: string;
  errors: AIErrorItem[];
  durationMs?: number;
}): AIResponse {
  return {
    success: false,
    message: input.message,
    data: null,
    errors: input.errors,
    meta: {
      requestId: input.requestId,
      correlationId: input.correlationId,
      durationMs: input.durationMs,
    },
  };
}
