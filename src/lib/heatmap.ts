import type { Attempt } from "@/db/schema";
import { addDays, dayOfWeek, toDayKey, type DayKey, type DaySettings } from "./day";

/** Number of attempts per user day. Also the input for computeStreak (its keys are the active days). */
export function countByDay(
  attempts: readonly Pick<Attempt, "attemptedAt">[],
  settings: DaySettings,
): Map<DayKey, number> {
  const counts = new Map<DayKey, number>();
  for (const a of attempts) {
    const day = toDayKey(a.attemptedAt, settings);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return counts;
}

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Colour level relative to the daily goal:
 * 0 = nothing, 1–2 = below goal, 3 = goal met, 4 = above goal.
 */
export function heatLevel(count: number, dailyGoal: number): HeatLevel {
  if (count <= 0) return 0;
  const goal = Math.max(1, dailyGoal);
  if (count > goal) return 4;
  if (count === goal) return 3;
  return count * 2 < goal ? 1 : 2;
}

export type HeatmapCell = { day: DayKey; count: number; level: HeatLevel };

export type HeatmapOptions = {
  counts: ReadonlyMap<DayKey, number>;
  today: DayKey;
  dailyGoal: number;
  /** Number of week columns, the last one containing today. Default 20. */
  weeks?: number;
  /** 0 = Sunday, 1 = Monday. Default 1. */
  weekStartsOn?: 0 | 1;
};

/**
 * A GitHub-style grid: one array per week (oldest first), each with 7 cells from
 * weekStartsOn onwards. Days after today are null.
 */
export function buildHeatmap({
  counts,
  today,
  dailyGoal,
  weeks = 20,
  weekStartsOn = 1,
}: HeatmapOptions): (HeatmapCell | null)[][] {
  const offset = (dayOfWeek(today) - weekStartsOn + 7) % 7;
  const start = addDays(today, -offset - (weeks - 1) * 7);

  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(start, w * 7 + d);
      if (day > today) return null;
      const count = counts.get(day) ?? 0;
      return { day, count, level: heatLevel(count, dailyGoal) };
    }),
  );
}
