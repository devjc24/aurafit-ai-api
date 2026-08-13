import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { getAuraAiService } from "../services/aura-ai.factory";
import type { ChatRequest } from "../types/chat.types";
import type { AIRequest } from "../types/contract/ai-request";
import { buildAISuccessResponse } from "../types/contract/ai-response";
import {
  RequestIdMismatchError,
  ValidationError,
} from "../types/errors";
import { logger } from "../utils/logger";

const auraAi = getAuraAiService();

function getChatBody(req: Request): ChatRequest {
  return req.body as ChatRequest;
}

function assertRequestIdConsistency(req: Request, bodyRequestId: string): void {
  if (bodyRequestId !== req.requestId) {
    throw new RequestIdMismatchError();
  }
}

function assertTrustedContextConsistency(req: Request, body: AIRequest): void {
  // Headers são espelho opcional — se presentes, devem bater com o body assertado pelo Hub.
  if (req.ctx.tenantId && req.ctx.tenantId !== body.tenant.id) {
    throw new ValidationError(
      "x-tenant-id não confere com tenant.id do body",
      undefined,
      "tenant.id"
    );
  }
  if (req.ctx.application && req.ctx.application !== body.application) {
    throw new ValidationError(
      "x-aura-system não confere com application do body",
      undefined,
      "application"
    );
  }
  if (
    req.ctx.companyId &&
    body.tenant.companyId &&
    req.ctx.companyId !== body.tenant.companyId
  ) {
    throw new ValidationError(
      "x-company-id não confere com tenant.companyId do body",
      undefined,
      "tenant.companyId"
    );
  }
}

export async function chatLegacy(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await auraAi.process(getChatBody(req));
    res.json({
      success: true,
      response: result.response,
    });
  } catch (error) {
    next(error);
  }
}

/** Contrato transitório (pré-Hub) — mantido para compatibilidade. */
export async function chatV1(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await auraAi.process(getChatBody(req));
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Contrato estável AuraHub → Aura IA (AIRequest / AIResponse).
 */
export async function chatHubContract(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const started = Date.now();
  try {
    if (!req.hubAuthenticated) {
      // Defesa em profundidade — middleware M2M deve ter passado.
      throw new ValidationError("Caller Hub não autenticado");
    }

    const body = req.body as AIRequest;
    assertRequestIdConsistency(req, body.requestId);
    assertTrustedContextConsistency(req, body);

    const result = await auraAi.processHubRequest(body);

    res.json(
      buildAISuccessResponse(result, {
        correlationId: req.correlationId,
      })
    );
  } catch (error) {
    logger.error("AI hub contract failed", {
      requestId: req.requestId,
      correlationId: req.correlationId,
      application: req.ctx?.application,
      tenantId: req.ctx?.tenantId,
      durationMs: Date.now() - started,
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
    next(error);
  }
}

export async function listSpecialistsV1(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json({
      success: true,
      message: "",
      data: {
        specialists: auraAi.listSpecialists(),
        capabilities: auraAi.listCapabilities(),
      },
      errors: [],
      meta: {
        requestId: _req.requestId,
        correlationId: _req.correlationId,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function healthAiV1(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  res.json({
    success: true,
    message: "",
    data: {
      status: "ok",
      service: env.serviceName,
      m2mRequired: env.m2mAuthRequired,
    },
    errors: [],
    meta: {
      requestId: req.requestId,
      correlationId: req.correlationId,
    },
  });
}
