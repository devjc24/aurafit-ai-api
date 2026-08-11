import type { ILlmProvider } from "../providers/llm/llm.provider";
import { getSpecialist } from "../specialists";
import type {
  SpecialistContext,
  SpecialistResult,
} from "../types/specialist.types";

export class SpecialistService {
  constructor(private readonly provider: ILlmProvider) {}

  async run(
    prompt: string,
    specialistId = "general",
    model?: string
  ): Promise<SpecialistResult> {
    const specialist = getSpecialist(specialistId);
    const context: SpecialistContext = {
      prompt,
      provider: this.provider,
      model,
    };
    return specialist.run(context);
  }
}
