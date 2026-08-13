import { NotFoundError } from "../types/errors";
import {
  CAPABILITY_CATALOG,
  CAPABILITY_IDS,
  isCapabilityId,
  type CapabilityDefinition,
  type CapabilityId,
} from "./catalog";

/**
 * Registry de capabilities da Aura IA.
 * O consumidor informa capability (ou usa path HTTP) — nunca o modelo físico.
 */
export class CapabilityRegistry {
  private readonly byId = new Map<CapabilityId, CapabilityDefinition>();

  constructor(definitions: CapabilityDefinition[] = Object.values(CAPABILITY_CATALOG)) {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  register(definition: CapabilityDefinition): void {
    this.byId.set(definition.id, definition);
  }

  has(id: string): boolean {
    return isCapabilityId(id) && this.byId.has(id);
  }

  get(id: string): CapabilityDefinition {
    if (!isCapabilityId(id) || !this.byId.has(id)) {
      throw new NotFoundError(
        `Capability não encontrada: ${id}`,
        "CAPABILITY_NOT_FOUND"
      );
    }
    return this.byId.get(id)!;
  }

  list(): CapabilityDefinition[] {
    return CAPABILITY_IDS.map((id) => this.byId.get(id)!).filter(Boolean);
  }

  resolveDefaultSpecialistId(capabilityId: string): string {
    return this.get(capabilityId).defaultSpecialistId;
  }
}

let singleton: CapabilityRegistry | undefined;

export function getCapabilityRegistry(): CapabilityRegistry {
  if (!singleton) {
    singleton = new CapabilityRegistry();
  }
  return singleton;
}

export function setCapabilityRegistry(registry: CapabilityRegistry): void {
  singleton = registry;
}

export function createCapabilityRegistry(
  definitions?: CapabilityDefinition[]
): CapabilityRegistry {
  return new CapabilityRegistry(definitions);
}
