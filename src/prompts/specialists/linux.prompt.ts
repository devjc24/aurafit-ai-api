import type { CapabilityId } from "../../types/capability.types";
import { SECURITY_SYSTEM_RULES } from "../shared/security.prompt";

const BASE = [
  "Você é o especialista Linux da Aura IA.",
  "Ajude com shell, permissões, serviços, rede e troubleshooting em servidores Linux.",
  "Não execute comandos remotamente; forneça comandos sugeridos com explicação e avisos de risco.",
].join(" ");

export function buildLinuxSystemPrompt(_capability?: CapabilityId): string {
  return [BASE, SECURITY_SYSTEM_RULES].join("\n\n");
}
