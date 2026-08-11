import {
  CAPABILITY_CATALOG,
  isCapabilityId,
  type CapabilityDefinition,
  type CapabilityId,
} from "../types/capability.types";
import { AppError, NotFoundError, ValidationError } from "../types/errors";
import type {
  ISpecialist,
  SpecialistResolution,
} from "../types/specialist.types";

export interface ResolveSpecialistInput {
  specialistId?: string;
  capabilityId?: string;
}

export class SpecialistRegistry {
  private readonly byId = new Map<string, ISpecialist>();

  register(specialist: ISpecialist): void {
    if (this.byId.has(specialist.id)) {
      throw new AppError(
        `Especialista já registrado: ${specialist.id}`,
        500,
        "INTERNAL_ERROR"
      );
    }

    if (specialist.config.allowExecution !== false) {
      throw new AppError(
        `Especialista ${specialist.id} não pode permitir execução`,
        500,
        "INTERNAL_ERROR"
      );
    }

    this.byId.set(specialist.id, specialist);
  }

  registerAll(specialists: ISpecialist[]): void {
    for (const specialist of specialists) {
      this.register(specialist);
    }
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  get(id: string): ISpecialist {
    const specialist = this.byId.get(id);
    if (!specialist) {
      throw new NotFoundError(`Especialista não encontrado: ${id}`);
    }
    return specialist;
  }

  list(): ISpecialist[] {
    return [...this.byId.values()];
  }

  listCapabilities(): CapabilityDefinition[] {
    return Object.values(CAPABILITY_CATALOG);
  }

  getCapability(capabilityId: string): CapabilityDefinition {
    if (!isCapabilityId(capabilityId)) {
      throw new NotFoundError(`Capability não encontrada: ${capabilityId}`);
    }
    return CAPABILITY_CATALOG[capabilityId];
  }

  resolveByCapability(capabilityId: string): SpecialistResolution {
    const capability = this.getCapability(capabilityId);
    const specialist = this.get(capability.defaultSpecialistId);

    if (!specialist.supports(capability.id)) {
      throw new AppError(
        `Especialista ${specialist.id} não declara a capability ${capability.id}`,
        500,
        "INTERNAL_ERROR"
      );
    }

    return { specialist, capability: capability.id };
  }

  /**
   * Seleção pública: o consumidor informa specialist e/ou capability.
   * O modelo LLM permanece interno à Aura IA.
   */
  resolve(input: ResolveSpecialistInput): SpecialistResolution {
    const specialistId = input.specialistId?.trim();
    const capabilityId = input.capabilityId?.trim();

    if (!specialistId && !capabilityId) {
      return { specialist: this.get("general") };
    }

    if (capabilityId && !specialistId) {
      return this.resolveByCapability(capabilityId);
    }

    if (specialistId && !capabilityId) {
      return { specialist: this.get(specialistId) };
    }

    // Ambos informados: specialist deve existir e suportar a capability
    const specialist = this.get(specialistId!);
    if (!isCapabilityId(capabilityId!)) {
      throw new NotFoundError(`Capability não encontrada: ${capabilityId}`);
    }

    if (!specialist.supports(capabilityId as CapabilityId)) {
      throw new ValidationError(
        `Especialista ${specialist.id} não suporta a capability ${capabilityId}`
      );
    }

    return {
      specialist,
      capability: capabilityId as CapabilityId,
    };
  }
}

let defaultRegistry: SpecialistRegistry | undefined;

export function getSpecialistRegistry(): SpecialistRegistry {
  if (!defaultRegistry) {
    throw new AppError(
      "SpecialistRegistry ainda não foi inicializado",
      500,
      "INTERNAL_ERROR"
    );
  }
  return defaultRegistry;
}

export function setSpecialistRegistry(registry: SpecialistRegistry): void {
  defaultRegistry = registry;
}

export function resetSpecialistRegistry(): void {
  defaultRegistry = undefined;
}

export function createEmptyRegistry(): SpecialistRegistry {
  return new SpecialistRegistry();
}
