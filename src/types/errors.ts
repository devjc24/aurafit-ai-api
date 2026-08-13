export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "SPECIALIST_NOT_FOUND"
  | "CAPABILITY_NOT_FOUND"
  | "REQUEST_ID_MISMATCH"
  | "RATE_LIMITED"
  | "PROVIDER_ERROR"
  | "PROVIDER_TIMEOUT"
  | "AI_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;
  readonly field?: string;
  readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code: ErrorCode = "INTERNAL_ERROR",
    details?: unknown,
    field?: string
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.field = field;
    this.isOperational = true;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown, field?: string) {
    super(message, 400, "VALIDATION_ERROR", details, field);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Não autorizado") {
    super(message, 403, "AUTHORIZATION_ERROR");
    this.name = "ForbiddenError";
  }
}

export class ProviderError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 502, "PROVIDER_ERROR", details);
    this.name = "ProviderError";
  }
}

export class ProviderTimeoutError extends AppError {
  constructor(message = "Timeout ao consultar provider", details?: unknown) {
    super(message, 504, "PROVIDER_TIMEOUT", details);
    this.name = "ProviderTimeoutError";
  }
}

/** Falha de processamento AI não atribuível ao provider (ex.: specialist). */
export class AiError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 502, "AI_ERROR", details);
    this.name = "AiError";
  }
}

/** @deprecated Preferir AiError — mantido como alias. */
export class ModelError extends AiError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "ModelError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code: ErrorCode = "NOT_FOUND") {
    super(message, 404, code);
    this.name = "NotFoundError";
  }
}

export class RequestIdMismatchError extends AppError {
  constructor(message = "requestId do body não confere com x-request-id") {
    super(message, 409, "REQUEST_ID_MISMATCH");
    this.name = "RequestIdMismatchError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Limite de requisições excedido") {
    super(message, 429, "RATE_LIMITED");
    this.name = "RateLimitError";
  }
}
