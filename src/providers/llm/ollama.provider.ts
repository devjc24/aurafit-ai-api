import axios, { AxiosError, AxiosInstance } from "axios";
import { env } from "../../config/env";
import { ProviderError, ProviderTimeoutError } from "../../types/errors";
import { logger } from "../../utils/logger";
import type {
  ILlmProvider,
  LlmGenerateOptions,
  LlmGenerateResult,
} from "./llm.provider";

interface OllamaGenerateResponse {
  response?: string;
  model?: string;
}

export class OllamaProvider implements ILlmProvider {
  readonly name = "ollama";
  private readonly client: AxiosInstance;
  private readonly defaultModel: string;

  constructor(
    baseURL: string = env.ollamaUrl,
    defaultModel: string = env.model,
    timeoutMs: number = env.ollamaTimeoutMs
  ) {
    this.defaultModel = defaultModel;
    this.client = axios.create({
      baseURL,
      timeout: timeoutMs,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async generate(
    prompt: string,
    options: LlmGenerateOptions = {}
  ): Promise<LlmGenerateResult> {
    const model = options.model ?? this.defaultModel;
    const fullPrompt = options.system
      ? `${options.system}\n\n${prompt}`
      : prompt;

    try {
      const response = await this.client.post<OllamaGenerateResponse>(
        "/api/generate",
        {
          model,
          prompt: fullPrompt,
          stream: false,
          options:
            options.temperature !== undefined
              ? { temperature: options.temperature }
              : undefined,
        }
      );

      const text = response.data.response?.trim();
      if (!text) {
        throw new ProviderError("Ollama retornou resposta vazia");
      }

      return {
        text,
        model: response.data.model ?? model,
        provider: this.name,
      };
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      const axiosError = error as AxiosError;
      const details =
        axiosError.response?.data ??
        axiosError.message ??
        "erro desconhecido";

      logger.error("Falha ao consultar Ollama", {
        provider: this.name,
        model,
        details,
      });

      if (axiosError.code === "ECONNABORTED") {
        throw new ProviderTimeoutError("Timeout ao consultar Ollama", details);
      }

      throw new ProviderError("Erro ao consultar Ollama", details);
    }
  }
}

let singleton: OllamaProvider | undefined;

export function getOllamaProvider(): OllamaProvider {
  if (!singleton) {
    singleton = new OllamaProvider();
  }
  return singleton;
}
