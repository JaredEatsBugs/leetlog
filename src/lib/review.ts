import type { Attempt } from "@/db/schema";
import { addDays, diffDays, toDayKey, type DayKey, type DaySettings } from "./day";

export type AttemptResult = Attempt["result"];

/**
 * Days until a problem comes back for review, by the result of its latest attempt.
 * null = solved independently, so it leaves the review queue.
 */
export const REVIEW_INTERVAL_DAYS: Record<AttemptResult, number | null> = {
  solo: null,
  hint: 3,
  solution: 1,
};

/** The day a problem is due again after an attempt on `attemptDay`, or null if it is not reviewed. */
export function nextReviewDay(result: AttemptResult, attemptDay: DayKey): DayKey | null {
  const interval = REVIEW_INTERVAL_DAYS[result];
  return interval === null ? null : addDays(attemptDay, interval);
}

export type ReviewAttempt = Pick<Attempt, "problemId" | "attemptedAt" | "result">;

export type ReviewItem = {
  problemId: number;
  dueDay: DayKey;
  /** 0 when due today. */
  overdueDays: number;
  /** Which review the next attempt will be: 1 for the first review, 2 for the second, … */
  reviewNumber: number;
  lastResult: AttemptResult;
  lastAttemptDay: DayKey;
};

/**
 * Problems due for review on or before `today`, most overdue first.
 * Only each problem's latest attempt decides whether it is due; earlier attempts
 * only count towards reviewNumber.
 */
export function reviewQueue(
  attempts: readonly ReviewAttempt[],
  today: DayKey,
  settings: DaySettings,
): ReviewItem[] {
  const byProblem = new Map<number, ReviewAttempt[]>();
  for (const a of attempts) {
    const list = byProblem.get(a.problemId);
    if (list) list.push(a);
    else byProblem.set(a.problemId, [a]);
  }

  const items: ReviewItem[] = [];
  for (const [problemId, list] of byProblem) {
    list.sort((a, b) => a.attemptedAt.getTime() - b.attemptedAt.getTime());
    const last = list[list.length - 1];
    const lastAttemptDay = toDayKey(last.attemptedAt, settings);
    const dueDay = nextReviewDay(last.result, lastAttemptDay);
    if (dueDay === null || dueDay > today) continue;

    // Attempts since the problem first needed help are the reviews done so far.
    const firstMiss = list.findIndex((a) => a.result !== "solo");
    items.push({
      problemId,
      dueDay,
      overdueDays: diffDays(dueDay, today),
      reviewNumber: list.length - firstMiss,
      lastResult: last.result,
      lastAttemptDay,
    });
  }

  return items.sort((a, b) => a.dueDay.localeCompare(b.dueDay) || a.problemId - b.problemId);
}
