"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const specialists_1 = require("../src/specialists");
const capability_types_1 = require("../src/types/capability.types");
(0, vitest_1.describe)("SpecialistRegistry", () => {
    (0, vitest_1.it)("registra e lista especialistas padrão", () => {
        const registry = (0, specialists_1.createDefaultRegistry)();
        const ids = registry.list().map((s) => s.id);
        (0, vitest_1.expect)(ids).toEqual(vitest_1.expect.arrayContaining([
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
        ]));
        (0, vitest_1.expect)(ids).toHaveLength(10);
    });
    (0, vitest_1.it)("impede registro duplicado", () => {
        const registry = (0, specialists_1.createEmptyRegistry)();
        registry.register(new specialists_1.SqlSpecialist());
        (0, vitest_1.expect)(() => registry.register(new specialists_1.SqlSpecialist())).toThrow(/já registrado/);
    });
    (0, vitest_1.it)("expõe catálogo de capabilities", () => {
        const registry = (0, specialists_1.createDefaultRegistry)();
        const capabilities = registry.listCapabilities();
        (0, vitest_1.expect)(capabilities.map((c) => c.id).sort()).toEqual([...capability_types_1.CAPABILITY_IDS].sort());
    });
    (0, vitest_1.it)("todos os specialists têm allowExecution=false", () => {
        const registry = (0, specialists_1.createDefaultRegistry)();
        for (const specialist of registry.list()) {
            (0, vitest_1.expect)(specialist.config.allowExecution).toBe(false);
        }
    });
});
