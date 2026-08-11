import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { corsMiddleware } from "./middlewares/cors.middleware";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware";
import { requestContextMiddleware } from "./middlewares/request-context.middleware";
import { bootstrapSpecialistRegistry } from "./specialists";
import aiRoutes from "./routes/ai.routes";
import aiV1Routes from "./routes/v1/ai.routes";
import { logger } from "./utils/logger";

bootstrapSpecialistRegistry();

const app = express();

app.use(corsMiddleware);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(requestContextMiddleware);

app.get("/", (_req, res) => {
  res.json({
    status: "online",
    service: env.serviceName,
    version: "1.0.0",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: env.serviceName,
  });
});

// Compatibilidade (legado) — não é o caminho de produção Plataforma
app.use("/api/ai", aiRoutes);

// Contrato versionado AuraHub → Aura IA
app.use("/api/v1/ai", aiV1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  logger.info("API iniciada", {
    port: env.port,
    ollamaUrl: env.ollamaUrl,
    model: env.model,
    service: env.serviceName,
    m2mAuthRequired: env.m2mAuthRequired,
  });
});
