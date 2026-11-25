import { describe, expect, it } from "vitest";
import { nextReviewDay, reviewQueue, type ReviewAttempt } from "./review";

const settings = { timezone: "Asia/Shanghai", dayStartHour: 4 };
const today = "2026-11-24";

/** An attempt at 20:00 Shanghai time on `day`. */
function at(problemId: number, day: string, result: ReviewAttempt["result"]): ReviewAttempt {
  return { problemId, attemptedAt: new Date(`${day}T12:00:00Z`), result };
}

describe("nextReviewDay", () => {
  it("follows the intervals from the design doc", () => {
    expect(nextReviewDay("solo", today)).toBeNull();
    expect(nextReviewDay("hint", today)).toBe("2026-11-27");
    expect(nextReviewDay("solution", today)).toBe("2026-11-25");
  });
});

describe("reviewQueue", () => {
  it("is empty with no attempts", () => {
    expect(reviewQueue([], today, settings)).toEqual([]);
  });

  it("never queues problems solved independently", () => {
    expect(reviewQueue([at(1, "2026-11-01", "solo")], today, settings)).toEqual([]);
  });

  it("queues a problem once its review day arrives", () => {
    expect(reviewQueue([at(1, "2026-11-23", "solution")], today, settings)).toEqual([
      {
        problemId: 1,
        dueDay: "2026-11-24",
        overdueDays: 0,
        reviewNumber: 1,
        lastResult: "solution",
        lastAttemptDay: "2026-11-23",
      },
    ]);
  });

  it("does not queue a problem before its review day", () => {
    expect(reviewQueue([at(1, "2026-11-22", "hint")], today, settings)).toEqual([]);
    expect(reviewQueue([at(1, "2026-11-21", "hint")], today, settings)).toHaveLength(1);
  });

  it("uses the user's day, including day_start_hour", () => {
    // 02:00 Shanghai on 11-24 still belongs to 11-23, so a "solution" is due on 11-24.
    const lateNight = {
      problemId: 1,
      attemptedAt: new Date("2026-11-23T18:00:00Z"),
      result: "solution" as const,
    };
    expect(reviewQueue([lateNight], today, settings)[0]?.dueDay).toBe("2026-11-24");
  });

  it("lets only the latest attempt decide", () => {
    // Needed the solution, then solved it alone on review: done.
    const done = [at(1, "2026-11-10", "solution"), at(1, "2026-11-11", "solo")];
    expect(reviewQueue(done, today, settings)).toEqual([]);

    // Solved alone at first, later needed a hint: back in the queue.
    const relapsed = [at(2, "2026-11-01", "solo"), at(2, "2026-11-20", "hint")];
    expect(reviewQueue(relapsed, today, settings)).toMatchObject([
      { problemId: 2, dueDay: "2026-11-23", reviewNumber: 1 },
    ]);
  });

  it("does not depend on input order", () => {
    const attempts = [at(1, "2026-11-20", "hint"), at(1, "2026-11-10", "solution")];
    expect(reviewQueue(attempts, today, settings)).toMatchObject([
      { lastResult: "hint", reviewNumber: 2 },
    ]);
  });

  it("numbers reviews from the first attempt that needed help", () => {
    const attempts = [
      at(1, "2026-11-01", "solution"),
      at(1, "2026-11-02", "solution"),
      at(1, "2026-11-03", "hint"),
    ];
    expect(reviewQueue(attempts, today, settings)[0].reviewNumber).toBe(3);
  });

  it("sorts most overdue first", () => {
    const attempts = [
      at(3, "2026-11-23", "solution"), // due today
      at(1, "2026-11-10", "hint"), // due 11-13
      at(2, "2026-11-20", "solution"), // due 11-21
    ];
    expect(reviewQueue(attempts, today, settings).map((i) => [i.problemId, i.overdueDays])).toEqual(
      [
        [1, 11],
        [2, 3],
        [3, 0],
      ],
    );
  });
});
