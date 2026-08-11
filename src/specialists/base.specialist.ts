import type { CapabilityId } from "../types/capability.types";
import { ValidationError } from "../types/errors";
import type {
  ISpecialist,
  SpecialistConfig,
  SpecialistContext,
  SpecialistRequestContext,
  SpecialistResult,
} from "../types/specialist.types";

export abstract class BaseSpecialist implements ISpecialist {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly version: string;
  abstract readonly capabilities: readonly CapabilityId[];
  abstract readonly config: SpecialistConfig;

  abstract buildSystemPrompt(capability?: CapabilityId): string;

  supports(capability: CapabilityId): boolean {
    return this.capabilities.includes(capability);
  }

  protected buildUserPrompt(
    prompt: string,
    requestContext?: SpecialistRequestContext
  ): string {
    const parts = [prompt.trim()];

    if (requestContext?.schema?.trim()) {
      parts.push(
        ["Schema disponível (fornecido pelo consumidor):", requestContext.schema.trim()].join(
          "\n"
        )
      );
    }

    return parts.join("\n\n");
  }

  async run(context: SpecialistContext): Promise<SpecialistResult> {
    if (context.capability && !this.supports(context.capability)) {
      throw new ValidationError(
        `Especialista ${this.id} não suporta a capability ${context.capability}`
      );
    }

    const userPrompt = this.buildUserPrompt(
      context.prompt,
      context.requestContext
    );

    const generation = await context.provider.generate(userPrompt, {
      system: this.buildSystemPrompt(context.capability),
      temperature: this.config.temperature,
    });

    return {
      specialistId: this.id,
      specialistName: this.name,
      specialistVersion: this.version,
      capability: context.capability,
      generation,
    };
  }
}
