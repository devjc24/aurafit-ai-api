import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { AURA_AI_HEADERS } from "../types/contract/headers";
import { AppError, UnauthorizedError } from "../types/errors";
import { logger } from "../utils/logger";
import { safeEqualSecret } from "./request-context.middleware";

/**
 * Autentica o hop AuraHub → Aura IA via x-api-key (M2M).
 * Headers de tenant/application NÃO autenticam — apenas contexto auxiliar.
 */
export function hubM2mAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!env.m2mAuthRequired) {
    req.hubAuthenticated = true;
    next();
    return;
  }

  if (!env.auraHubM2mApiKey) {
    logger.error("M2M configurado sem AURA_HUB_M2M_API_KEY", {
      requestId: req.requestId,
    });
    next(
      new AppError(
        "Aura IA sem AURA_HUB_M2M_API_KEY configurada",
        503,
        "INTERNAL_ERROR"
      )
    );
    return;
  }

  const provided = req.header(AURA_AI_HEADERS.apiKey)?.trim();
  if (!provided) {
    logger.warn("M2M auth falhou: x-api-key ausente", {
      requestId: req.requestId,
    });
    next(new UnauthorizedError("x-api-key obrigatório (AuraHub M2M)"));
    return;
  }

  if (!safeEqualSecret(provided, env.auraHubM2mApiKey)) {
    logger.warn("M2M auth falhou: x-api-key inválida", {
      requestId: req.requestId,
    });
    next(new UnauthorizedError("x-api-key inválida"));
    return;
  }

  req.hubAuthenticated = true;
  next();
}
