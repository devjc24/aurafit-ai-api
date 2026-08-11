"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const specialists_1 = require("../src/specialists");
const specialist_service_1 = require("../src/services/specialist.service");
const errors_1 = require("../src/types/errors");
const mock_llm_provider_1 = require("../helpers/mock-llm.provider");
(0, vitest_1.describe)("capability selection", () => {
    const registry = (0, specialists_1.createDefaultRegistry)();
    (0, vitest_1.it)("resolve sql.generate para specialist sql", () => {
        const resolution = registry.resolveByCapability("sql.generate");
        (0, vitest_1.expect)(resolution.specialist.id).toBe("sql");
        (0, vitest_1.expect)(resolution.capability).toBe("sql.generate");
    });
    (0, vitest_1.it)("resolve code.generate para nodejs (default)", () => {
        const resolution = registry.resolve({ capabilityId: "code.generate" });
        (0, vitest_1.expect)(resolution.specialist.id).toBe("nodejs");
        (0, vitest_1.expect)(resolution.capability).toBe("code.generate");
    });
    (0, vitest_1.it)("resolve code.review para typescript (default)", () => {
        const resolution = registry.resolve({ capabilityId: "code.review" });
        (0, vitest_1.expect)(resolution.specialist.id).toBe("typescript");
    });
    (0, vitest_1.it)("resolve crm.message.generate para crm", () => {
        const resolution = registry.resolve({
            capabilityId: "crm.message.generate",
        });
        (0, vitest_1.expect)(resolution.specialist.id).toBe("crm");
    });
    (0, vitest_1.it)("resolve logs.analyze para devops", () => {
        const resolution = registry.resolve({ capabilityId: "logs.analyze" });
        (0, vitest_1.expect)(resolution.specialist.id).toBe("devops");
    });
    (0, vitest_1.it)("falha para capability desconhecida", () => {
        (0, vitest_1.expect)(() => registry.resolve({ capabilityId: "quantum.teleport" })).toThrow(errors_1.NotFoundError);
    });
    (0, vitest_1.it)("SpecialistService executa capability sem expor modelo ao input", async () => {
        const provider = new mock_llm_provider_1.MockLlmProvider("ok");
        const service = new specialist_service_1.SpecialistService(provider, registry);
        const result = await service.run({
            prompt: "liste riscos",
            capabilityId: "database.analyze",
        });
        (0, vitest_1.expect)(result.specialistId).toBe("database");
        (0, vitest_1.expect)(result.capability).toBe("database.analyze");
        (0, vitest_1.expect)(provider.lastOptions?.system).toContain("database.analyze");
        (0, vitest_1.expect)(provider.lastOptions?.model).toBeUndefined();
    });
});
