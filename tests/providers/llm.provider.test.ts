import { describe, expect, it } from "vitest";
import type { ILlmProvider } from "../../src/providers/llm/llm.provider.ts";
import { AuraAiService } from "../../src/services/aura-ai.service.ts";
import { createDefaultRegistry } from "../../src/specialists/index.ts";
import { SqlSpecialist } from "../../src/specialists/sql.specialist.ts";
import { MockLlmProvider } from "../helpers/mock-llm.provider.ts";

describe("provider abstraction", () => {
  it("specialists dependem apenas de ILlmProvider", async () => {
    const provider: ILlmProvider = new MockLlmProvider("select 1");
    const sql = new SqlSpecialist();

    const result = await sql.run({
      prompt: "gere um select",
      provider,
      capability: "sql.generate",
      requestContext: {
        schema: "CREATE TABLE users (id INT, name VARCHAR(100));",
      },
    });

    expect(result.generation.provider).toBe("mock");
    expect(result.generation.text).toBe("select 1");
    expect((provider as MockLlmProvider).lastPrompt).toContain(
      "CREATE TABLE users"
    );
    expect((provider as MockLlmProvider).lastOptions?.system).toContain(
      "Nunca invente tabelas"
    );
  });

  it("AuraAiService não aceita modelo do consumidor", async () => {
    const provider = new MockLlmProvider("resposta");
    const registry = createDefaultRegistry();
    const aura = new AuraAiService(provider, registry);

    const result = await aura.process({
      prompt: "olá",
      specialist: "general",
    });

    expect(result.response).toBe("resposta");
    expect(result).not.toHaveProperty("model");
    expect(provider.lastOptions?.model).toBeUndefined();
    expect(Object.keys(result).sort()).toEqual(
      [
        "capability",
        "provider",
        "response",
        "specialist",
        "specialistVersion",
      ].sort()
    );
  });

  it("MockLlmProvider satisfaz o contrato ILlmProvider", async () => {
    const provider: ILlmProvider = new MockLlmProvider("ok");
    const out = await provider.generate("ping", { system: "sys" });
    expect(out).toMatchObject({
      text: "ok",
      provider: "mock",
      model: "internal-model",
    });
  });
});
