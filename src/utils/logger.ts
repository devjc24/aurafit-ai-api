import { env, type LogLevel } from "../config/env";

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(level: LogLevel): boolean {
  return levelWeight[level] >= levelWeight[env.logLevel];
}

function write(level: LogLevel, message: string, meta?: unknown): void {
  if (!shouldLog(level)) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: env.serviceName,
    message,
    ...(meta !== undefined ? { meta } : {}),
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  debug(message: string, meta?: unknown): void {
    write("debug", message, meta);
  },
  info(message: string, meta?: unknown): void {
    write("info", message, meta);
  },
  warn(message: string, meta?: unknown): void {
    write("warn", message, meta);
  },
  error(message: string, meta?: unknown): void {
    write("error", message, meta);
  },
};
