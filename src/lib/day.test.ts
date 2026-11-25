import { describe, expect, it } from "vitest";
import { addDays, dayOfWeek, diffDays, toDayKey } from "./day";

const la = { timezone: "America/Los_Angeles", dayStartHour: 4 };
const shanghai = { timezone: "Asia/Shanghai", dayStartHour: 4 };

describe("toDayKey", () => {
  it("uses the user's time zone, not UTC", () => {
    // 2026-03-02 02:00 UTC is 2026-03-01 18:00 in Los Angeles.
    expect(toDayKey(new Date("2026-03-02T02:00:00Z"), la)).toBe("2026-03-01");
    // …and 2026-03-02 10:00 in Shanghai.
    expect(toDayKey(new Date("2026-03-02T02:00:00Z"), shanghai)).toBe("2026-03-02");
  });

  it("counts solves before day_start_hour for the previous day", () => {
    // 03:59 and 04:00 Shanghai time (UTC+8).
    expect(toDayKey(new Date("2026-03-01T19:59:00Z"), shanghai)).toBe("2026-03-01");
    expect(toDayKey(new Date("2026-03-01T20:00:00Z"), shanghai)).toBe("2026-03-02");
  });

  it("treats day_start_hour 0 as plain midnight", () => {
    const midnight = { timezone: "Asia/Shanghai", dayStartHour: 0 };
    expect(toDayKey(new Date("2026-03-01T16:00:00Z"), midnight)).toBe("2026-03-02");
    expect(toDayKey(new Date("2026-03-01T15:59:00Z"), midnight)).toBe("2026-03-01");
  });

  it("rolls back across month and year boundaries", () => {
    // 2027-01-01 02:00 in Shanghai is still 2026-12-31 for the user.
    expect(toDayKey(new Date("2026-12-31T18:00:00Z"), shanghai)).toBe("2026-12-31");
  });

  it("is correct on DST transition days", () => {
    // LA springs forward on 2026-03-08 at 02:00 (PST -8 → PDT -7).
    // 03:30 PDT = 10:30 UTC: still before 04:00, so it belongs to 2026-03-07.
    expect(toDayKey(new Date("2026-03-08T10:30:00Z"), la)).toBe("2026-03-07");
    // 04:00 PDT = 11:00 UTC: the new day.
    expect(toDayKey(new Date("2026-03-08T11:00:00Z"), la)).toBe("2026-03-08");
    // LA falls back on 2026-11-01 at 02:00 (PDT -7 → PST -8).
    // 03:30 PST = 11:30 UTC: still the previous day.
    expect(toDayKey(new Date("2026-11-01T11:30:00Z"), la)).toBe("2026-10-31");
    expect(toDayKey(new Date("2026-11-01T12:00:00Z"), la)).toBe("2026-11-01");
  });
});

describe("day arithmetic", () => {
  it("adds days across months, years and leap days", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("diffs days", () => {
    expect(diffDays("2026-03-01", "2026-03-04")).toBe(3);
    expect(diffDays("2026-03-04", "2026-03-01")).toBe(-3);
    expect(diffDays("2026-12-31", "2027-01-01")).toBe(1);
  });

  it("gets the day of week", () => {
    expect(dayOfWeek("2026-11-22")).toBe(0); // Sunday
    expect(dayOfWeek("2026-11-24")).toBe(2); // Tuesday
  });
});
