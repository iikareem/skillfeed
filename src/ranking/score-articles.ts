import type {
  EvaluateRequest,
  EvaluateResponse,
  EvaluationProvider,
  EvaluationQuestion,
  EvaluationUsage,
} from "@/evaluation";
import { chunkArray } from "@/lib/chunk";
import type { ArticleMetadata } from "@/sources";
import { articleKey } from "./collect-articles";
import type { RankProgressHandler } from "./progress";
import type { ArticleScore, UserProfile } from "./types";

/** poor → fair → good → excellent (0–3). */
export const SKILL_MATCH_CRITERIA = [
  "poor: no overlap with the user's skill summary",
  "fair: weak or indirect overlap",
  "good: clear match to the skill summary",
  "excellent: strong match and useful given what they care about",
] as const;

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, "_");
}

function questionId(article: ArticleMetadata): string {
  return `skill_${safeId(articleKey(article))}`;
}

function toEvaluateRequest(
  profile: UserProfile,
  articles: ArticleMetadata[],
): EvaluateRequest {
  const compact = articles.map((article) => ({
    key: articleKey(article),
    source: article.source,
    title: article.title,
    description: article.description.slice(0, 280),
    tags: article.tags.slice(0, 8),
  }));

  const questions: Record<string, EvaluationQuestion> = {};

  for (const article of compact) {
    questions[`skill_${safeId(article.key)}`] = {
      type: "score",
      instructions:
        `Rate how well article key="${article.key}" matches the user's skill summary. ` +
        "Penalize anything listed under avoid. " +
        "Use only the article title, description, and tags in state.",
      criteria: [...SKILL_MATCH_CRITERIA],
    };
  }

  return {
    state: { profile, articles: compact },
    questions,
  };
}

function readScores(
  articles: ArticleMetadata[],
  response: EvaluateResponse,
): Map<string, ArticleScore> {
  const scores = new Map<string, ArticleScore>();

  for (const article of articles) {
    const answer = response.answers[questionId(article)];
    scores.set(
      articleKey(article),
      answer?.type === "score"
        ? { score: answer.score, probabilities: answer.probabilities }
        : { score: 0 },
    );
  }

  return scores;
}

function emptyUsage(): EvaluationUsage {
  return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
}

function sumUsage(a: EvaluationUsage, b: EvaluationUsage): EvaluationUsage {
  return {
    inputTokens: (a.inputTokens ?? 0) + (b.inputTokens ?? 0),
    outputTokens: (a.outputTokens ?? 0) + (b.outputTokens ?? 0),
    totalTokens: (a.totalTokens ?? 0) + (b.totalTokens ?? 0),
  };
}

export type ScoreBatchResult = {
  scores: Map<string, ArticleScore>;
  batches: number;
  usage: EvaluationUsage;
};

/**
 * Score articles against the profile in parallel batches
 * (keeps each request under the model context window).
 */
export async function scoreArticles(options: {
  profile: UserProfile;
  articles: ArticleMetadata[];
  batchSize: number;
  provider: EvaluationProvider;
  onProgress?: RankProgressHandler;
}): Promise<ScoreBatchResult> {
  const { profile, articles, batchSize, provider, onProgress } = options;

  if (articles.length === 0) {
    return { scores: new Map(), batches: 0, usage: emptyUsage() };
  }

  const batches = chunkArray(articles, batchSize);
  let completed = 0;

  // Run batches in parallel for speed, but report each one as it finishes
  // so the UI can show "Matching batch 2 of 4".
  const results = await Promise.all(
    batches.map(async (batch) => {
      const response = await provider.evaluate(
        toEvaluateRequest(profile, batch),
      );

      completed += 1;
      // Live progress: how many AI batches are done vs total.
      onProgress?.({
        stage: "scoring",
        completed,
        total: batches.length,
        message: `Matching batch ${completed} of ${batches.length} to your skills`,
      });

      return {
        scores: readScores(batch, response),
        usage: response.usage,
      };
    }),
  );

  const scores = new Map<string, ArticleScore>();
  let usage = emptyUsage();

  for (const result of results) {
    usage = sumUsage(usage, result.usage);
    for (const [key, score] of result.scores) {
      scores.set(key, score);
    }
  }

  return { scores, batches: batches.length, usage };
}
