import type { Request, Response, NextFunction } from "express";
import { getOllamaProvider } from "../providers/llm";
import { bootstrapSpecialistRegistry } from "../specialists";
import { AuraAiService } from "../services/aura-ai.service";
import type { ChatRequest } from "../types/chat.types";

bootstrapSpecialistRegistry();
const auraAi = new AuraAiService(getOllamaProvider());

function getChatBody(req: Request): ChatRequest {
  return req.body as ChatRequest;
}

export async function chatLegacy(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await auraAi.process(getChatBody(req));
    res.json({
      success: true,
      response: result.response,
    });
  } catch (error) {
    next(error);
  }
}

export async function chatV1(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await auraAi.process(getChatBody(req));
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function listSpecialistsV1(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json({
      success: true,
      data: {
        specialists: auraAi.listSpecialists(),
        capabilities: auraAi.listCapabilities(),
      },
    });
  } catch (error) {
    next(error);
  }
}
