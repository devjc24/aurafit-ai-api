import { CrmSpecialist } from "./crm.specialist";
import { DatabaseSpecialist } from "./database.specialist";
import { DevopsSpecialist } from "./devops.specialist";
import { DockerSpecialist } from "./docker.specialist";
import { GeneralSpecialist } from "./general.specialist";
import { GitSpecialist } from "./git.specialist";
import { LinuxSpecialist } from "./linux.specialist";
import { NodejsSpecialist } from "./nodejs.specialist";
import {
  createEmptyRegistry,
  getSpecialistRegistry,
  resetSpecialistRegistry,
  setSpecialistRegistry,
  SpecialistRegistry,
} from "./registry";
import { SqlSpecialist } from "./sql.specialist";
import { TypescriptSpecialist } from "./typescript.specialist";

export function createDefaultSpecialists() {
  return [
    new GeneralSpecialist(),
    new SqlSpecialist(),
    new DatabaseSpecialist(),
    new NodejsSpecialist(),
    new TypescriptSpecialist(),
    new CrmSpecialist(),
    new DevopsSpecialist(),
    new DockerSpecialist(),
    new LinuxSpecialist(),
    new GitSpecialist(),
  ];
}

export function createDefaultRegistry(): SpecialistRegistry {
  const registry = createEmptyRegistry();
  registry.registerAll(createDefaultSpecialists());
  return registry;
}

export function bootstrapSpecialistRegistry(): SpecialistRegistry {
  try {
    return getSpecialistRegistry();
  } catch {
    const registry = createDefaultRegistry();
    setSpecialistRegistry(registry);
    return registry;
  }
}

// Garante registry pronto para controllers/services no boot do módulo
bootstrapSpecialistRegistry();

/** Atalhos de compatibilidade */
export function listSpecialists() {
  return getSpecialistRegistry().list();
}

export function getSpecialist(id = "general") {
  return getSpecialistRegistry().get(id);
}

export {
  SpecialistRegistry,
  getSpecialistRegistry,
  setSpecialistRegistry,
  resetSpecialistRegistry,
  createEmptyRegistry,
};
export {
  GeneralSpecialist,
  SqlSpecialist,
  DatabaseSpecialist,
  NodejsSpecialist,
  TypescriptSpecialist,
  CrmSpecialist,
  DevopsSpecialist,
  DockerSpecialist,
  LinuxSpecialist,
  GitSpecialist,
};
