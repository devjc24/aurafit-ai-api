"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const prompts_1 = require("../src/prompts");
const specialists_1 = require("../src/specialists");
(0, vitest_1.describe)("prompt loading", () => {
    (0, vitest_1.it)("carrega prompt SQL com regra de não inventar schema", () => {
        const prompt = (0, prompts_1.buildSqlSystemPrompt)("sql.generate");
        (0, vitest_1.expect)(prompt).toContain("Nunca invente tabelas");
        (0, vitest_1.expect)(prompt).toContain("schema não estiver disponível");
        (0, vitest_1.expect)(prompt).toContain("sql.generate");
        (0, vitest_1.expect)(prompt).toContain(prompts_1.SECURITY_SYSTEM_RULES);
    });
    (0, vitest_1.it)("carrega prompt geral com regras de segurança", () => {
        const prompt = (0, prompts_1.buildGeneralSystemPrompt)();
        (0, vitest_1.expect)(prompt).toContain("Aura IA");
        (0, vitest_1.expect)(prompt).toContain("NÃO executa");
    });
    (0, vitest_1.it)("cada specialist carrega system prompt não vazio", () => {
        const registry = (0, specialists_1.createDefaultRegistry)();
        for (const specialist of registry.list()) {
            const prompt = specialist.buildSystemPrompt();
            (0, vitest_1.expect)(prompt.trim().length).toBeGreaterThan(40);
            (0, vitest_1.expect)(prompt).toContain("NÃO executa");
        }
    });
    (0, vitest_1.it)("CRM capability enriquece o prompt", () => {
        const base = (0, prompts_1.buildCrmSystemPrompt)();
        const withCapability = (0, prompts_1.buildCrmSystemPrompt)("crm.message.generate");
        (0, vitest_1.expect)(withCapability.length).toBeGreaterThan(base.length);
        (0, vitest_1.expect)(withCapability).toContain("crm.message.generate");
    });
});
