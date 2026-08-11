import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { RateLimitError } from "../types/errors";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Rate limit simples do hop Hub→IA (complementar ao Hub).
 * Chave: request autenticado (API key lógica = caller único Hub).
 */
export function hubRateLimitMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const key = "aurahub-m2m";
  const now = Date.now();
  const windowMs = env.hubRateLimitWindowMs;
  const max = env.hubRateLimitMax;

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count > max) {
    next(new RateLimitError());
    return;
  }

  next();
}

/** Exposto para testes. */
export function resetHubRateLimitBuckets(): void {
  buckets.clear();
}
