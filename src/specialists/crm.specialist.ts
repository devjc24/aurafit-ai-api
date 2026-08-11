import { buildCrmSystemPrompt } from "../prompts/specialists/crm.prompt";
import type { CapabilityId } from "../types/capability.types";
import type { SpecialistConfig } from "../types/specialist.types";
import { BaseSpecialist } from "./base.specialist";

export class CrmSpecialist extends BaseSpecialist {
  readonly id = "crm";
  readonly name = "CRM";
  readonly description = "Especialista em comunicações e mensagens de CRM";
  readonly version = "1.0.0";
  readonly capabilities: readonly CapabilityId[] = ["crm.message.generate"];
  readonly config: SpecialistConfig = {
    allowExecution: false,
    temperature: 0.5,
  };

  buildSystemPrompt(capability?: CapabilityId): string {
    return buildCrmSystemPrompt(capability);
  }
}
