import { searchProblemsQuery, type SearchProblemsResponse } from "@/contracts/problems";
import { getCurrentUser } from "@/server/current-user";
import { toProblemDto } from "@/server/dto";
import { parseQuery, unauthorized } from "@/server/http";
import { searchProblems } from "@/server/problems";

/** GET /api/problems?q=: search the shared catalog by number, URL, slug or title. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const query = parseQuery(request, searchProblemsQuery);
  if (!query.ok) return query.response;

  const problems = await searchProblems(query.data.q);
  return Response.json({ problems: problems.map(toProblemDto) } satisfies SearchProblemsResponse);
}
