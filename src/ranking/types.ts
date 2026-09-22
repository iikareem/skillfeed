import type { ArticleMetadata, ArticleSourceId } from "@/sources";
import type { EvaluationUsage } from "@/evaluation";

export type UserProfile = {
  /** Skills / stack / focus in one short paragraph. */
  summary: string;
  /** Topics or formats to push down. */
  avoid?: string;
};

export type RankOptions = {
  profile: UserProfile;
  /** Articles to pull per source. */
  perSource?: number;
  /** Cap after dedupe, before scoring. */
  maxArticles?: number;
  /** Articles per evaluation request (context budget). */
  batchSize?: number;
  sources?: ArticleSourceId[];
};

export type ArticleScore = {
  /** Skill-match score on 0–3 rubric. */
  score: number;
  probabilities?: Record<string, number>;
};

export type RankedArticle = ArticleMetadata & {
  verdict: ArticleScore;
};

export type SourceSummary = {
  source: ArticleSourceId;
  count: number;
  error?: string;
};

export type RankResult = {
  ranked: RankedArticle[];
  sources: SourceSummary[];
  evaluation: {
    batches: number;
    usage: EvaluationUsage;
  };
};
