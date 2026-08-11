import type {
  ISpecialist,
  SpecialistContext,
  SpecialistResult,
} from "../types/specialist.types";

export abstract class BaseSpecialist implements ISpecialist {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;

  abstract buildSystemPrompt(): string;

  async run(context: SpecialistContext): Promise<SpecialistResult> {
    const generation = await context.provider.generate(context.prompt, {
      system: this.buildSystemPrompt(),
      model: context.model,
    });

    return {
      specialistId: this.id,
      specialistName: this.name,
      generation,
    };
  }
}
