import { buildNodejsSystemPrompt } from "../prompts/specialists/nodejs.prompt";
import type { CapabilityId } from "../types/capability.types";
import type { SpecialistConfig } from "../types/specialist.types";
import { BaseSpecialist } from "./base.specialist";

export class NodejsSpecialist extends BaseSpecialist {
  readonly id = "nodejs";
  readonly name = "Node.js";
  readonly description = "Especialista em Node.js e JavaScript no backend";
  readonly version = "1.0.0";
  readonly capabilities: readonly CapabilityId[] = [
    "code.generate",
    "code.review",
  ];
  readonly config: SpecialistConfig = {
    allowExecution: false,
    temperature: 0.3,
  };

  buildSystemPrompt(capability?: CapabilityId): string {
    return buildNodejsSystemPrompt(capability);
  }
}
