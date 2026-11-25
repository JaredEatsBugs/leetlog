import type { TodayResponse } from "@/contracts/today";
import { summarizeToday } from "@/lib/today";
import { allAttempts } from "@/server/attempts";
import { getCurrentUser } from "@/server/current-user";
import { toAttemptDto, toProblemDto } from "@/server/dto";
import { unauthorized } from "@/server/http";

/** GET /api/today: streak, today's progress, review queue, this week and the heatmap. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const rows = await allAttempts(user.id);
  const problemById = new Map(rows.map((r) => [r.problem.id, r.problem]));

  const summary = summarizeToday(
    rows.map((r) => ({ ...r.attempt, row: r })),
    new Date(),
    user,
  );

  return Response.json({
    today: summary.today,
    dailyGoal: user.dailyGoal,
    solvedToday: summary.solvedToday,
    streak: summary.streak,
    reviewQueue: summary.reviewQueue.map(({ problemId, ...item }) => ({
      ...item,
      problem: toProblemDto(problemById.get(problemId)!),
    })),
    todayAttempts: summary.todayAttempts.map((a) =>
      toAttemptDto(a.row.attempt, a.row.problem, user),
    ),
    thisWeek: summary.thisWeek,
    heatmap: summary.heatmap,
  } satisfies TodayResponse);
}
