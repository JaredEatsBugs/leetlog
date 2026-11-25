import { describe, expect, it } from "vitest";
import type { ReviewAttempt } from "./review";
import { summarizeToday } from "./today";

const settings = { timezone: "Asia/Shanghai", dayStartHour: 4, dailyGoal: 3 };
// 03:00 on Wednesday 2026-11-25 in Shanghai: before the 04:00 day start, so still Tuesday the 24th.
const now = new Date("2026-11-24T19:00:00Z");

/** An attempt at `hh`:00 Shanghai time on `day`. */
function at(problemId: number, day: string, hh: number, result: ReviewAttempt["result"]) {
  const utc = new Date(`${day}T00:00:00Z`);
  utc.setUTCHours(hh - 8);
  return { problemId, attemptedAt: utc, result, tag: `${problemId}@${day}` };
}

describe("summarizeToday", () => {
  it("handles a brand-new user", () => {
    const s = summarizeToday([], now, settings);
    expect(s).toMatchObject({
      today: "2026-11-24",
      solvedToday: 0,
      streak: { current: 0, longest: 0 },
      reviewQueue: [],
      todayAttempts: [],
      thisWeek: { start: "2026-11-23", attempts: 0, soloRate: null },
    });
    expect(s.heatmap).toHaveLength(20);
  });

  it("puts it all together", () => {
    const attempts = [
      at(1, "2026-11-20", 10, "hint"), // Friday: due 11-23, never redone → in the queue
      at(2, "2026-11-23", 10, "solution"), // Monday: due today
      at(3, "2026-11-23", 22, "solo"),
      at(4, "2026-11-24", 9, "solo"),
      at(5, "2026-11-24", 20, "hint"),
      at(7, "2026-11-22", 10, "hint"), // due tomorrow (11-25)
      at(6, "2026-11-25", 2, "solo"), // 02:00 on the 25th still counts for the 24th
    ];
    const s = summarizeToday(attempts, now, settings);

    expect(s.solvedToday).toBe(3);
    expect(s.todayAttempts.map((a) => a.tag)).toEqual([
      "6@2026-11-25",
      "5@2026-11-24",
      "4@2026-11-24",
    ]);
    expect(s.streak).toEqual({ current: 3, longest: 3 }); // 22nd, 23rd, 24th
    expect(s.reviewQueue.map((r) => [r.problemId, r.overdueDays])).toEqual([
      [1, 1],
      [2, 0],
    ]);
    expect(s.reviewDueTomorrow).toBe(1);
    expect(s.thisWeek).toEqual({ start: "2026-11-23", attempts: 5, soloRate: 3 / 5 });

    const lastWeek = s.heatmap[19];
    expect(lastWeek[0]).toEqual({ day: "2026-11-23", count: 2, level: 2 });
    expect(lastWeek[1]).toEqual({ day: "2026-11-24", count: 3, level: 3 });
  });

  it("starts the week on Monday even when today is Sunday", () => {
    const sunday = new Date("2026-11-29T04:00:00Z"); // 12:00 Sunday in Shanghai
    expect(summarizeToday([], sunday, settings).thisWeek.start).toBe("2026-11-23");
  });
});
