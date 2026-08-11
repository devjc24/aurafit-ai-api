import type { ILlmProvider, LlmGenerateResult } from "../providers/llm/llm.provider";

export interface SpecialistContext {
  prompt: string;
  provider: ILlmProvider;
  model?: string;
}

export interface SpecialistResult {
  specialistId: string;
  specialistName: string;
  generation: LlmGenerateResult;
}

export interface ISpecialist {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  buildSystemPrompt(): string;
  run(context: SpecialistContext): Promise<SpecialistResult>;
}
