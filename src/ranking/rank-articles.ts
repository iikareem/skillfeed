import {
  createEvaluationProvider,
  type EvaluationProvider,
} from "@/evaluation";
import { collectArticles, articleKey } from "./collect-articles";
import { RANK_DEFAULTS } from "./config";
import type { RankProgressHandler } from "./progress";
import { scoreArticles } from "./score-articles";
import type { RankOptions, RankResult, RankedArticle } from "./types";

/**
 * Rank today's articles for a user profile.
 *
 * Steps:
 * 1. Collect metadata from sources (parallel)
 * 2. Score against skills summary (batched evaluate)
 * 3. Sort highest skill-match first
 *
 * `onProgress` (optional):
 *   Called at each step so the HTTP layer can stream updates to the UI.
 *   This function stays framework-free — it never talks to SSE/HTTP itself.
 */
export async function rankArticles(
  options: RankOptions,
  deps?: {
    provider?: EvaluationProvider;
    onProgress?: RankProgressHandler;
  },
): Promise<RankResult> {
  const perSource = options.perSource ?? RANK_DEFAULTS.perSource;
  const maxArticles = options.maxArticles ?? RANK_DEFAULTS.maxArticles;
  const batchSize = options.batchSize ?? RANK_DEFAULTS.batchSize;
  const provider = deps?.provider ?? createEvaluationProvider();
  const onProgress = deps?.onProgress;

  // --- Stage 1: tell the UI we are fetching feeds ---
  onProgress?.({
    stage: "fetching",
    message: "Pulling today’s feeds from HN, Dev.to, Hashnode, Lobsters",
  });

  const { articles, sources } = await collectArticles({
    perSource,
    maxArticles,
    sources: options.sources,
  });

  // --- Stage 2: fetch done — include per-source counts for the progress panel ---
  onProgress?.({
    stage: "fetched",
    articleCount: articles.length,
    sources,
    message:
      articles.length === 0
        ? "No articles found — try again shortly"
        : `Collected ${articles.length} articles — ready to score`,
  });

  // --- Stage 3: AI scoring (scoreArticles also emits "scoring" as each batch finishes) ---
  const { scores, batches, usage } = await scoreArticles({
    profile: options.profile,
    articles,
    batchSize,
    provider,
    onProgress,
  });

  // --- Stage 4: local sort (fast) ---
  onProgress?.({
    stage: "sorting",
    message: "Sorting by skill match",
  });

  const ranked: RankedArticle[] = articles
    .map((article) => ({
      ...article,
      verdict: scores.get(articleKey(article)) ?? { score: 0 },
    }))
    .sort((a, b) => b.verdict.score - a.verdict.score);

  // Return the final list to the caller (API will send it as stage:"complete").
  return {
    ranked,
    sources,
    evaluation: { batches, usage },
  };
}
