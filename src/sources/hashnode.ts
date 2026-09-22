import type { ArticleMetadata, FetchArticlesOptions } from "./types";

/**
 * Hashnode — public GraphQL API (no API key for public feed reads).
 * Endpoint: POST https://gql-beta.hashnode.com/
 * Docs / skill: https://github.com/Hashnode/gql-skill
 *
 * Query: `feed` with title + `brief` (short description), tags, url, author.
 * Does not request post body / markdown.
 */

const HASHNODE_GQL = "https://gql-beta.hashnode.com/";

const FEED_QUERY = `
  query FetchFeed($first: Int!) {
    feed(first: $first) {
      edges {
        node {
          id
          title
          brief
          url
          publishedAt
          reactionCount
          tags { name }
          author { name username }
        }
      }
    }
  }
`;

type HashnodeFeedResponse = {
  data?: {
    feed?: {
      edges?: Array<{
        node: {
          id: string;
          title: string;
          brief?: string;
          url: string;
          publishedAt?: string;
          reactionCount?: number;
          tags?: Array<{ name?: string }>;
          author?: { name?: string; username?: string };
        };
      }>;
    };
  };
  errors?: Array<{ message: string }>;
};

export async function fetchHashnodeArticles(
  options: FetchArticlesOptions = {},
): Promise<ArticleMetadata[]> {
  const limit = Math.min(options.limit ?? 30, 50);

  const res = await fetch(HASHNODE_GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: FEED_QUERY,
      variables: { first: limit },
    }),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Hashnode feed failed: ${res.status}`);
  }

  const json = (await res.json()) as HashnodeFeedResponse;
  if (json.errors?.length) {
    throw new Error(`Hashnode GraphQL: ${json.errors[0].message}`);
  }

  const edges = json.data?.feed?.edges ?? [];

  return edges.map(({ node }) => ({
    id: node.id,
    source: "hashnode" as const,
    title: node.title,
    description: (node.brief ?? "").trim(),
    url: node.url,
    tags: (node.tags ?? [])
      .map((t) => t.name)
      .filter((name): name is string => !!name),
    author: node.author?.name ?? node.author?.username ?? null,
    publishedAt: node.publishedAt ?? null,
    score: node.reactionCount ?? null,
    discussionUrl: node.url,
  }));
}
