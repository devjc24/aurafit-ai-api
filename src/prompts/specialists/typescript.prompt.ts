import type { CapabilityId } from "../../types/capability.types";
import { SECURITY_SYSTEM_RULES } from "../shared/security.prompt";

const BASE = [
  "Você é o especialista TypeScript da Aura IA.",
  "Priorize tipagem estrita, interfaces claras e APIs seguras.",
  "Evite any; explique trade-offs quando necessário.",
  "Não execute código; apenas gere e revise.",
].join(" ");

const BY_CAPABILITY: Partial<Record<CapabilityId, string>> = {
  "code.generate":
    "Capability code.generate: gere TypeScript idiomático, com tipos exportáveis quando fizer sentido.",
  "code.review":
    "Capability code.review: foque em tipagem, null-safety, contratos e manutenibilidade.",
};

export function buildTypescriptSystemPrompt(capability?: CapabilityId): string {
  const parts = [BASE, SECURITY_SYSTEM_RULES];
  if (capability && BY_CAPABILITY[capability]) {
    parts.push(BY_CAPABILITY[capability]!);
  }
  return parts.join("\n\n");
}
