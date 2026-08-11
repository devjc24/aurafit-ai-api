import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "../types/errors";

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      next(
        new ValidationError("Payload inválido", parsed.error.flatten())
      );
      return;
    }

    req.body = parsed.data;
    next();
  };
}
