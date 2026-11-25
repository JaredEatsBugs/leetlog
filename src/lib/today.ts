import { addDays, dayOfWeek, toDayKey, type DayKey, type DaySettings } from "./day";
import { buildHeatmap, countByDay, type HeatmapCell } from "./heatmap";
import { reviewQueue, type ReviewAttempt, type ReviewItem } from "./review";
import { computeStreak, type Streak } from "./streak";

export type TodaySummary<A> = {
  today: DayKey;
  solvedToday: number;
  streak: Streak;
  reviewQueue: ReviewItem[];
  /** Newest first. */
  todayAttempts: A[];
  thisWeek: { start: DayKey; attempts: number; soloRate: number | null };
  heatmap: (HeatmapCell | null)[][];
};

/**
 * Everything the Today page shows, from all of the user's attempts.
 * Generic over the attempt type so callers get their own rows back in todayAttempts.
 */
export function summarizeToday<A extends ReviewAttempt>(
  attempts: readonly A[],
  now: Date,
  settings: DaySettings & { dailyGoal: number },
): TodaySummary<A> {
  const today = toDayKey(now, settings);
  const withDay = attempts.map((a) => ({ a, day: toDayKey(a.attemptedAt, settings) }));

  const todayAttempts = withDay
    .filter((x) => x.day === today)
    .map((x) => x.a)
    .sort((x, y) => y.attemptedAt.getTime() - x.attemptedAt.getTime());

  // Weeks start on Monday, matching the heatmap columns.
  const weekStart = addDays(today, -((dayOfWeek(today) + 6) % 7));
  const week = withDay.filter((x) => x.day >= weekStart && x.day <= today);
  const solo = week.filter((x) => x.a.result === "solo").length;

  const counts = countByDay(attempts, settings);

  return {
    today,
    solvedToday: todayAttempts.length,
    streak: computeStreak(counts.keys(), today),
    reviewQueue: reviewQueue(attempts, today, settings),
    todayAttempts,
    thisWeek: {
      start: weekStart,
      attempts: week.length,
      soloRate: week.length === 0 ? null : solo / week.length,
    },
    heatmap: buildHeatmap({ counts, today, dailyGoal: settings.dailyGoal }),
  };
}
