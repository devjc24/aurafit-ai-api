import { Router } from "express";
import {
  chatHubContract,
  chatV1,
  healthAiV1,
  listSpecialistsV1,
} from "../../controllers/chat.controller";
import {
  codeGenerate,
  codeReview,
  sqlAnalyze,
  sqlGenerate,
} from "../../controllers/capability.controller";
import { hubM2mAuthMiddleware } from "../../middlewares/hub-m2m-auth.middleware";
import { hubRateLimitMiddleware } from "../../middlewares/hub-rate-limit.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { capabilityInvokeSchema } from "../../types/capability-invoke.types";
import { chatRequestSchema } from "../../types/chat.types";
import { aiRequestSchema } from "../../types/contract/ai-request";

const router = Router();

const hubSecure = [hubM2mAuthMiddleware, hubRateLimitMiddleware] as const;

router.get("/health", hubM2mAuthMiddleware, healthAiV1);

router.get("/specialists", ...hubSecure, listSpecialistsV1);

/**
 * Contrato estável Hub → Aura IA (AIRequest).
 * Consumidor informa specialist/capability — nunca o modelo físico.
 */
router.post(
  "/chat",
  ...hubSecure,
  validateBody(aiRequestSchema),
  chatHubContract
);

router.post(
  "/chat/legacy-body",
  ...hubSecure,
  validateBody(chatRequestSchema),
  chatV1
);

/** Capabilities especializadas */
router.post(
  "/sql/generate",
  ...hubSecure,
  validateBody(capabilityInvokeSchema),
  sqlGenerate
);
router.post(
  "/sql/analyze",
  ...hubSecure,
  validateBody(capabilityInvokeSchema),
  sqlAnalyze
);
router.post(
  "/code/generate",
  ...hubSecure,
  validateBody(capabilityInvokeSchema),
  codeGenerate
);
router.post(
  "/code/review",
  ...hubSecure,
  validateBody(capabilityInvokeSchema),
  codeReview
);

export default router;
