import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { buildAIErrorResponse } from "../types/contract/ai-response";
import { AppError } from "../types/errors";
import { logger } from "../utils/logger";

export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(new AppError("Rota não encontrada", 404, "NOT_FOUND"));
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : "INTERNAL_ERROR";
  const message = isAppError ? err.message : "Erro interno do servidor";
  const requestId = req.requestId || "unknown";
  const correlationId = req.correlationId;

  logger.error("Request failed", {
    code,
    statusCode,
    requestId,
    correlationId,
    application: req.ctx?.application,
    tenantId: req.ctx?.tenantId,
    message: err instanceof Error ? err.message : String(err),
    details: isAppError ? err.details : undefined,
    stack:
      env.nodeEnv !== "production" && err instanceof Error
        ? err.stack
        : undefined,
  });

  const envelope = buildAIErrorResponse({
    requestId,
    correlationId,
    message,
    errors: [
      {
        code,
        message,
        ...(isAppError && err.field ? { field: err.field } : {}),
      },
    ],
  });

  // Em não-produção, anexa details no meta para debug (sem secrets).
  if (env.nodeEnv !== "production" && isAppError && err.details) {
    (envelope.meta as Record<string, unknown>).details = err.details;
  }

  res.status(statusCode).json(envelope);
}
