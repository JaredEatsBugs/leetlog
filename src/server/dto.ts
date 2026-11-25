import type { AttemptDto } from "@/contracts/attempts";
import type { ProblemDto } from "@/contracts/problems";
import type { Attempt, Problem } from "@/db/schema";
import { toDayKey, type DaySettings } from "@/lib/day";
import { problemUrl } from "@/lib/leetcode";
import { nextReviewDay } from "@/lib/review";

// Database rows → API shapes. Keep these the only place that knows both.

export function toProblemDto(p: Problem): ProblemDto {
  return {
    id: p.id,
    slug: p.slug,
    frontendId: p.frontendId,
    title: p.title,
    difficulty: p.difficulty,
    tags: p.tags,
    url: problemUrl(p.slug),
  };
}

export function toAttemptDto(a: Attempt, p: Problem, settings: DaySettings): AttemptDto {
  const day = toDayKey(a.attemptedAt, settings);
  return {
    id: a.id,
    problem: toProblemDto(p),
    attemptedAt: a.attemptedAt.toISOString(),
    day,
    result: a.result,
    durationMinutes: a.durationMinutes,
    notes: a.notes,
    nextReviewDay: nextReviewDay(a.result, day),
  };
}
