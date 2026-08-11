"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const specialists_1 = require("../src/specialists");
const errors_1 = require("../src/types/errors");
(0, vitest_1.describe)("specialist selection", () => {
    const registry = (0, specialists_1.createDefaultRegistry)();
    (0, vitest_1.it)("usa general quando nada é informado", () => {
        const resolution = registry.resolve({});
        (0, vitest_1.expect)(resolution.specialist.id).toBe("general");
        (0, vitest_1.expect)(resolution.capability).toBeUndefined();
    });
    (0, vitest_1.it)("seleciona por specialist id", () => {
        const resolution = registry.resolve({ specialistId: "linux" });
        (0, vitest_1.expect)(resolution.specialist.id).toBe("linux");
        (0, vitest_1.expect)(resolution.capability).toBeUndefined();
    });
    (0, vitest_1.it)("falha para specialist inexistente", () => {
        (0, vitest_1.expect)(() => registry.resolve({ specialistId: "cobol" })).toThrow(errors_1.NotFoundError);
    });
    (0, vitest_1.it)("valida specialist + capability incompatíveis", () => {
        (0, vitest_1.expect)(() => registry.resolve({
            specialistId: "crm",
            capabilityId: "sql.generate",
        })).toThrow(errors_1.ValidationError);
    });
    (0, vitest_1.it)("aceita specialist + capability compatíveis", () => {
        const resolution = registry.resolve({
            specialistId: "typescript",
            capabilityId: "code.review",
        });
        (0, vitest_1.expect)(resolution.specialist.id).toBe("typescript");
        (0, vitest_1.expect)(resolution.capability).toBe("code.review");
    });
});
