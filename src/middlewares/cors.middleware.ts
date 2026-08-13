import cors from "cors";
import { env } from "../config/env";

/**
 * CORS configurável via CORS_ORIGINS.
 * - "*" → permite qualquer origem (dev)
 * - lista CSV → whitelist
 * - [] em produção sem env → bloqueia browsers (origem presente)
 */
export const corsMiddleware = cors({
  origin:
    env.corsOrigins === "*"
      ? true
      : (origin, callback) => {
          if (!origin) {
            callback(null, true);
            return;
          }
          if (
            Array.isArray(env.corsOrigins) &&
            env.corsOrigins.includes(origin)
          ) {
            callback(null, true);
            return;
          }
          callback(new Error(`Origem CORS não permitida: ${origin}`));
        },
});
