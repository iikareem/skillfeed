import fs from "node:fs";
import path from "node:path";

/**
 * Read AI Gateway API key.
 * In development, prefer `.env.local` so a stale shell export cannot win.
 */
export function getAiGatewayApiKey(): string | undefined {
  if (process.env.NODE_ENV !== "production") {
    const fromFile = readEnvLocal("AI_GATEWAY_API_KEY");
    if (fromFile) return fromFile;
  }

  return process.env.AI_GATEWAY_API_KEY?.trim() || undefined;
}

function readEnvLocal(key: string): string | undefined {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      if (!trimmed.startsWith(`${key}=`)) continue;

      let value = trimmed.slice(key.length + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      const cleaned = value.trim();
      if (cleaned) return cleaned;
    }
  } catch {
    return undefined;
  }

  return undefined;
}
