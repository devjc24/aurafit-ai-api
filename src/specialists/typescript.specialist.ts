import { buildTypescriptSystemPrompt } from "../prompts/specialists/typescript.prompt";
import type { CapabilityId } from "../types/capability.types";
import type { SpecialistConfig } from "../types/specialist.types";
import { BaseSpecialist } from "./base.specialist";

export class TypescriptSpecialist extends BaseSpecialist {
  readonly id = "typescript";
  readonly name = "TypeScript";
  readonly description = "Especialista em TypeScript e tipagem estrita";
  readonly version = "1.0.0";
  readonly capabilities: readonly CapabilityId[] = [
    "code.generate",
    "code.review",
  ];
  readonly config: SpecialistConfig = {
    allowExecution: false,
    temperature: 0.25,
  };

  buildSystemPrompt(capability?: CapabilityId): string {
    return buildTypescriptSystemPrompt(capability);
  }
}
