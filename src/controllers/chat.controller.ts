import type { Request, Response, NextFunction } from "express";
import { getOllamaProvider } from "../providers/llm";
import { ChatService } from "../services/chat.service";
import type { ChatRequest } from "../types/chat.types";

const chatService = new ChatService(getOllamaProvider());

function getChatBody(req: Request): ChatRequest {
  return req.body as ChatRequest;
}

export async function chatLegacy(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await chatService.chat(getChatBody(req));
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
    const result = await chatService.chat(getChatBody(req));
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
