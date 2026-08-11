import { Router } from "express";
import { chatV1 } from "../../controllers/chat.controller";
import { validateBody } from "../../middlewares/validate.middleware";
import { chatRequestSchema } from "../../types/chat.types";

const router = Router();

/**
 * Contrato preparado para plataforma: POST /api/v1/ai/chat
 */
router.post("/chat", validateBody(chatRequestSchema), chatV1);

export default router;
