import type { z } from "zod";

// JSON error responses share one shape: { error: string, issues?: ZodIssue[] }.

export function errorResponse(status: number, error: string, extra?: object): Response {
  return Response.json({ error, ...extra }, { status });
}

export const unauthorized = () => errorResponse(401, "unauthorized");
export const notFound = (what = "not found") => errorResponse(404, what);

type Parsed<T> = { ok: true; data: T } | { ok: false; response: Response };

function fromZod<T>(result: z.ZodSafeParseResult<T>): Parsed<T> {
  return result.success
    ? { ok: true, data: result.data }
    : {
        ok: false,
        response: errorResponse(400, "invalid_request", { issues: result.error.issues }),
      };
}

export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<Parsed<z.output<S>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: errorResponse(400, "invalid_json") };
  }
  return fromZod(schema.safeParse(body));
}

export function parseQuery<S extends z.ZodType>(request: Request, schema: S): Parsed<z.output<S>> {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return fromZod(schema.safeParse(params));
}
