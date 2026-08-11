import { z } from "zod";

/**
 * Contexto de tenant assertado pelo AuraHub (nunca pelo produto final).
 */
export const aiTenantSchema = z.object({
  /** UUID do Tenant (ADR-0009). */
  id: z.string().uuid("tenant.id deve ser UUID"),
  /** Company cuid operacional do Hub. */
  companyId: z.string().trim().min(1).optional(),
});

export const aiUserContextSchema = z.object({
  id: z.string().trim().min(1).optional(),
  roles: z.array(z.string().trim().min(1)).optional(),
  /** Evitar PII desnecessária; opcional. */
  email: z.string().email().optional(),
});

export const aiRequestContextSchema = z
  .object({
    schema: z.string().trim().min(1).optional(),
    locale: z.string().trim().min(2).max(16).optional(),
  })
  .passthrough();

/**
 * Contrato Hub → Aura IA (body de POST /api/v1/ai/chat).
 * O consumidor de plataforma NÃO envia model/provider.
 */
export const aiRequestSchema = z
  .object({
    requestId: z.string().trim().min(1, "requestId obrigatório"),
    application: z
      .string()
      .trim()
      .min(1, "application obrigatório")
      .regex(
        /^[a-z][a-z0-9_-]*$/,
        "application deve ser slug (ex.: sia, aurafit, crm)"
      ),
    tenant: aiTenantSchema,
    user: aiUserContextSchema.optional(),
    specialist: z.string().trim().min(1).optional(),
    capability: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1, "prompt obrigatório"),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .optional(),
    context: aiRequestContextSchema.optional(),
  })
  .strict();

export type AITenant = z.infer<typeof aiTenantSchema>;
export type AIUserContext = z.infer<typeof aiUserContextSchema>;
export type AIRequestContext = z.infer<typeof aiRequestContextSchema>;
export type AIRequest = z.infer<typeof aiRequestSchema>;
