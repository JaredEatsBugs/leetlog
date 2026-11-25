import { describe, expect, it } from "vitest";
import { computeStreak } from "./streak";

const today = "2026-11-24";

describe("computeStreak", () => {
  it("is zero with no activity", () => {
    expect(computeStreak([], today)).toEqual({ current: 0, longest: 0 });
  });

  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-11-22", "2026-11-23", "2026-11-24"], today)).toEqual({
      current: 3,
      longest: 3,
    });
  });

  it("keeps the streak alive when today has no activity yet", () => {
    expect(computeStreak(["2026-11-22", "2026-11-23"], today).current).toBe(2);
  });

  it("breaks the streak after a missed day", () => {
    expect(computeStreak(["2026-11-21", "2026-11-22"], today).current).toBe(0);
  });

  it("tracks the longest run separately from the current one", () => {
    const days = [
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-23",
      "2026-11-24",
    ];
    expect(computeStreak(days, today)).toEqual({ current: 2, longest: 4 });
  });

  it("ignores order and duplicates", () => {
    const days = ["2026-11-24", "2026-11-23", "2026-11-24", "2026-11-23"];
    expect(computeStreak(days, today)).toEqual({ current: 2, longest: 2 });
  });

  it("follows runs across month boundaries", () => {
    expect(computeStreak(["2026-10-31", "2026-11-01"], "2026-11-01").current).toBe(2);
  });

  it("ignores days after today", () => {
    // e.g. clock skew between client and server
    expect(computeStreak(["2026-11-24", "2026-11-25"], today).current).toBe(1);
  });
});
