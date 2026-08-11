import { buildLinuxSystemPrompt } from "../prompts/specialists/linux.prompt";
import type { CapabilityId } from "../types/capability.types";
import type { SpecialistConfig } from "../types/specialist.types";
import { BaseSpecialist } from "./base.specialist";

export class LinuxSpecialist extends BaseSpecialist {
  readonly id = "linux";
  readonly name = "Linux";
  readonly description = "Especialista em administração e troubleshooting Linux";
  readonly version = "1.0.0";
  readonly capabilities: readonly CapabilityId[] = [];
  readonly config: SpecialistConfig = {
    allowExecution: false,
    temperature: 0.3,
  };

  buildSystemPrompt(capability?: CapabilityId): string {
    return buildLinuxSystemPrompt(capability);
  }
}
