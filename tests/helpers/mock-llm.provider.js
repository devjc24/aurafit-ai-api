"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockLlmProvider = void 0;
class MockLlmProvider {
    constructor(responseText = "mock-response") {
        this.responseText = responseText;
        this.name = "mock";
        this.calls = 0;
    }
    async generate(prompt, options) {
        this.calls += 1;
        this.lastPrompt = prompt;
        this.lastOptions = options;
        return {
            text: this.responseText,
            model: "internal-model",
            provider: this.name,
        };
    }
}
exports.MockLlmProvider = MockLlmProvider;
