import cors from "cors";
import { env } from "../config/env";

export const corsMiddleware = cors({
  origin:
    env.corsOrigins === "*"
      ? true
      : (origin, callback) => {
          if (!origin || env.corsOrigins.includes(origin)) {
            callback(null, true);
            return;
          }
          callback(new Error(`Origem CORS não permitida: ${origin}`));
        },
});
