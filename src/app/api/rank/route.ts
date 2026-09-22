import {rankArticles, rankRequestSchema} from "@/ranking";
import type {RankProgressEvent} from "@/ranking/progress";
import {jsonError, readJsonBody} from "@/lib/http";

/**
 * POST /api/rank
 *
 * Why a stream (SSE) instead of one JSON response?
 * -----------------------------------------------
 * Ranking is slow: fetch 4 sites, then call the AI scorer in batches.
 * If we waited until everything finished, the UI would show a blank spinner.
 *
 * Instead we keep the HTTP connection open and push small progress events
 * as each stage finishes. The browser updates Fetch → Match → Sort in real time.
 *
 * Wire format: Server-Sent Events (SSE)
 *   data: {"stage":"fetching","message":"..."}\n\n
 *   data: {"stage":"scoring","completed":1,"total":4,...}\n\n
 *   data: {"stage":"complete","result":{...}}\n\n
 *
 * The last event is always `complete` (with ranked articles) or `error`.
 */
export async function POST(req: Request) {
    const body = await readJsonBody(req);
    if (!body.ok) return body.response;

    const parsed = rankRequestSchema.safeParse(body.data);
    if (!parsed.success) {
        return jsonError("Invalid request", 400, {
            details: parsed.error.flatten(),
        });
    }

    // Turn JS strings into bytes we can write onto the response stream.
    const encoder = new TextEncoder();

    /**
     * ReadableStream = the response body that stays open.
     * We write ("enqueue") SSE chunks into it whenever ranking reports progress.
     */
    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            // Helper: package one progress object as an SSE "data:" line.
            const send = (event: RankProgressEvent) => {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
                );
            };

            try {
                // Pass `send` as onProgress so rankArticles can report live updates.
                // ranking itself does not know about HTTP/SSE — it just calls onProgress().
                const result = await rankArticles(parsed.data, {
                        onProgress: send,
                    }
                );

                // Final payload: the ranked list the UI will render.
                send({stage: "complete", result});
            } catch (error) {
                send({
                    stage: "error",
                    error:
                        error instanceof Error ? error.message : "Failed to rank articles",
                });
            } finally {
                // Close the stream so the browser knows there are no more events.
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            // Tells the client "read this as an event stream", not as one JSON blob.
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
