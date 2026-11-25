// A "day key" is a calendar date in the user's own day, formatted "YYYY-MM-DD".
// Every per-day feature (today, streaks, heatmap, review due dates) works on day keys,
// so the time zone and day_start_hour are applied in exactly one place: toDayKey().

export type DayKey = string;

export type DaySettings = {
  /** IANA time zone, e.g. "America/Los_Angeles". */
  timezone: string;
  /** Hour (0-23) at which a new day starts. With 4, a solve at 01:30 counts for the previous day. */
  dayStartHour: number;
};

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timezone: string): Intl.DateTimeFormat {
  let f = formatters.get(timezone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    });
    formatters.set(timezone, f);
  }
  return f;
}

/** The user's day that `instant` belongs to. */
export function toDayKey(instant: Date, { timezone, dayStartHour }: DaySettings): DayKey {
  const parts = formatterFor(timezone).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)!.value);

  // Use the local wall-clock hour rather than subtracting hours from the instant,
  // so DST transitions cannot move a solve to the wrong day.
  const key = formatKey(get("year"), get("month"), get("day"));
  return get("hour") < dayStartHour ? addDays(key, -1) : key;
}

export function addDays(key: DayKey, days: number): DayKey {
  const d = parseKey(key);
  d.setUTCDate(d.getUTCDate() + days);
  return formatKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(from: DayKey, to: DayKey): number {
  return Math.round((parseKey(to).getTime() - parseKey(from).getTime()) / 86_400_000);
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(key: DayKey): number {
  return parseKey(key).getUTCDay();
}

function parseKey(key: DayKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatKey(y: number, m: number, d: number): DayKey {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
