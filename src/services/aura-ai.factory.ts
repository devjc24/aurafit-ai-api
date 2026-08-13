import { getOllamaProvider } from "../providers/llm";
import { bootstrapSpecialistRegistry } from "../specialists";
import { AuraAiService } from "./aura-ai.service";

let singleton: AuraAiService | undefined;

/**
 * Composition root: única ponte Service ↔ Provider.
 * Controllers não importam Ollama/Axios.
 */
export function getAuraAiService(): AuraAiService {
  if (!singleton) {
    bootstrapSpecialistRegistry();
    singleton = new AuraAiService(getOllamaProvider());
  }
  return singleton;
}

/** Reset para testes (opcional). */
export function resetAuraAiService(): void {
  singleton = undefined;
}
