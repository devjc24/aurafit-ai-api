import type { ILlmProvider, LlmGenerateResult } from "../providers/llm/llm.provider";
import type { CapabilityId } from "./capability.types";

export interface SpecialistConfig {
  /** Temperatura enviada ao provider (controle interno). */
  temperature?: number;
  /** Especialistas nunca executam ações automaticamente. */
  allowExecution: false;
  /** Observações internas de configuração. */
  notes?: string;
}

export interface SpecialistRequestContext {
  /** Schema de banco (SQL/database). Nunca inventar se ausente. */
  schema?: string;
  /** Metadados opcionais do consumidor (produto, tenant, etc.). */
  metadata?: Record<string, string>;
}

export interface SpecialistContext {
  prompt: string;
  provider: ILlmProvider;
  capability?: CapabilityId;
  requestContext?: SpecialistRequestContext;
}

export interface SpecialistResult {
  specialistId: string;
  specialistName: string;
  specialistVersion: string;
  capability?: CapabilityId;
  generation: LlmGenerateResult;
}

export interface ISpecialist {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly capabilities: readonly CapabilityId[];
  readonly config: SpecialistConfig;
  buildSystemPrompt(capability?: CapabilityId): string;
  supports(capability: CapabilityId): boolean;
  run(context: SpecialistContext): Promise<SpecialistResult>;
}

export interface SpecialistResolution {
  specialist: ISpecialist;
  capability?: CapabilityId;
}
