import { fetchDevtoArticles } from "./devto";
import { fetchHackerNewsArticles } from "./hacker-news";
import { fetchHashnodeArticles } from "./hashnode";
import { fetchLobstersArticles } from "./lobsters";
import type {
  ArticleMetadata,
  ArticleSourceId,
  FetchArticlesOptions,
} from "./types";

export type { ArticleMetadata, ArticleSourceId, FetchArticlesOptions };

export type SourceFetchResult = {
  source: ArticleSourceId;
  articles: ArticleMetadata[];
  error?: string;
};

type SourceFetcher = (
  options?: FetchArticlesOptions,
) => Promise<ArticleMetadata[]>;

/** One fetcher per platform. Add a new source by registering it here. */
export const ARTICLE_SOURCES: Record<ArticleSourceId, SourceFetcher> = {
  "hacker-news": fetchHackerNewsArticles,
  devto: fetchDevtoArticles,
  hashnode: fetchHashnodeArticles,
  lobsters: fetchLobstersArticles,
};

export const ALL_SOURCE_IDS = Object.keys(
  ARTICLE_SOURCES,
) as ArticleSourceId[];

export async function fetchSource(
  source: ArticleSourceId,
  options?: FetchArticlesOptions,
): Promise<ArticleMetadata[]> {
  return ARTICLE_SOURCES[source](options);
}

/** Fetch many sources in parallel. One failure does not fail the others. */
export async function fetchSources(
  options: FetchArticlesOptions & { sources?: ArticleSourceId[] } = {},
): Promise<SourceFetchResult[]> {
  const sources = options.sources ?? ALL_SOURCE_IDS;

  return Promise.all(
    sources.map(async (source) => {
      try {
        const articles = await ARTICLE_SOURCES[source]({
          limit: options.limit,
        });
        return { source, articles };
      } catch (error) {
        return {
          source,
          articles: [],
          error: error instanceof Error ? error.message : "Fetch failed",
        };
      }
    }),
  );
}

/** @deprecated Use fetchSources */
export const fetchAllSources = fetchSources;
