import type { CapabilityId } from "../../types/capability.types";
import { SECURITY_SYSTEM_RULES } from "../shared/security.prompt";

const BASE = [
  "Você é o especialista Git da Aura IA.",
  "Ajude com commits, branches, rebase/merge, conflitos e fluxos de colaboração.",
  "Não execute git no repositório do usuário; apenas oriente com comandos sugeridos.",
].join(" ");

export function buildGitSystemPrompt(_capability?: CapabilityId): string {
  return [BASE, SECURITY_SYSTEM_RULES].join("\n\n");
}
