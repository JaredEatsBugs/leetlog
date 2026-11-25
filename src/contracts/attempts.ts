import { z } from "zod";
import { newProblem, problemDto } from "./problems";

export const attemptResult = z.enum(["solo", "hint", "solution"]);
export type AttemptResult = z.infer<typeof attemptResult>;

/** A calendar day in the user's own day (time zone + day start hour), "YYYY-MM-DD". */
export const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const attemptDto = z.object({
  id: z.string(),
  problem: problemDto,
  /** ISO 8601, UTC. */
  attemptedAt: z.string(),
  /** The user's day this attempt counts for. */
  day: dayKey,
  result: attemptResult,
  durationMinutes: z.number().int().nullable(),
  notes: z.string().nullable(),
  /** When this problem comes back for review because of this attempt; null if it does not. */
  nextReviewDay: dayKey.nullable(),
});
export type AttemptDto = z.infer<typeof attemptDto>;

const attemptFields = z.object({
  result: attemptResult,
  /** Defaults to now. Set it to log an attempt after the fact. */
  attemptedAt: z.iso
    .datetime({ offset: true })
    // Allow a few minutes of clock skew between client and server.
    .refine((s) => Date.parse(s) <= Date.now() + 5 * 60_000, "attemptedAt is in the future")
    .optional(),
  durationMinutes: z.number().int().min(1).max(1440).nullish(),
  notes: z.string().max(10_000).nullish(),
});

/**
 * POST /api/attempts. Identify the problem either by catalog id or by describing it
 * (the extension reads title and difficulty from the LeetCode page).
 */
export const createAttemptRequest = z.union([
  attemptFields.extend({ problemId: z.number().int().positive() }),
  attemptFields.extend({ problem: newProblem }),
]);
export type CreateAttemptRequest = z.input<typeof createAttemptRequest>;

export const createAttemptResponse = z.object({ attempt: attemptDto });
export type CreateAttemptResponse = z.infer<typeof createAttemptResponse>;

/** GET /api/attempts — newest first. */
export const listAttemptsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  /** nextCursor from the previous page. */
  cursor: z.string().optional(),
  problemId: z.coerce.number().int().positive().optional(),
});

export const listAttemptsResponse = z.object({
  attempts: z.array(attemptDto),
  /** Pass as `cursor` to get the next page; null on the last page. */
  nextCursor: z.string().nullable(),
});
export type ListAttemptsResponse = z.infer<typeof listAttemptsResponse>;
