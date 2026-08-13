import { describe, expect, it } from "vitest";
import {
  createCapabilityRegistry,
  getCapabilityRegistry,
  CAPABILITY_IDS,
} from "../../src/capabilities/index.ts";
import { AuraAiService } from "../../src/services/aura-ai.service.ts";
import { createDefaultRegistry } from "../../src/specialists/index.ts";
import { capabilityInvokeSchema } from "../../src/types/capability-invoke.types.ts";
import { MockLlmProvider } from "../helpers/mock-llm.provider.ts";

describe("CapabilityRegistry", () => {
  it("lista capabilities iniciais", () => {
    const registry = createCapabilityRegistry();
    expect(registry.list().map((c) => c.id).sort()).toEqual(
      [...CAPABILITY_IDS].sort()
    );
  });

  it("resolve specialist default", () => {
    const registry = getCapabilityRegistry();
    expect(registry.resolveDefaultSpecialistId("sql.generate")).toBe("sql");
    expect(registry.resolveDefaultSpecialistId("code.review")).toBe(
      "typescript"
    );
  });
});

describe("capability invoke", () => {
  it("rejeita model no body", () => {
    const parsed = capabilityInvokeSchema.safeParse({
      prompt: "gere select",
      model: "qwen2.5-coder:3b",
    });
    expect(parsed.success).toBe(false);
  });

  it("processCapability usa provider sem modelo do consumidor", async () => {
    const provider = new MockLlmProvider("SELECT 1");
    const aura = new AuraAiService(provider, createDefaultRegistry());
    const result = await aura.processCapability("sql.generate", {
      prompt: "liste ids",
      context: { schema: "CREATE TABLE t(id INT);" },
    });

    expect(result.capability).toBe("sql.generate");
    expect(result.specialist).toBe("sql");
    expect(result.provider).toBe("mock");
    expect(provider.lastOptions?.model).toBeUndefined();
  });
});
