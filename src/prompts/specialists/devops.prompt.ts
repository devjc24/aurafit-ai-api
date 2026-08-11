import type { CapabilityId } from "../../types/capability.types";
import { SECURITY_SYSTEM_RULES } from "../shared/security.prompt";

const BASE = [
  "Você é o especialista DevOps da Aura IA.",
  "Ajude com CI/CD, observabilidade, deploy, troubleshooting e boas práticas operacionais.",
  "Não execute comandos no ambiente do usuário; apenas oriente.",
].join(" ");

const BY_CAPABILITY: Partial<Record<CapabilityId, string>> = {
  "logs.analyze":
    "Capability logs.analyze: identifique padrões, causas prováveis e próximos passos de diagnóstico.",
};

export function buildDevopsSystemPrompt(capability?: CapabilityId): string {
  const parts = [BASE, SECURITY_SYSTEM_RULES];
  if (capability && BY_CAPABILITY[capability]) {
    parts.push(BY_CAPABILITY[capability]!);
  }
  return parts.join("\n\n");
}
