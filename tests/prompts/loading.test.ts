import { describe, expect, it } from "vitest";
import {
  buildCrmSystemPrompt,
  buildGeneralSystemPrompt,
  buildSqlSystemPrompt,
  SECURITY_SYSTEM_RULES,
} from "../../src/prompts/index.ts";
import { createDefaultRegistry } from "../../src/specialists/index.ts";

describe("prompt loading", () => {
  it("carrega prompt SQL com regra de não inventar schema", () => {
    const prompt = buildSqlSystemPrompt("sql.generate");
    expect(prompt).toContain("Nunca invente tabelas");
    expect(prompt).toContain("schema não estiver disponível");
    expect(prompt).toContain("sql.generate");
    expect(prompt).toContain(SECURITY_SYSTEM_RULES);
  });

  it("carrega prompt geral com regras de segurança", () => {
    const prompt = buildGeneralSystemPrompt();
    expect(prompt).toContain("Aura IA");
    expect(prompt).toContain("NÃO executa");
  });

  it("cada specialist carrega system prompt não vazio", () => {
    const registry = createDefaultRegistry();
    for (const specialist of registry.list()) {
      const prompt = specialist.buildSystemPrompt();
      expect(prompt.trim().length).toBeGreaterThan(40);
      expect(prompt).toContain("NÃO executa");
    }
  });

  it("CRM capability enriquece o prompt", () => {
    const base = buildCrmSystemPrompt();
    const withCapability = buildCrmSystemPrompt("crm.message.generate");
    expect(withCapability.length).toBeGreaterThan(base.length);
    expect(withCapability).toContain("crm.message.generate");
  });
});
