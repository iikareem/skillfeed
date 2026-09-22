/** Small helpers so API routes stay thin and consistent. */

export async function readJsonBody(req: Request): Promise<
  { ok: true; data: unknown } | { ok: false; response: Response }
> {
  try {
    return { ok: true, data: await req.json() };
  } catch {
    return {
      ok: false,
      response: Response.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
}

export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function jsonError(
  error: string,
  status = 500,
  extra?: Record<string, unknown>,
): Response {
  return Response.json({ error, ...extra }, { status });
}
