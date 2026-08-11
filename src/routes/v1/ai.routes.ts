import { Router } from "express";
import {
  chatV1,
  listSpecialistsV1,
} from "../../controllers/chat.controller";
import { validateBody } from "../../middlewares/validate.middleware";
import { chatRequestSchema } from "../../types/chat.types";

const router = Router();

router.get("/specialists", listSpecialistsV1);
router.post("/chat", validateBody(chatRequestSchema), chatV1);

export default router;
