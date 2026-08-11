import type { ILlmProvider } from "../providers/llm/llm.provider";
import type { SpecialistRegistry } from "../specialists/registry";
import { getSpecialistRegistry } from "../specialists/registry";
import type { ChatRequest, ChatResult } from "../types/chat.types";
import { SpecialistService } from "./specialist.service";

/**
 * Fachada da Aura IA.
 * Consumidores escolhem specialist/capability — nunca o modelo LLM.
 */
export class AuraAiService {
  private readonly specialistService: SpecialistService;
  private readonly registry: SpecialistRegistry;

  constructor(
    provider: ILlmProvider,
    registry: SpecialistRegistry = getSpecialistRegistry()
  ) {
    this.registry = registry;
    this.specialistService = new SpecialistService(provider, registry);
  }

  async process(input: ChatRequest): Promise<ChatResult> {
    const result = await this.specialistService.run({
      prompt: input.prompt,
      specialistId: input.specialist,
      capabilityId: input.capability,
      requestContext: input.context,
    });

    return {
      response: result.generation.text,
      specialist: result.specialistId,
      specialistVersion: result.specialistVersion,
      capability: result.capability,
      provider: result.generation.provider,
    };
  }

  listSpecialists() {
    return this.registry.list().map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      version: s.version,
      capabilities: [...s.capabilities],
    }));
  }

  listCapabilities() {
    return this.registry.listCapabilities();
  }
}
