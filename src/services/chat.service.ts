import type { ILlmProvider } from "../providers/llm/llm.provider";
import type { ChatRequest, ChatResult } from "../types/chat.types";
import { SpecialistService } from "./specialist.service";

export class ChatService {
  private readonly specialistService: SpecialistService;

  constructor(provider: ILlmProvider) {
    this.specialistService = new SpecialistService(provider);
  }

  async chat(input: ChatRequest): Promise<ChatResult> {
    const result = await this.specialistService.run(
      input.prompt,
      input.specialist ?? "general"
    );

    return {
      response: result.generation.text,
      specialist: result.specialistId,
      model: result.generation.model,
      provider: result.generation.provider,
    };
  }
}
