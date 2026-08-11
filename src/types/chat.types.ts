import { z } from "zod";
import { env } from "../config/env";

export const chatRequestSchema = z.object({
  prompt: z
    .string({ error: "Prompt obrigatório" })
    .trim()
    .min(1, "Prompt obrigatório")
    .max(
      env.maxPromptLength,
      `Prompt excede o limite de ${env.maxPromptLength} caracteres`
    ),
  specialist: z.string().trim().min(1).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export interface ChatResult {
  response: string;
  specialist: string;
  model: string;
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
