import { describe, expect, it } from "vitest";
import {
  createDefaultRegistry,
  createEmptyRegistry,
  SqlSpecialist,
} from "../../src/specialists/index.ts";
import { CAPABILITY_IDS } from "../../src/types/capability.types.ts";

describe("SpecialistRegistry", () => {
  it("registra e lista especialistas padrão", () => {
    const registry = createDefaultRegistry();
    const ids = registry.list().map((s) => s.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        "general",
        "sql",
        "database",
        "nodejs",
        "typescript",
        "crm",
        "devops",
        "docker",
        "linux",
        "git",
      ])
    );
    expect(ids).toHaveLength(10);
  });

  it("impede registro duplicado", () => {
    const registry = createEmptyRegistry();
    registry.register(new SqlSpecialist());
    expect(() => registry.register(new SqlSpecialist())).toThrow(
      /já registrado/
    );
  });

  it("expõe catálogo de capabilities", () => {
    const registry = createDefaultRegistry();
    const capabilities = registry.listCapabilities();
    expect(capabilities.map((c) => c.id).sort()).toEqual(
      [...CAPABILITY_IDS].sort()
    );
  });

  it("todos os specialists têm allowExecution=false", () => {
    const registry = createDefaultRegistry();
    for (const specialist of registry.list()) {
      expect(specialist.config.allowExecution).toBe(false);
    }
  });
});
