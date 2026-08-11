import { Router } from "express";
import { chatLegacy } from "../controllers/chat.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { chatRequestSchema } from "../types/chat.types";

const router = Router();

/**
 * Compatibilidade: POST /api/ai/chat
 * Body: { prompt, specialist?, capability?, context? }
 */
router.post("/chat", validateBody(chatRequestSchema), chatLegacy);

export default router;
