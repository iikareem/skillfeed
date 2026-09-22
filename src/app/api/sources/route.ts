import { ALL_SOURCE_IDS, fetchSources, type ArticleSourceId } from "@/sources";
import { jsonError, jsonOk } from "@/lib/http";

/** GET /api/sources?limit=10&source=devto — debug metadata fetch. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "10") || 10, 50);
  const sourceParam = searchParams.get("source");

  if (
    sourceParam &&
    !ALL_SOURCE_IDS.includes(sourceParam as ArticleSourceId)
  ) {
    return jsonError(
      `Unknown source. Use one of: ${ALL_SOURCE_IDS.join(", ")}`,
      400,
    );
  }

  const sources = sourceParam
    ? ([sourceParam] as ArticleSourceId[])
    : ALL_SOURCE_IDS;

  const results = await fetchSources({ limit, sources });

  return jsonOk({
    count: results.reduce((n, r) => n + r.articles.length, 0),
    results,
  });
}
