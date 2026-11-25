import { and, desc, eq, sql } from "drizzle-orm";
import type { z } from "zod";
import type { createAttemptRequest } from "@/contracts/attempts";
import { db } from "@/db";
import { attempts, problems, type Attempt, type Problem } from "@/db/schema";
import type { AttemptCursor } from "@/lib/cursor";
import { findOrCreateProblem, getProblem } from "./problems";

export type AttemptWithProblem = { attempt: Attempt; problem: Problem };

export type CreateAttemptOutcome =
  | { ok: true; value: AttemptWithProblem }
  | { ok: false; error: "problem_not_found" | "problem_conflict" };

export async function createAttempt(
  userId: string,
  input: z.output<typeof createAttemptRequest>,
): Promise<CreateAttemptOutcome> {
  return db.transaction(async (tx) => {
    const problem =
      "problemId" in input
        ? await getProblem(input.problemId, tx)
        : await findOrCreateProblem(input.problem, tx);
    if (!problem) {
      return { ok: false, error: "problemId" in input ? "problem_not_found" : "problem_conflict" };
    }

    const [attempt] = await tx
      .insert(attempts)
      .values({
        userId,
        problemId: problem.id,
        // Always set from JS (millisecond precision) so list cursors compare exactly.
        attemptedAt: input.attemptedAt ? new Date(input.attemptedAt) : new Date(),
        result: input.result,
        durationMinutes: input.durationMinutes ?? null,
        notes: input.notes?.trim() || null,
      })
      .returning();
    return { ok: true, value: { attempt, problem } };
  });
}

/** Newest first, `limit` rows after `cursor`. */
export async function listAttempts(
  userId: string,
  opts: { limit: number; cursor?: AttemptCursor; problemId?: number },
): Promise<AttemptWithProblem[]> {
  return db
    .select({ attempt: attempts, problem: problems })
    .from(attempts)
    .innerJoin(problems, eq(problems.id, attempts.problemId))
    .where(
      and(
        eq(attempts.userId, userId),
        opts.problemId === undefined ? undefined : eq(attempts.problemId, opts.problemId),
        // Raw sql params bypass Drizzle's column mapping, so pass the time as an ISO string.
        opts.cursor &&
          sql`(${attempts.attemptedAt}, ${attempts.id}) < (${opts.cursor.attemptedAt.toISOString()}::timestamptz, ${opts.cursor.id}::uuid)`,
      ),
    )
    .orderBy(desc(attempts.attemptedAt), desc(attempts.id))
    .limit(opts.limit);
}

/** All of a user's attempts. Fine at personal scale (thousands of rows). */
export async function allAttempts(userId: string): Promise<AttemptWithProblem[]> {
  return db
    .select({ attempt: attempts, problem: problems })
    .from(attempts)
    .innerJoin(problems, eq(problems.id, attempts.problemId))
    .where(eq(attempts.userId, userId));
}
