import type { ILlmProvider } from "../providers/llm/llm.provider";
import type { SpecialistRegistry } from "../specialists/registry";
import { getSpecialistRegistry } from "../specialists/registry";
import type { ChatRequest, ChatResult } from "../types/chat.types";
import type { AIRequest } from "../types/contract/ai-request";
import type { AIResult } from "../types/contract/ai-response";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { SpecialistService } from "./specialist.service";

/**
 * Fachada da Aura IA.
 * Consumidores (via Hub) escolhem specialist/capability — nunca o modelo LLM.
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

  /**
   * Processamento no contrato Hub ↔ Aura IA.
   */
  async processHubRequest(input: AIRequest): Promise<AIResult> {
    const started = Date.now();

    const result = await this.specialistService.run({
      prompt: input.prompt,
      specialistId: input.specialist,
      capabilityId: input.capability,
      requestContext: {
        schema:
          typeof input.context?.schema === "string"
            ? input.context.schema
            : undefined,
        metadata: input.metadata
          ? Object.fromEntries(
              Object.entries(input.metadata).map(([k, v]) => [k, String(v)])
            )
          : undefined,
      },
    });

    const durationMs = Date.now() - started;
    const aiResult: AIResult = {
      requestId: input.requestId,
      response: result.generation.text,
      specialist: result.specialistId,
      specialistVersion: result.specialistVersion,
      capability: result.capability,
      provider: result.generation.provider,
      model: result.generation.model || env.model,
      usage: {
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
      },
      durationMs,
      error: null,
    };

    logger.info("AI request completed", {
      requestId: input.requestId,
      application: input.application,
      tenantId: input.tenant.id,
      companyId: input.tenant.companyId,
      userId: input.user?.id,
      specialist: aiResult.specialist,
      capability: aiResult.capability,
      provider: aiResult.provider,
      model: aiResult.model,
      durationMs,
      status: "success",
    });

    return aiResult;
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
