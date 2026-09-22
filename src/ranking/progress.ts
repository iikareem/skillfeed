import type { ArticleSourceId } from "@/sources";
import type { EvaluationUsage } from "@/evaluation";
import type { RankResult, SourceSummary } from "./types";

/**
 * Progress events emitted while ranking runs.
 *
 * Flow:
 *   fetching  → we started pulling article sources
 *   fetched   → sources are in; here are the counts
 *   scoring   → AI batches finishing (completed/total)
 *   sorting   → scores ready, sorting the list
 *   complete  → final RankResult (only sent from the API route)
 *   error     → something failed
 *
 * The ranking service emits the middle stages via onProgress().
 * The API route wraps that into SSE and adds complete/error.
 */
export type RankProgressEvent =
  | { stage: "fetching"; message: string }
  | {
      stage: "fetched";
      message: string;
      articleCount: number;
      sources: SourceSummary[];
    }
  | {
      stage: "scoring";
      message: string;
      /** How many AI batches finished so far. */
      completed: number;
      /** Total AI batches for this run. */
      total: number;
    }
  | { stage: "sorting"; message: string }
  | { stage: "complete"; result: RankResult }
  | { stage: "error"; error: string };

/** Optional callback the API (or tests) can pass into rankArticles(). */
export type RankProgressHandler = (event: RankProgressEvent) => void;

export function sourceLabel(id: ArticleSourceId): string {
  return id.replace("-", " ");
}

export function formatUsage(usage: EvaluationUsage): string {
  if (usage.inputTokens == null) return "";
  return `${usage.inputTokens} tokens`;
}
