import { asc, eq, ilike, or } from "drizzle-orm";
import type { z } from "zod";
import type { newProblem } from "@/contracts/problems";
import { db } from "@/db";
import { problems, type Problem } from "@/db/schema";
import { parseProblemQuery } from "@/lib/leetcode";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function searchProblems(q: string, limit = 20): Promise<Problem[]> {
  const query = parseProblemQuery(q);
  switch (query.kind) {
    case "number":
      return db.select().from(problems).where(eq(problems.frontendId, query.frontendId));
    case "slug":
      return db.select().from(problems).where(eq(problems.slug, query.slug));
    case "text": {
      const pattern = `%${query.text.replace(/[\\%_]/g, "\\$&")}%`;
      return db
        .select()
        .from(problems)
        .where(or(ilike(problems.title, pattern), ilike(problems.slug, pattern)))
        .orderBy(asc(problems.frontendId))
        .limit(limit);
    }
  }
}

export async function getProblem(id: number, tx: Tx | typeof db = db): Promise<Problem | null> {
  const [p] = await tx.select().from(problems).where(eq(problems.id, id));
  return p ?? null;
}

/**
 * Find a problem by slug, adding it to the shared catalog if it is new.
 * An existing entry is never overwritten by what a client sends.
 * Returns null if the slug is new but its frontendId already belongs to another problem.
 */
export async function findOrCreateProblem(
  input: z.output<typeof newProblem>,
  tx: Tx | typeof db = db,
): Promise<Problem | null> {
  await tx
    .insert(problems)
    .values({
      slug: input.slug,
      frontendId: input.frontendId ?? null,
      title: input.title,
      difficulty: input.difficulty,
      tags: input.tags,
    })
    .onConflictDoNothing();
  const [p] = await tx.select().from(problems).where(eq(problems.slug, input.slug));
  return p ?? null;
}
