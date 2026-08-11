import type {
  ILlmProvider,
  LlmGenerateOptions,
  LlmGenerateResult,
} from "../../src/providers/llm/llm.provider.ts";

export class MockLlmProvider implements ILlmProvider {
  readonly name = "mock";
  public lastPrompt?: string;
  public lastOptions?: LlmGenerateOptions;
  public calls = 0;

  constructor(private readonly responseText = "mock-response") {}

  async generate(
    prompt: string,
    options?: LlmGenerateOptions
  ): Promise<LlmGenerateResult> {
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
