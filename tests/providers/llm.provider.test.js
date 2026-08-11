"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const aura_ai_service_1 = require("../src/services/aura-ai.service");
const specialists_1 = require("../src/specialists");
const sql_specialist_1 = require("../src/specialists/sql.specialist");
const mock_llm_provider_1 = require("../helpers/mock-llm.provider");
(0, vitest_1.describe)("provider abstraction", () => {
    (0, vitest_1.it)("specialists dependem apenas de ILlmProvider", async () => {
        const provider = new mock_llm_provider_1.MockLlmProvider("select 1");
        const sql = new sql_specialist_1.SqlSpecialist();
        const result = await sql.run({
            prompt: "gere um select",
            provider,
            capability: "sql.generate",
            requestContext: {
                schema: "CREATE TABLE users (id INT, name VARCHAR(100));",
            },
        });
        (0, vitest_1.expect)(result.generation.provider).toBe("mock");
        (0, vitest_1.expect)(result.generation.text).toBe("select 1");
        (0, vitest_1.expect)(provider.lastPrompt).toContain("CREATE TABLE users");
        (0, vitest_1.expect)(provider.lastOptions?.system).toContain("Nunca invente tabelas");
    });
    (0, vitest_1.it)("AuraAiService não aceita modelo do consumidor", async () => {
        const provider = new mock_llm_provider_1.MockLlmProvider("resposta");
        const registry = (0, specialists_1.createDefaultRegistry)();
        const aura = new aura_ai_service_1.AuraAiService(provider, registry);
        const result = await aura.process({
            prompt: "olá",
            specialist: "general",
        });
        (0, vitest_1.expect)(result.response).toBe("resposta");
        (0, vitest_1.expect)(result).not.toHaveProperty("model");
        (0, vitest_1.expect)(provider.lastOptions?.model).toBeUndefined();
        (0, vitest_1.expect)(Object.keys(result).sort()).toEqual(["capability", "provider", "response", "specialist", "specialistVersion"].sort());
    });
    (0, vitest_1.it)("MockLlmProvider satisfaz o contrato ILlmProvider", async () => {
        const provider = new mock_llm_provider_1.MockLlmProvider("ok");
        const out = await provider.generate("ping", { system: "sys" });
        (0, vitest_1.expect)(out).toMatchObject({
            text: "ok",
            provider: "mock",
            model: "internal-model",
        });
    });
});
