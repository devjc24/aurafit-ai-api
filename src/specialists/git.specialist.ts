import { buildGitSystemPrompt } from "../prompts/specialists/git.prompt";
import type { CapabilityId } from "../types/capability.types";
import type { SpecialistConfig } from "../types/specialist.types";
import { BaseSpecialist } from "./base.specialist";

export class GitSpecialist extends BaseSpecialist {
  readonly id = "git";
  readonly name = "Git";
  readonly description = "Especialista em Git e fluxos de versionamento";
  readonly version = "1.0.0";
  readonly capabilities: readonly CapabilityId[] = [];
  readonly config: SpecialistConfig = {
    allowExecution: false,
    temperature: 0.3,
  };

  buildSystemPrompt(capability?: CapabilityId): string {
    return buildGitSystemPrompt(capability);
  }
}
