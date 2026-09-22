import type { ArticleMetadata, FetchArticlesOptions } from "./types";

/**
 * Hacker News — public Firebase API (no API key).
 * Docs: https://github.com/HackerNews/API
 *
 * Endpoints used:
 * - GET https://hacker-news.firebaseio.com/v0/topstories.json
 * - GET https://hacker-news.firebaseio.com/v0/item/{id}.json
 *
 * Metadata only: title, url, score, by, time. HN does not provide article
 * summaries for external links; description stays empty unless `text` exists
 * (Ask HN / Show HN self-posts, truncated).
 */

const HN_API = "https://hacker-news.firebaseio.com/v0";

type HnItem = {
  id: number;
  type?: string;
  title?: string;
  url?: string;
  text?: string;
  score?: number;
  by?: string;
  time?: number;
  dead?: boolean;
  deleted?: boolean;
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchHackerNewsArticles(
  options: FetchArticlesOptions = {},
): Promise<ArticleMetadata[]> {
  const limit = options.limit ?? 30;

  const idsRes = await fetch(`${HN_API}/topstories.json`, {
    next: { revalidate: 300 },
  });
  if (!idsRes.ok) {
    throw new Error(`Hacker News topstories failed: ${idsRes.status}`);
  }

  const ids = (await idsRes.json()) as number[];
  const selected = ids.slice(0, limit);

  const items = await Promise.all(
    selected.map(async (id) => {
      const res = await fetch(`${HN_API}/item/${id}.json`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) return null;
      return (await res.json()) as HnItem;
    }),
  );

  return items
    .filter((item): item is HnItem => {
      return (
        !!item &&
        !item.dead &&
        !item.deleted &&
        item.type === "story" &&
        !!item.title
      );
    })
    .map((item) => {
      const discussionUrl = `https://news.ycombinator.com/item?id=${item.id}`;
      const rawText = item.text ? stripHtml(item.text) : "";
      return {
        id: String(item.id),
        source: "hacker-news" as const,
        title: item.title!,
        description: rawText.slice(0, 400),
        url: item.url ?? discussionUrl,
        tags: [],
        author: item.by ?? null,
        publishedAt: item.time
          ? new Date(item.time * 1000).toISOString()
          : null,
        score: item.score ?? null,
        discussionUrl,
      };
    });
}
