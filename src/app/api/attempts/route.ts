import { z } from "zod";
import {
  createAttemptRequest,
  listAttemptsQuery,
  type CreateAttemptResponse,
  type ListAttemptsResponse,
} from "@/contracts/attempts";
import { decodeCursor, encodeCursor } from "@/lib/cursor";
import { createAttempt, listAttempts } from "@/server/attempts";
import { getCurrentUser } from "@/server/current-user";
import { toAttemptDto } from "@/server/dto";
import { errorResponse, notFound, parseBody, parseQuery, unauthorized } from "@/server/http";

/** POST /api/attempts: log an attempt. 201 with the created attempt. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await parseBody(request, createAttemptRequest);
  if (!body.ok) return body.response;

  const created = await createAttempt(user.id, body.data);
  if (!created.ok) {
    return created.error === "problem_not_found"
      ? notFound("problem_not_found")
      : errorResponse(409, "problem_conflict", {
          message: "frontendId already belongs to a problem with a different slug",
        });
  }

  const { attempt, problem } = created.value;
  return Response.json(
    { attempt: toAttemptDto(attempt, problem, user) } satisfies CreateAttemptResponse,
    { status: 201 },
  );
}

/** GET /api/attempts?limit=&cursor=&problemId=: the user's attempts, newest first. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const query = parseQuery(request, listAttemptsQuery);
  if (!query.ok) return query.response;
  const { limit, problemId } = query.data;

  let cursor;
  if (query.data.cursor !== undefined) {
    cursor = decodeCursor(query.data.cursor);
    if (!cursor || !z.uuid().safeParse(cursor.id).success) {
      return errorResponse(400, "invalid_cursor");
    }
  }

  // Fetch one extra row to know whether there is another page.
  const rows = await listAttempts(user.id, { limit: limit + 1, cursor, problemId });
  const page = rows.slice(0, limit);
  const last = page.at(-1);

  return Response.json({
    attempts: page.map((r) => toAttemptDto(r.attempt, r.problem, user)),
    nextCursor: rows.length > limit && last ? encodeCursor(last.attempt) : null,
  } satisfies ListAttemptsResponse);
}
