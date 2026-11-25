import type { AttemptResult } from "@/contracts/attempts";
import type { Difficulty } from "@/contracts/problems";
import { dayOfWeek, diffDays, type DayKey } from "@/lib/day";

export const RESULT_LABEL: Record<AttemptResult, string> = {
  solo: "独立 AC",
  hint: "看了提示",
  solution: "看了题解",
};

export const RESULT_COLOR: Record<AttemptResult, string> = {
  solo: "text-brand",
  hint: "text-medium",
  solution: "text-hard",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/** "11月24日" */
export function formatDay(day: DayKey): string {
  const [, m, d] = day.split("-").map(Number);
  return `${m}月${d}日`;
}

/** "11月24日 · 周二" */
export function formatDayWithWeekday(day: DayKey): string {
  return `${formatDay(day)} · ${WEEKDAYS[dayOfWeek(day)]}`;
}

/** "今天" / "昨天" / "3 天前", relative to `today`. */
export function daysAgo(day: DayKey, today: DayKey): string {
  const n = diffDays(day, today);
  return n <= 0 ? "今天" : n === 1 ? "昨天" : `${n} 天前`;
}

/** "明天" / "3 天后". */
export function daysAhead(day: DayKey, today: DayKey): string {
  const n = diffDays(today, day);
  return n <= 0 ? "今天" : n === 1 ? "明天" : `${n} 天后`;
}

export function problemNumber(frontendId: number | null): string {
  return frontendId === null ? "—" : `#${frontendId}`;
}
