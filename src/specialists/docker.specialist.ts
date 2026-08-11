import { buildDockerSystemPrompt } from "../prompts/specialists/docker.prompt";
import type { CapabilityId } from "../types/capability.types";
import type { SpecialistConfig } from "../types/specialist.types";
import { BaseSpecialist } from "./base.specialist";

export class DockerSpecialist extends BaseSpecialist {
  readonly id = "docker";
  readonly name = "Docker";
  readonly description = "Especialista em Docker e Compose";
  readonly version = "1.0.0";
  readonly capabilities: readonly CapabilityId[] = [];
  readonly config: SpecialistConfig = {
    allowExecution: false,
    temperature: 0.3,
  };

  buildSystemPrompt(capability?: CapabilityId): string {
    return buildDockerSystemPrompt(capability);
  }
}
