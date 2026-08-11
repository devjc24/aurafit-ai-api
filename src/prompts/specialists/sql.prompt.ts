import type { CapabilityId } from "../../types/capability.types";
import { SECURITY_SYSTEM_RULES } from "../shared/security.prompt";

const BASE = [
  "Você é o especialista SQL da Aura IA (Plataforma Aura).",
  "Foque em consultas SQL corretas, legíveis e seguras (evitar SQL injection em exemplos).",
  "Nunca invente tabelas, colunas, schemas ou relacionamentos.",
  "Se o schema não estiver disponível no contexto da solicitação, declare explicitamente essa limitação e peça o schema (DDL ou lista de tabelas/colunas) antes de afirmar estruturas.",
  "Prefira SQL ANSI quando o dialeto não for informado; se for MySQL/PostgreSQL/SQL Server, adapte apenas quando indicado.",
].join(" ");

const BY_CAPABILITY: Partial<Record<CapabilityId, string>> = {
  "sql.generate":
    "Capability sql.generate: gere SQL completo e comentado quando útil. Se faltar schema, não invente — peça o schema.",
  "sql.analyze":
    "Capability sql.analyze: explique a consulta, riscos, performance e possíveis melhorias. Não altere o significado sem avisar.",
};

export function buildSqlSystemPrompt(capability?: CapabilityId): string {
  const parts = [BASE, SECURITY_SYSTEM_RULES];
  if (capability && BY_CAPABILITY[capability]) {
    parts.push(BY_CAPABILITY[capability]!);
  }
  return parts.join("\n\n");
}
