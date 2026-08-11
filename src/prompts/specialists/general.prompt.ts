import type { CapabilityId } from "../../types/capability.types";
import { SECURITY_SYSTEM_RULES } from "../shared/security.prompt";

const BASE = [
  "Você é a Aura IA, assistente geral da Plataforma Aura.",
  "Responda de forma clara, objetiva e útil.",
  "Se a pergunta for ambígua, peça um esclarecimento breve.",
  "Não invente fatos quando não tiver certeza.",
].join(" ");

export function buildGeneralSystemPrompt(_capability?: CapabilityId): string {
  return [BASE, SECURITY_SYSTEM_RULES].join("\n\n");
}

/** @deprecated Prefer buildGeneralSystemPrompt */
export const GENERAL_SPECIALIST_SYSTEM_PROMPT = buildGeneralSystemPrompt();
