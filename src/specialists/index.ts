import { NotFoundError } from "../types/errors";
import type { ISpecialist } from "../types/specialist.types";
import { GeneralSpecialist } from "./general.specialist";

const specialists: ISpecialist[] = [new GeneralSpecialist()];

const byId = new Map(specialists.map((item) => [item.id, item]));

export function listSpecialists(): ISpecialist[] {
  return [...specialists];
}

export function getSpecialist(id = "general"): ISpecialist {
  const specialist = byId.get(id);
  if (!specialist) {
    throw new NotFoundError(`Especialista não encontrado: ${id}`);
  }
  return specialist;
}

export { GeneralSpecialist };
