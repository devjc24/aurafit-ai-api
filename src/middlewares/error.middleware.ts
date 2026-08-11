import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
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
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : "INTERNAL_ERROR";
  const message = isAppError
    ? err.message
    : "Erro interno do servidor";

  logger.error("Request failed", {
    code,
    statusCode,
    message: err instanceof Error ? err.message : String(err),
    details: isAppError ? err.details : undefined,
    stack:
      env.nodeEnv !== "production" && err instanceof Error
        ? err.stack
        : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(env.nodeEnv !== "production" && isAppError && err.details
      ? { details: err.details }
      : {}),
  });
}
