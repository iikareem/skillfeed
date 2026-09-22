import type { ArticleMetadata, FetchArticlesOptions } from "./types";

/**
 * Dev.to — public REST API (no API key for listing articles).
 * Docs: https://developers.forem.com/api/v1
 *
 * Endpoint:
 * - GET https://dev.to/api/articles?per_page={n}&top=7
 *
 * Returns title, description, tag_list, url, user, published_at — metadata only.
 */

const DEVTO_API = "https://dev.to/api";

type DevtoArticle = {
  id: number;
  title: string;
  description: string;
  url: string;
  tag_list: string[];
  published_at: string;
  positive_reactions_count?: number;
  user?: { name?: string; username?: string };
};

export async function fetchDevtoArticles(
  options: FetchArticlesOptions = {},
): Promise<ArticleMetadata[]> {
  const limit = Math.min(options.limit ?? 30, 100);
  const res = await fetch(
    `${DEVTO_API}/articles?per_page=${limit}&top=7`,
    { next: { revalidate: 300 } },
  );

  if (!res.ok) {
    throw new Error(`Dev.to articles failed: ${res.status}`);
  }

  const articles = (await res.json()) as DevtoArticle[];

  return articles.map((article) => ({
    id: String(article.id),
    source: "devto" as const,
    title: article.title,
    description: (article.description ?? "").trim(),
    url: article.url,
    tags: article.tag_list ?? [],
    author: article.user?.name ?? article.user?.username ?? null,
    publishedAt: article.published_at ?? null,
    score: article.positive_reactions_count ?? null,
    discussionUrl: article.url,
  }));
}
