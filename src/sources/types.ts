/** Normalized article metadata for ranking (no full page body). */
export type ArticleSourceId =
  | "hacker-news"
  | "devto"
  | "hashnode"
  | "lobsters";

export type ArticleMetadata = {
  /** Stable id within the source, e.g. HN item id or slug. */
  id: string;
  source: ArticleSourceId;
  title: string;
  /** Short blurb / tagline / HN title-only fallback. Never full article HTML. */
  description: string;
  url: string;
  tags: string[];
  /** Author display name when available. */
  author: string | null;
  /** ISO timestamp when available. */
  publishedAt: string | null;
  /** Source-native score/points when available. */
  score: number | null;
  /** Direct link on the platform (discussion page), if different from url. */
  discussionUrl: string | null;
};

export type FetchArticlesOptions = {
  /** Max items to return from this source. Default varies by source. */
  limit?: number;
};
