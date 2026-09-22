import {
  createGateway,
  experimental_evaluate as evaluate,
  type Experimental_EvaluationQuestion,
} from "ai";
import { getAiGatewayApiKey } from "@/lib/env";
import type {
  EvaluateRequest,
  EvaluateResponse,
  EvaluationProvider,
} from "../types";

type Options = {
  model?: string;
  apiKey?: string;
};

/** Vercel AI Gateway adapter for typesafe-ai/jev (and other gateway eval models). */
export class VercelGatewayProvider implements EvaluationProvider {
  readonly id = "vercel-gateway";

  private readonly modelId: string;
  private readonly apiKey: string;

  constructor(options: Options = {}) {
    const apiKey = options.apiKey ?? getAiGatewayApiKey();
    if (!apiKey) {
      throw new Error(
        "AI_GATEWAY_API_KEY is missing. Add it to .env.local and restart the server.",
      );
    }

    this.apiKey = apiKey;
    this.modelId = options.model ?? "typesafe-ai/jev";
  }

  async evaluate(request: EvaluateRequest): Promise<EvaluateResponse> {
    const gateway = createGateway({ apiKey: this.apiKey });
    const questions = request.questions as Record<
      string,
      Experimental_EvaluationQuestion
    >;

    const result = await evaluate({
      model: gateway.evaluationModel(this.modelId),
      state: request.state,
      questions,
    });

    return {
      answers: result.answers as EvaluateResponse["answers"],
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        totalTokens: result.usage.totalTokens,
      },
      provider: this.id,
      modelId: result.response?.modelId ?? this.modelId,
      raw: {
        warnings: result.warnings,
        providerMetadata: result.providerMetadata,
        response: result.response,
      },
    };
  }
}
