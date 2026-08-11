import { z } from "zod";
import { env } from "../config/env";
import type { CapabilityId } from "./capability.types";
import type { SpecialistRequestContext } from "./specialist.types";

export const chatRequestSchema = z
  .object({
    prompt: z
      .string({ error: "Prompt obrigatório" })
      .trim()
      .min(1, "Prompt obrigatório")
      .max(
        env.maxPromptLength,
        `Prompt excede o limite de ${env.maxPromptLength} caracteres`
      ),
    specialist: z.string().trim().min(1).optional(),
    capability: z.string().trim().min(1).optional(),
    context: z
      .object({
        schema: z.string().trim().min(1).optional(),
        metadata: z.record(z.string(), z.string()).optional(),
      })
      .optional(),
  })
  .strict();

export type ChatRequest = {
  prompt: string;
  specialist?: string;
  capability?: string;
  context?: SpecialistRequestContext;
};

export interface ChatResult {
  response: string;
  specialist: string;
  specialistVersion: string;
  capability?: CapabilityId;
  provider: string;
}

export interface LegacyChatResponse {
  success: true;
  response: string;
}

export interface V1ChatResponse {
  success: true;
  data: ChatResult;
}
