import type { Request, Response, NextFunction } from "express";
import type { CapabilityId } from "../capabilities";
import { getAuraAiService } from "../services/aura-ai.factory";
import type { CapabilityInvokeRequest } from "../types/capability-invoke.types";
import { ValidationError } from "../types/errors";
import { logger } from "../utils/logger";

const auraAi = getAuraAiService();

function requireHubAuth(req: Request): void {
  if (!req.hubAuthenticated) {
    throw new ValidationError("Caller Hub não autenticado");
  }
}

/**
 * Factory: Controller → Service → Specialist → Provider (nunca Ollama direto).
 */
export function createCapabilityHandler(capabilityId: CapabilityId) {
  return async function capabilityHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const started = Date.now();
    try {
      requireHubAuth(req);
      const body = req.body as CapabilityInvokeRequest;
      const result = await auraAi.processCapability(capabilityId, body);

      res.json({
        success: true,
        message: "",
        data: result,
        errors: [],
        meta: {
          requestId: req.requestId,
          correlationId: req.correlationId,
          durationMs: Date.now() - started,
        },
      });
    } catch (error) {
      logger.error("Capability request failed", {
        requestId: req.requestId,
        capability: capabilityId,
        durationMs: Date.now() - started,
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  };
}

export const sqlGenerate = createCapabilityHandler("sql.generate");
export const sqlAnalyze = createCapabilityHandler("sql.analyze");
export const codeGenerate = createCapabilityHandler("code.generate");
export const codeReview = createCapabilityHandler("code.review");
