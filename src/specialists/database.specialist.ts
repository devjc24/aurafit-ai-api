import { buildDatabaseSystemPrompt } from "../prompts/specialists/database.prompt";
import type { CapabilityId } from "../types/capability.types";
import type { SpecialistConfig } from "../types/specialist.types";
import { BaseSpecialist } from "./base.specialist";

export class DatabaseSpecialist extends BaseSpecialist {
  readonly id = "database";
  readonly name = "Database";
  readonly description = "Especialista em modelagem e análise de bancos de dados";
  readonly version = "1.0.0";
  readonly capabilities: readonly CapabilityId[] = ["database.analyze"];
  readonly config: SpecialistConfig = {
    allowExecution: false,
    temperature: 0.2,
  };

  buildSystemPrompt(capability?: CapabilityId): string {
    return buildDatabaseSystemPrompt(capability);
  }
}
