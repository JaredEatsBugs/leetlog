import { z } from "zod";

export const difficulty = z.enum(["easy", "medium", "hard"]);
export type Difficulty = z.infer<typeof difficulty>;

export const problemDto = z.object({
  id: z.number().int(),
  slug: z.string(),
  /** The number shown on LeetCode. */
  frontendId: z.number().int().nullable(),
  title: z.string(),
  difficulty,
  tags: z.array(z.string()),
  url: z.string(),
});
export type ProblemDto = z.infer<typeof problemDto>;

/** A problem described by the client, added to the shared catalog if its slug is new. */
export const newProblem = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "expected a LeetCode slug like two-sum"),
  frontendId: z.number().int().positive().nullish(),
  title: z.string().trim().min(1).max(200),
  difficulty,
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
});
export type NewProblem = z.input<typeof newProblem>;

/** GET /api/problems?q= — q can be a problem number, a LeetCode URL, a slug or part of a title. */
export const searchProblemsQuery = z.object({
  q: z.string().trim().min(1).max(300),
});

export const searchProblemsResponse = z.object({
  problems: z.array(problemDto),
});
export type SearchProblemsResponse = z.infer<typeof searchProblemsResponse>;
