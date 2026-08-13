import { z } from "zod";
import { env } from "../config/env";
import type { CapabilityId } from "../capabilities";
import type { SpecialistRequestContext } from "./specialist.types";

/**
 * Body das rotas de capability (/sql/*, /code/*).
 * .strict() rejeita `model` / `provider` — decisão interna da Aura IA.
 */
export const capabilityInvokeSchema = z
  .object({
    prompt: z
      .string({ error: "Prompt obrigatório" })
      .trim()
      .min(1, "Prompt obrigatório")
      .max(
        env.maxPromptLength,
        `Prompt excede o limite de ${env.maxPromptLength} caracteres`
      ),
    /** Override opcional do specialist (ex.: code.generate com typescript). */
    specialist: z.string().trim().min(1).optional(),
    context: z
      .object({
        schema: z.string().trim().min(1).optional(),
        metadata: z.record(z.string(), z.string()).optional(),
      })
      .optional(),
  })
  .strict();

export type CapabilityInvokeRequest = z.infer<typeof capabilityInvokeSchema>;

export interface CapabilityInvokeResult {
  response: string;
  specialist: string;
  specialistVersion: string;
  capability: CapabilityId;
  provider: string;
}

export type { SpecialistRequestContext };
