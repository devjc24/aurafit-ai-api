import { buildSqlSystemPrompt } from "../prompts/specialists/sql.prompt";
import type { CapabilityId } from "../types/capability.types";
import type { SpecialistConfig } from "../types/specialist.types";
import { BaseSpecialist } from "./base.specialist";

export class SqlSpecialist extends BaseSpecialist {
  readonly id = "sql";
  readonly name = "SQL";
  readonly description =
    "Especialista em geração e análise de SQL sem inventar schema";
  readonly version = "1.0.0";
  readonly capabilities: readonly CapabilityId[] = [
    "sql.generate",
    "sql.analyze",
  ];
  readonly config: SpecialistConfig = {
    allowExecution: false,
    temperature: 0.1,
    notes: "Nunca executa SQL; exige schema para afirmações estruturais",
  };

  buildSystemPrompt(capability?: CapabilityId): string {
    return buildSqlSystemPrompt(capability);
  }
}
