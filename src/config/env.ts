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
  /**
   * Segredo M2M AuraHub → Aura IA.
   * Opcional no boot (para não derrubar deploy/health).
   * Rotas /api/v1/ai exigem key quando m2mAuthRequired=true.
   */
  auraHubM2mApiKey: string | null;
  m2mAuthRequired: boolean;
  hubRateLimitWindowMs: number;
  hubRateLimitMax: number;
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

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const value = raw.trim().toLowerCase();
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new Error(`Booleano inválido: ${raw}`);
}

/**
 * Não derruba o processo se a key M2M estiver ausente.
 * Health/PM2 continuam funcionando; rotas M2M respondem 503 até configurar.
 */
function loadHubM2mApiKey(nodeEnv: string): string | null {
  const raw = process.env.AURA_HUB_M2M_API_KEY?.trim();
  if (!raw) {
    if (nodeEnv === "test") {
      return "test-aura-hub-m2m-key";
    }
    return null;
  }
  if (raw.length < 16) {
    throw new Error("AURA_HUB_M2M_API_KEY deve ter ao menos 16 caracteres");
  }
  return raw;
}

function loadEnv(): AppEnv {
  const nodeEnv = process.env.NODE_ENV?.trim() || "development";
  const auraHubM2mApiKey = loadHubM2mApiKey(nodeEnv);
  const m2mAuthRequired = parseBool(
    process.env.M2M_AUTH_REQUIRED,
    nodeEnv !== "test"
  );

  return {
    nodeEnv,
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
    auraHubM2mApiKey,
    m2mAuthRequired,
    hubRateLimitWindowMs: parsePositiveInt(
      process.env.HUB_RATE_LIMIT_WINDOW_MS,
      60_000,
      "HUB_RATE_LIMIT_WINDOW_MS"
    ),
    hubRateLimitMax: parsePositiveInt(
      process.env.HUB_RATE_LIMIT_MAX,
      120,
      "HUB_RATE_LIMIT_MAX"
    ),
  };
}

export const env: AppEnv = loadEnv();
