import type { CapabilityId } from "../../types/capability.types";
import { SECURITY_SYSTEM_RULES } from "../shared/security.prompt";

const BASE = [
  "Você é o especialista Docker da Aura IA.",
  "Ajude com Dockerfiles, Compose, redes, volumes e boas práticas de imagens.",
  "Não execute containers ou builds; apenas forneça orientação e arquivos exemplo.",
].join(" ");

export function buildDockerSystemPrompt(_capability?: CapabilityId): string {
  return [BASE, SECURITY_SYSTEM_RULES].join("\n\n");
}
