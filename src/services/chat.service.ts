import type { ILlmProvider } from "../providers/llm/llm.provider";
import { bootstrapSpecialistRegistry } from "../specialists";
import type { ChatRequest, ChatResult } from "../types/chat.types";
import { AuraAiService } from "./aura-ai.service";

/**
 * Compatibilidade: chat genérico delega para AuraAiService.
 */
export class ChatService {
  private readonly auraAi: AuraAiService;

  constructor(provider: ILlmProvider) {
    bootstrapSpecialistRegistry();
    this.auraAi = new AuraAiService(provider);
  }

  async chat(input: ChatRequest): Promise<ChatResult> {
    return this.auraAi.process(input);
  }
}
