import { describe, expect, it } from "vitest";
import { createDefaultRegistry } from "../../src/specialists/index.ts";
import { SpecialistService } from "../../src/services/specialist.service.ts";
import { NotFoundError } from "../../src/types/errors.ts";
import { MockLlmProvider } from "../helpers/mock-llm.provider.ts";

describe("capability selection", () => {
  const registry = createDefaultRegistry();

  it("resolve sql.generate para specialist sql", () => {
    const resolution = registry.resolveByCapability("sql.generate");
    expect(resolution.specialist.id).toBe("sql");
    expect(resolution.capability).toBe("sql.generate");
  });

  it("resolve code.generate para nodejs (default)", () => {
    const resolution = registry.resolve({ capabilityId: "code.generate" });
    expect(resolution.specialist.id).toBe("nodejs");
    expect(resolution.capability).toBe("code.generate");
  });

  it("resolve code.review para typescript (default)", () => {
    const resolution = registry.resolve({ capabilityId: "code.review" });
    expect(resolution.specialist.id).toBe("typescript");
  });

  it("resolve crm.message.generate para crm", () => {
    const resolution = registry.resolve({
      capabilityId: "crm.message.generate",
    });
    expect(resolution.specialist.id).toBe("crm");
  });

  it("resolve logs.analyze para devops", () => {
    const resolution = registry.resolve({ capabilityId: "logs.analyze" });
    expect(resolution.specialist.id).toBe("devops");
  });

  it("falha para capability desconhecida", () => {
    expect(() =>
      registry.resolve({ capabilityId: "quantum.teleport" })
    ).toThrow(NotFoundError);
  });

  it("SpecialistService executa capability sem expor modelo ao input", async () => {
    const provider = new MockLlmProvider("ok");
    const service = new SpecialistService(provider, registry);

    const result = await service.run({
      prompt: "liste riscos",
      capabilityId: "database.analyze",
    });

    expect(result.specialistId).toBe("database");
    expect(result.capability).toBe("database.analyze");
    expect(provider.lastOptions?.system).toContain("database.analyze");
    expect(provider.lastOptions?.model).toBeUndefined();
  });
});
