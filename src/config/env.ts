import dotenv from "dotenv";

dotenv.config();

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AppEnv {
  nodeEnv: string;
  port: number;
  serviceName: string;
  ollamaUrl: string;
  model: string;
  ollamaTimeoutMs: number;
  corsOrigins: string[] | "*";
  logLevel: LogLevel;
  maxPromptLength: number;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

function parsePort(raw: string | undefined): number {
  const value = raw?.trim() || "3000";
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT inválida: ${value}`);
  }
  return port;
}

function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  name: string
): number {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} deve ser um inteiro positivo`);
  }
  return value;
}

function parseLogLevel(raw: string | undefined): LogLevel {
  const value = (raw?.trim().toLowerCase() || "info") as LogLevel;
  const allowed: LogLevel[] = ["debug", "info", "warn", "error"];
  if (!allowed.includes(value)) {
    throw new Error(`LOG_LEVEL inválido: ${raw}`);
  }
  return value;
}

function parseCorsOrigins(raw: string | undefined): string[] | "*" {
  if (!raw || raw.trim() === "" || raw.trim() === "*") {
    return "*";
  }
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function loadEnv(): AppEnv {
  return {
    nodeEnv: process.env.NODE_ENV?.trim() || "development",
    port: parsePort(process.env.PORT),
    serviceName: process.env.SERVICE_NAME?.trim() || "Aura IA",
    ollamaUrl: requireEnv("OLLAMA_URL").replace(/\/$/, ""),
    model: requireEnv("MODEL"),
    ollamaTimeoutMs: parsePositiveInt(
      process.env.OLLAMA_TIMEOUT_MS,
      60_000,
      "OLLAMA_TIMEOUT_MS"
    ),
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
    logLevel: parseLogLevel(process.env.LOG_LEVEL),
    maxPromptLength: parsePositiveInt(
      process.env.MAX_PROMPT_LENGTH,
      16_000,
      "MAX_PROMPT_LENGTH"
    ),
  };
}

export const env: AppEnv = loadEnv();
