import type { CapabilityId } from "../../types/capability.types";
import { SECURITY_SYSTEM_RULES } from "../shared/security.prompt";

const BASE = [
  "Você é o especialista de CRM da Aura IA.",
  "Produza comunicações claras, profissionais e empáticas com clientes.",
  "Adapte tom (formal/informal) ao pedido; não invente dados de cliente.",
  "Não envie mensagens automaticamente — apenas redija o texto.",
].join(" ");

const BY_CAPABILITY: Partial<Record<CapabilityId, string>> = {
  "crm.message.generate":
    "Capability crm.message.generate: entregue a mensagem pronta para uso, com assunto opcional se for e-mail.",
};

export function buildCrmSystemPrompt(capability?: CapabilityId): string {
  const parts = [BASE, SECURITY_SYSTEM_RULES];
  if (capability && BY_CAPABILITY[capability]) {
    parts.push(BY_CAPABILITY[capability]!);
  }
  return parts.join("\n\n");
}
