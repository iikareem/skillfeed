import type { ArticleMetadata, FetchArticlesOptions } from "./types";

/**
 * Lobsters — public JSON feeds (no API key).
 * Docs: https://lobste.rs/s/qisur2/how_does_lobsters_api_work
 *
 * Endpoint:
 * - GET https://lobste.rs/hottest.json
 *
 * Fields: title, description (short), url, tags, score, submitter, created_at.
 */

const LOBSTERS_API = "https://lobste.rs";

type LobstersStory = {
  short_id: string;
  title: string;
  description?: string;
  url: string;
  comments_url: string;
  score?: number;
  tags?: string[];
  created_at?: string;
  submitter_user?: string | { username?: string };
};

export async function fetchLobstersArticles(
  options: FetchArticlesOptions = {},
): Promise<ArticleMetadata[]> {
  const limit = options.limit ?? 30;

  const res = await fetch(`${LOBSTERS_API}/hottest.json`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Lobsters hottest failed: ${res.status}`);
  }

  const stories = (await res.json()) as LobstersStory[];

  return stories.slice(0, limit).map((story) => {
    const author =
      typeof story.submitter_user === "string"
        ? story.submitter_user
        : (story.submitter_user?.username ?? null);

    return {
      id: story.short_id,
      source: "lobsters" as const,
      title: story.title,
      description: (story.description ?? "").trim(),
      url: story.url || story.comments_url,
      tags: story.tags ?? [],
      author,
      publishedAt: story.created_at ?? null,
      score: story.score ?? null,
      discussionUrl: story.comments_url,
    };
  });
}
