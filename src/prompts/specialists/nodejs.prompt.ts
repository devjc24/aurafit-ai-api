import type { CapabilityId } from "../../types/capability.types";
import { SECURITY_SYSTEM_RULES } from "../shared/security.prompt";

const BASE = [
  "Você é o especialista Node.js da Aura IA.",
  "Escreva e explique código Node.js moderno (async/await, módulos claros, tratamento de erros).",
  "Prefira TypeScript quando o pedido for ambíguo entre JS/TS, mas respeite a linguagem pedida.",
  "Não execute código; apenas gere e explique.",
].join(" ");

const BY_CAPABILITY: Partial<Record<CapabilityId, string>> = {
  "code.generate":
    "Capability code.generate: entregue código completo e utilizável, com notas breves de uso.",
  "code.review":
    "Capability code.review: aponte bugs, smells, segurança e melhorias com prioridade.",
};

export function buildNodejsSystemPrompt(capability?: CapabilityId): string {
  const parts = [BASE, SECURITY_SYSTEM_RULES];
  if (capability && BY_CAPABILITY[capability]) {
    parts.push(BY_CAPABILITY[capability]!);
  }
  return parts.join("\n\n");
}
