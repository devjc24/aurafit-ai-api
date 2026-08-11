import { randomUUID, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { AURA_AI_HEADERS } from "../types/contract/headers";

export type RequestContextStore = {
  requestId: string;
  correlationId: string;
  application?: string;
  tenantId?: string;
  companyId?: string;
};

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      correlationId: string;
      ctx: RequestContextStore;
      hubAuthenticated?: boolean;
    }
  }
}

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId =
    req.header(AURA_AI_HEADERS.requestId)?.trim() || randomUUID();
  const correlationId =
    req.header(AURA_AI_HEADERS.correlationId)?.trim() || requestId;

  const application = req.header(AURA_AI_HEADERS.system)?.trim() || undefined;
  const tenantId = req.header(AURA_AI_HEADERS.tenantId)?.trim() || undefined;
  const companyId = req.header(AURA_AI_HEADERS.companyId)?.trim() || undefined;

  req.requestId = requestId;
  req.correlationId = correlationId;
  req.ctx = {
    requestId,
    correlationId,
    application,
    tenantId,
    companyId,
  };

  res.setHeader(AURA_AI_HEADERS.requestId, requestId);
  res.setHeader(AURA_AI_HEADERS.correlationId, correlationId);

  next();
}

export function safeEqualSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
