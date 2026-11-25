import { addDays, diffDays, type DayKey } from "./day";

export type Streak = {
  /** Consecutive active days ending today, or ending yesterday if today has no activity yet. */
  current: number;
  longest: number;
};

/**
 * @param activeDays days with at least one attempt (any order, duplicates allowed)
 * @param today the user's current day
 */
export function computeStreak(activeDays: Iterable<DayKey>, today: DayKey): Streak {
  const days = new Set(activeDays);

  // Today not done yet does not break the streak: the user still has time to keep it.
  let cursor = days.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let prev: DayKey | undefined;
  for (const day of [...days].sort()) {
    run = prev !== undefined && diffDays(prev, day) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = day;
  }

  return { current, longest };
}
