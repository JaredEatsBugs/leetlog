import { z } from "zod";
import { attemptDto, attemptResult, dayKey } from "./attempts";
import { problemDto } from "./problems";

export const reviewItemDto = z.object({
  problem: problemDto,
  dueDay: dayKey,
  overdueDays: z.number().int(),
  /** Which review the next attempt will be (1 = first review). */
  reviewNumber: z.number().int(),
  lastResult: attemptResult,
  lastAttemptDay: dayKey,
});
export type ReviewItemDto = z.infer<typeof reviewItemDto>;

export const heatmapCellDto = z.object({
  day: dayKey,
  count: z.number().int(),
  level: z.number().int().min(0).max(4),
});

/** GET /api/today — everything the Today page needs. */
export const todayResponse = z.object({
  today: dayKey,
  dailyGoal: z.number().int(),
  solvedToday: z.number().int(),
  streak: z.object({ current: z.number().int(), longest: z.number().int() }),
  /** Most overdue first. */
  reviewQueue: z.array(reviewItemDto),
  /** Newest first. */
  todayAttempts: z.array(attemptDto),
  /** Monday through today. */
  thisWeek: z.object({
    start: dayKey,
    attempts: z.number().int(),
    /** Share of this week's attempts solved independently, 0–1; null with no attempts. */
    soloRate: z.number().nullable(),
  }),
  /** Week columns, oldest first, Monday-first; days after today are null. */
  heatmap: z.array(z.array(heatmapCellDto.nullable())),
});
export type TodayResponse = z.infer<typeof todayResponse>;
