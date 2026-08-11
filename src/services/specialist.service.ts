import type { ILlmProvider } from "../providers/llm/llm.provider";
import {
  getSpecialistRegistry,
  type ResolveSpecialistInput,
  type SpecialistRegistry,
} from "../specialists/registry";
import type {
  SpecialistRequestContext,
  SpecialistResolution,
  SpecialistResult,
} from "../types/specialist.types";
import { logger } from "../utils/logger";

export interface SpecialistRunInput extends ResolveSpecialistInput {
  prompt: string;
  requestContext?: SpecialistRequestContext;
}

export class SpecialistService {
  constructor(
    private readonly provider: ILlmProvider,
    private readonly registry: SpecialistRegistry = getSpecialistRegistry()
  ) {}

  resolve(input: ResolveSpecialistInput): SpecialistResolution {
    return this.registry.resolve(input);
  }

  async run(input: SpecialistRunInput): Promise<SpecialistResult> {
    const resolution = this.resolve({
      specialistId: input.specialistId,
      capabilityId: input.capabilityId,
    });

    logger.info("Specialist selecionado", {
      specialist: resolution.specialist.id,
      capability: resolution.capability,
      version: resolution.specialist.version,
      provider: this.provider.name,
    });

    return resolution.specialist.run({
      prompt: input.prompt,
      provider: this.provider,
      capability: resolution.capability,
      requestContext: input.requestContext,
    });
  }
}
