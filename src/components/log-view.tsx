"use client";

import useSWRInfinite from "swr/infinite";
import type { AttemptDto, ListAttemptsResponse } from "@/contracts/attempts";
import { AttemptRow } from "./attempt-row";
import { formatDayWithWeekday } from "./format";
import { Button, Card, EmptyRow } from "./ui";

const PAGE_SIZE = 50;

function pageKey(index: number, previous: ListAttemptsResponse | null) {
  if (previous && !previous.nextCursor) return null; // reached the end
  const cursor = previous?.nextCursor ? `&cursor=${encodeURIComponent(previous.nextCursor)}` : "";
  return `/api/attempts?limit=${PAGE_SIZE}${cursor}`;
}

export function LogView() {
  const { data, error, size, setSize, isValidating } =
    useSWRInfinite<ListAttemptsResponse>(pageKey);

  const attempts = data?.flatMap((p) => p.attempts) ?? [];
  const hasMore = !!data?.at(-1)?.nextCursor;
  const loadingMore = isValidating && size > (data?.length ?? 0);

  // Group consecutive attempts by the user's day (the list is newest first).
  const days: { day: string; attempts: AttemptDto[] }[] = [];
  for (const a of attempts) {
    const last = days.at(-1);
    if (last?.day === a.day) last.attempts.push(a);
    else days.push({ day: a.day, attempts: [a] });
  }

  return (
    <>
      <div>
        <h1 className="text-[28px] font-bold tracking-tight">记录</h1>
        <p className="mt-1 text-[13px] text-muted">每一次做题，按时间倒序</p>
      </div>

      {error ? (
        <p className="text-sm text-hard">加载失败：{String(error.message ?? error)}</p>
      ) : !data ? (
        <div
          aria-busy="true"
          aria-label="加载中"
          className="h-64 animate-pulse rounded-xl bg-border/60"
        />
      ) : days.length === 0 ? (
        <Card>
          <EmptyRow>还没有记录。按 N 记第一道题。</EmptyRow>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {days.map(({ day, attempts }) => (
            <Card key={day}>
              <div className="flex items-baseline justify-between border-b border-divider px-5 py-3">
                <h2 className="text-sm font-semibold">{formatDayWithWeekday(day)}</h2>
                <span className="text-xs text-muted">{attempts.length} 题</span>
              </div>
              <ul>
                {attempts.map((a) => (
                  <AttemptRow key={a.id} attempt={a} showDifficulty />
                ))}
              </ul>
            </Card>
          ))}
          {hasMore && (
            <Button
              className="self-center"
              disabled={loadingMore}
              onClick={() => setSize(size + 1)}
            >
              {loadingMore ? "加载中…" : "加载更多"}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
