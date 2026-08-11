import { GENERAL_SPECIALIST_SYSTEM_PROMPT } from "../prompts/specialists/general.prompt";
import { BaseSpecialist } from "./base.specialist";

export class GeneralSpecialist extends BaseSpecialist {
  readonly id = "general";
  readonly name = "Geral";
  readonly description = "Assistente geral da Aura IA";

  buildSystemPrompt(): string {
    return GENERAL_SPECIALIST_SYSTEM_PROMPT;
  }
}
