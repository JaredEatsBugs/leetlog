import { describe, expect, it } from "vitest";
import { buildHeatmap, countByDay, heatLevel } from "./heatmap";

const settings = { timezone: "Asia/Shanghai", dayStartHour: 4 };

describe("countByDay", () => {
  it("groups attempts by the user's day", () => {
    const counts = countByDay(
      [
        { attemptedAt: new Date("2026-11-24T02:00:00Z") }, // 10:00 on 11-24
        { attemptedAt: new Date("2026-11-24T12:00:00Z") }, // 20:00 on 11-24
        { attemptedAt: new Date("2026-11-24T18:00:00Z") }, // 02:00 on 11-25, counts for 11-24
        { attemptedAt: new Date("2026-11-24T20:00:00Z") }, // 04:00 on 11-25
      ],
      settings,
    );
    expect(Object.fromEntries(counts)).toEqual({ "2026-11-24": 3, "2026-11-25": 1 });
  });
});

describe("heatLevel", () => {
  it("scales against the daily goal", () => {
    // goal 3
    expect([0, 1, 2, 3, 4, 10].map((c) => heatLevel(c, 3))).toEqual([0, 1, 2, 3, 4, 4]);
    // goal 1: any solve meets it
    expect([0, 1, 2].map((c) => heatLevel(c, 1))).toEqual([0, 3, 4]);
    // goal 6
    expect([1, 2, 3, 5, 6, 7].map((c) => heatLevel(c, 6))).toEqual([1, 1, 2, 2, 3, 4]);
  });

  it("does not break on a goal of 0", () => {
    expect(heatLevel(1, 0)).toBe(3);
  });
});

describe("buildHeatmap", () => {
  const today = "2026-11-24"; // a Tuesday

  it("ends with the week containing today and nulls out future days", () => {
    const grid = buildHeatmap({ counts: new Map(), today, dailyGoal: 3 });
    expect(grid).toHaveLength(20);
    expect(grid.every((week) => week.length === 7)).toBe(true);

    const last = grid[19];
    expect(last[0]?.day).toBe("2026-11-23"); // Monday
    expect(last[1]?.day).toBe(today);
    expect(last.slice(2)).toEqual([null, null, null, null, null]);
  });

  it("starts on a whole week", () => {
    const grid = buildHeatmap({ counts: new Map(), today, dailyGoal: 3 });
    expect(grid[0][0]?.day).toBe("2026-07-13"); // Monday, 19 weeks before 11-23
  });

  it("supports Sunday-first weeks", () => {
    const grid = buildHeatmap({
      counts: new Map(),
      today,
      dailyGoal: 3,
      weeks: 1,
      weekStartsOn: 0,
    });
    expect(grid[0].map((c) => c?.day ?? null)).toEqual([
      "2026-11-22",
      "2026-11-23",
      "2026-11-24",
      null,
      null,
      null,
      null,
    ]);
  });

  it("fills in counts and levels", () => {
    const counts = new Map([
      ["2026-11-23", 3],
      ["2026-11-24", 1],
      ["2026-01-01", 9], // outside the grid, ignored
    ]);
    const [week] = buildHeatmap({ counts, today, dailyGoal: 3, weeks: 1 });
    expect(week.slice(0, 2)).toEqual([
      { day: "2026-11-23", count: 3, level: 3 },
      { day: "2026-11-24", count: 1, level: 1 },
    ]);
  });

  it("works when today is the first day of the week", () => {
    const [week] = buildHeatmap({ counts: new Map(), today: "2026-11-23", dailyGoal: 3, weeks: 1 });
    expect(week[0]?.day).toBe("2026-11-23");
    expect(week.filter((c) => c === null)).toHaveLength(6);
  });
});
