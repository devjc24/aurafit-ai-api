import { describe, expect, it } from "vitest";
import { createDefaultRegistry } from "../../src/specialists/index.ts";
import { NotFoundError, ValidationError } from "../../src/types/errors.ts";

describe("specialist selection", () => {
  const registry = createDefaultRegistry();

  it("usa general quando nada é informado", () => {
    const resolution = registry.resolve({});
    expect(resolution.specialist.id).toBe("general");
    expect(resolution.capability).toBeUndefined();
  });

  it("seleciona por specialist id", () => {
    const resolution = registry.resolve({ specialistId: "linux" });
    expect(resolution.specialist.id).toBe("linux");
    expect(resolution.capability).toBeUndefined();
  });

  it("falha para specialist inexistente", () => {
    expect(() => registry.resolve({ specialistId: "cobol" })).toThrow(
      NotFoundError
    );
  });

  it("valida specialist + capability incompatíveis", () => {
    expect(() =>
      registry.resolve({
        specialistId: "crm",
        capabilityId: "sql.generate",
      })
    ).toThrow(ValidationError);
  });

  it("aceita specialist + capability compatíveis", () => {
    const resolution = registry.resolve({
      specialistId: "typescript",
      capabilityId: "code.review",
    });
    expect(resolution.specialist.id).toBe("typescript");
    expect(resolution.capability).toBe("code.review");
  });
});
