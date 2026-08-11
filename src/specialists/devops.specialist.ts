import { buildDevopsSystemPrompt } from "../prompts/specialists/devops.prompt";
import type { CapabilityId } from "../types/capability.types";
import type { SpecialistConfig } from "../types/specialist.types";
import { BaseSpecialist } from "./base.specialist";

export class DevopsSpecialist extends BaseSpecialist {
  readonly id = "devops";
  readonly name = "DevOps";
  readonly description = "Especialista em DevOps, CI/CD e análise de logs";
  readonly version = "1.0.0";
  readonly capabilities: readonly CapabilityId[] = ["logs.analyze"];
  readonly config: SpecialistConfig = {
    allowExecution: false,
    temperature: 0.3,
  };

  buildSystemPrompt(capability?: CapabilityId): string {
    return buildDevopsSystemPrompt(capability);
  }
}
