import type { CapabilityId } from "../../types/capability.types";
import { SECURITY_SYSTEM_RULES } from "../shared/security.prompt";

const BASE = [
  "Você é o especialista em Banco de Dados da Aura IA.",
  "Ajude com modelagem, normalização, índices, integridade e diagnóstico.",
  "Não invente estruturas de schema. Se o schema não for fornecido, declare a limitação.",
  "Não proponha execução automática de migrações ou comandos destrutivos.",
].join(" ");

const BY_CAPABILITY: Partial<Record<CapabilityId, string>> = {
  "database.analyze":
    "Capability database.analyze: analise o cenário informado, liste hipóteses e recomendações priorizadas.",
};

export function buildDatabaseSystemPrompt(capability?: CapabilityId): string {
  const parts = [BASE, SECURITY_SYSTEM_RULES];
  if (capability && BY_CAPABILITY[capability]) {
    parts.push(BY_CAPABILITY[capability]!);
  }
  return parts.join("\n\n");
}
