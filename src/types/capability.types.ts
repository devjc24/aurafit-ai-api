export const CAPABILITY_IDS = [
  "sql.generate",
  "sql.analyze",
  "code.generate",
  "code.review",
  "crm.message.generate",
  "database.analyze",
  "logs.analyze",
] as const;

export type CapabilityId = (typeof CAPABILITY_IDS)[number];

export interface CapabilityDefinition {
  id: CapabilityId;
  name: string;
  description: string;
  /** Especialista primário que atende esta capability. */
  defaultSpecialistId: string;
}

export const CAPABILITY_CATALOG: Record<CapabilityId, CapabilityDefinition> = {
  "sql.generate": {
    id: "sql.generate",
    name: "Geração de SQL",
    description: "Gera consultas SQL a partir de requisitos e schema conhecido.",
    defaultSpecialistId: "sql",
  },
  "sql.analyze": {
    id: "sql.analyze",
    name: "Análise de SQL",
    description: "Analisa, explica e revisa consultas SQL existentes.",
    defaultSpecialistId: "sql",
  },
  "code.generate": {
    id: "code.generate",
    name: "Geração de código",
    description: "Gera código com boas práticas e tipagem quando aplicável.",
    defaultSpecialistId: "nodejs",
  },
  "code.review": {
    id: "code.review",
    name: "Revisão de código",
    description: "Revisa código quanto a bugs, estilo, segurança e manutenibilidade.",
    defaultSpecialistId: "typescript",
  },
  "crm.message.generate": {
    id: "crm.message.generate",
    name: "Mensagem CRM",
    description: "Gera mensagens profissionais para contextos de CRM.",
    defaultSpecialistId: "crm",
  },
  "database.analyze": {
    id: "database.analyze",
    name: "Análise de banco",
    description: "Analisa modelagem, índices e saúde de banco de dados.",
    defaultSpecialistId: "database",
  },
  "logs.analyze": {
    id: "logs.analyze",
    name: "Análise de logs",
    description: "Analisa logs de aplicação/infra e sugere hipóteses.",
    defaultSpecialistId: "devops",
  },
};

export function isCapabilityId(value: string): value is CapabilityId {
  return (CAPABILITY_IDS as readonly string[]).includes(value);
}
