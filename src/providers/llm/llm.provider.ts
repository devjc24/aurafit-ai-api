export interface LlmGenerateOptions {
  system?: string;
  model?: string;
  temperature?: number;
}

export interface LlmGenerateResult {
  text: string;
  model: string;
  provider: string;
}

/**
 * Porta de geração de texto.
 * Specialists e services devem depender apenas desta interface —
 * nunca de Axios ou do Ollama diretamente.
 */
export interface ILlmProvider {
  readonly name: string;
  generate(
    prompt: string,
    options?: LlmGenerateOptions
  ): Promise<LlmGenerateResult>;
}
