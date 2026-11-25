import {
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ---------- users ----------
// Column names id / name / email / emailVerified / image match what the
// Auth.js Drizzle adapter expects, so GitHub login can plug in later.
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
  image: text("image"),
  // IANA time zone, e.g. "America/Los_Angeles". All "which day is it" logic uses this.
  timezone: text("timezone").notNull().default("UTC"),
  // Hour (0-23) at which a new day starts for streaks. 4 means a 1am solve counts for the previous day.
  dayStartHour: smallint("day_start_hour").notNull().default(4),
  dailyGoal: smallint("daily_goal").notNull().default(3),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- problems ----------
// Shared catalog of LeetCode problems (not per user).
export const difficulty = pgEnum("difficulty", ["easy", "medium", "hard"]);

export const problems = pgTable("problems", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  // LeetCode's title slug, e.g. "two-sum". URL = https://leetcode.com/problems/<slug>/
  slug: text("slug").notNull().unique(),
  // The number shown on LeetCode, e.g. 1 for Two Sum.
  frontendId: integer("frontend_id").unique(),
  title: text("title").notNull(),
  difficulty: difficulty("difficulty").notNull(),
  tags: text("tags").array().notNull().default([]),
});

// ---------- attempts ----------
// One row each time the user works on a problem.
export const attemptResult = pgEnum("attempt_result", [
  "solo", // solved independently
  "hint", // needed a hint
  "solution", // read the solution
]);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemId: integer("problem_id")
      .notNull()
      .references(() => problems.id),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
    result: attemptResult("result").notNull(),
    durationMinutes: smallint("duration_minutes"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("attempts_user_time_idx").on(t.userId, t.attemptedAt),
    index("attempts_user_problem_idx").on(t.userId, t.problemId),
  ],
);

export type User = typeof users.$inferSelect;
export type Problem = typeof problems.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type NewAttempt = typeof attempts.$inferInsert;
