import { describe, expect, it } from "vitest";
import {
  AURA_AI_HEADERS,
  aiRequestSchema,
  buildAIErrorResponse,
  buildAISuccessResponse,
} from "../../src/types/contract/index.ts";

describe("AuraHub AI contract DTOs", () => {
  it("valida AIRequest mínimo alinhado ao Hub", () => {
    const parsed = aiRequestSchema.parse({
      requestId: "9f3c2a1e-4b77-4d2a-9c1e-0a1b2c3d4e5f",
      application: "sia",
      tenant: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        companyId: "clxyz0123456789abcdefgh",
      },
      capability: "sql.generate",
      prompt: "liste clientes ativos",
      context: {
        schema: "CREATE TABLE clientes (id INT);",
      },
    });

    expect(parsed.application).toBe("sia");
    expect(parsed.tenant.id).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("rejeita model no AIRequest (chave extra)", () => {
    const result = aiRequestSchema.safeParse({
      requestId: "9f3c2a1e-4b77-4d2a-9c1e-0a1b2c3d4e5f",
      application: "aurafit",
      tenant: { id: "550e8400-e29b-41d4-a716-446655440000" },
      prompt: "olá",
      model: "qwen2.5-coder:3b",
    });

    expect(result.success).toBe(false);
  });

  it("monta AIResponse no envelope do Hub", () => {
    const response = buildAISuccessResponse(
      {
        requestId: "req-1",
        response: "ok",
        specialist: "general",
        provider: "ollama",
        model: "internal-model",
        durationMs: 10,
      },
      { correlationId: "cor-1" }
    );

    expect(response.success).toBe(true);
    expect(response.data?.response).toBe("ok");
    expect(response.meta.requestId).toBe("req-1");
    expect(response.errors).toEqual([]);
  });

  it("monta AIResponse de erro", () => {
    const response = buildAIErrorResponse({
      requestId: "req-2",
      message: "Falha",
      errors: [{ code: "PROVIDER_ERROR", message: "timeout" }],
      durationMs: 5,
    });

    expect(response.success).toBe(false);
    expect(response.data).toBeNull();
    expect(response.errors[0]?.code).toBe("PROVIDER_ERROR");
  });

  it("usa headers kebab-case do padrão Hub", () => {
    expect(AURA_AI_HEADERS.apiKey).toBe("x-api-key");
    expect(AURA_AI_HEADERS.requestId).toBe("x-request-id");
    expect(AURA_AI_HEADERS.correlationId).toBe("x-correlation-id");
    expect(AURA_AI_HEADERS.tenantId).toBe("x-tenant-id");
    expect(AURA_AI_HEADERS.system).toBe("x-aura-system");
  });
});
