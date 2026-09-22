import {
  fetchSources,
  type ArticleMetadata,
  type ArticleSourceId,
} from "@/sources";
import type { SourceSummary } from "./types";

export function articleKey(article: ArticleMetadata): string {
  return `${article.source}:${article.id}`;
}

function dedupe(articles: ArticleMetadata[]): ArticleMetadata[] {
  const seen = new Set<string>();
  const unique: ArticleMetadata[] = [];

  for (const article of articles) {
    const url = article.url.toLowerCase();
    const key = articleKey(article);
    if (seen.has(url) || seen.has(key)) continue;
    seen.add(url);
    seen.add(key);
    unique.push(article);
  }

  return unique;
}

export type CollectedArticles = {
  articles: ArticleMetadata[];
  sources: SourceSummary[];
};

/** Parallel fetch → dedupe → cap. Metadata only. */
export async function collectArticles(options: {
  perSource: number;
  maxArticles: number;
  sources?: ArticleSourceId[];
}): Promise<CollectedArticles> {
  const results = await fetchSources({
    limit: options.perSource,
    sources: options.sources,
  });

  const articles = dedupe(results.flatMap((r) => r.articles)).slice(
    0,
    options.maxArticles,
  );

  const sources: SourceSummary[] = results.map((r) => ({
    source: r.source,
    count: r.articles.length,
    error: r.error,
  }));

  return { articles, sources };
}
