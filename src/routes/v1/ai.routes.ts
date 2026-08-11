import { Router } from "express";
import {
  chatHubContract,
  chatV1,
  healthAiV1,
  listSpecialistsV1,
} from "../../controllers/chat.controller";
import { hubM2mAuthMiddleware } from "../../middlewares/hub-m2m-auth.middleware";
import { hubRateLimitMiddleware } from "../../middlewares/hub-rate-limit.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { chatRequestSchema } from "../../types/chat.types";
import { aiRequestSchema } from "../../types/contract/ai-request";

const router = Router();

/**
 * Health do módulo AI — autenticado (evita vazar superfície sem M2M).
 */
router.get("/health", hubM2mAuthMiddleware, healthAiV1);

router.get(
  "/specialists",
  hubM2mAuthMiddleware,
  hubRateLimitMiddleware,
  listSpecialistsV1
);

/**
 * Contrato estável Hub → Aura IA.
 * Body: AIRequest (docs/AURAHUB_AI_CONTRACT.md)
 */
router.post(
  "/chat",
  hubM2mAuthMiddleware,
  hubRateLimitMiddleware,
  validateBody(aiRequestSchema),
  chatHubContract
);

/**
 * Alias transitório do body antigo { prompt, specialist?, capability? }.
 * Mantido atrás de M2M; preferir AIRequest em /chat.
 */
router.post(
  "/chat/legacy-body",
  hubM2mAuthMiddleware,
  hubRateLimitMiddleware,
  validateBody(chatRequestSchema),
  chatV1
);

export default router;
