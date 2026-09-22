import { VercelGatewayProvider } from "./providers/vercel-gateway";
import type { EvaluationProvider, EvaluationProviderId } from "./types";

type Options = {
  provider?: EvaluationProviderId;
  model?: string;
  apiKey?: string;
};

/**
 * Create the active evaluation backend.
 * Switch providers via `EVALUATION_PROVIDER` or `options.provider`.
 */
export function createEvaluationProvider(
  options: Options = {},
): EvaluationProvider {
  const id = resolveProviderId(options.provider);

  switch (id) {
    case "vercel-gateway":
      return new VercelGatewayProvider({
        model: options.model,
        apiKey: options.apiKey,
      });
    default: {
      const _never: never = id;
      throw new Error(`Unhandled evaluation provider: ${String(_never)}`);
    }
  }
}

function resolveProviderId(
  explicit?: EvaluationProviderId,
): EvaluationProviderId {
  if (explicit) return explicit;

  const fromEnv = process.env.EVALUATION_PROVIDER;
  if (!fromEnv || fromEnv === "vercel-gateway") return "vercel-gateway";

  throw new Error(
    `Unknown EVALUATION_PROVIDER "${fromEnv}". Supported: vercel-gateway`,
  );
}
