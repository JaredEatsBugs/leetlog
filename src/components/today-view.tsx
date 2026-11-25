"use client";

import type { ReactNode } from "react";
import useSWR from "swr";
import type { TodayResponse } from "@/contracts/today";
import { useLogAttempt } from "./app-shell";
import { AttemptRow } from "./attempt-row";
import { daysAgo, formatDayWithWeekday, problemNumber, RESULT_LABEL } from "./format";
import { Heatmap } from "./heatmap";
import { Card, CardHeader, DifficultyBadge, EmptyRow } from "./ui";

export function TodayView() {
  const { data, error } = useSWR<TodayResponse>("/api/today");
  const logAttempt = useLogAttempt();

  if (error) return <p className="text-sm text-hard">加载失败：{String(error.message ?? error)}</p>;
  if (!data) return <TodaySkeleton />;

  const remaining = Math.max(0, data.dailyGoal - data.solvedToday);
  const progress = Math.min(1, data.solvedToday / Math.max(1, data.dailyGoal));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[13px] font-medium text-muted">
            {formatDayWithWeekday(data.today)}
          </div>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight">
            {remaining > 0 ? `今天还差 ${remaining} 道就达成目标` : "今天的目标已经达成"}
          </h1>
        </div>
        <div className="text-[13px] text-muted">每日目标 {data.dailyGoal} 题</div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label={
            <>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C2410C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 .8 1.2 1.5 1.6 2 1.8C11 7.5 11 5 12 3z" />
              </svg>
              连续打卡
            </>
          }
          value={data.streak.current}
          unit="天"
          sub={`最长 ${data.streak.longest} 天`}
        />
        <Stat
          label="今日完成"
          value={
            <>
              {data.solvedToday}
              <span className="text-lg text-faint"> / {data.dailyGoal}</span>
            </>
          }
          sub={
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-track"
              role="progressbar"
              aria-label="今日目标进度"
              aria-valuenow={data.solvedToday}
              aria-valuemax={data.dailyGoal}
            >
              <div className="h-1.5 bg-brand" style={{ width: `${progress * 100}%` }} />
            </div>
          }
        />
        <Stat
          label="今日待复习"
          value={data.reviewQueue.length}
          unit="题"
          sub={`明天 ${data.reviewDueTomorrow} 题`}
        />
        <Stat
          label="本周"
          value={data.thisWeek.attempts}
          unit="题"
          sub={
            data.thisWeek.soloRate === null
              ? "本周还没有记录"
              : `独立 AC 率 ${Math.round(data.thisWeek.soloRate * 100)}%`
          }
        />
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <section className="flex min-w-0 grow-[999] basis-[560px] flex-col gap-6">
          <Card>
            <CardHeader title="待复习" aside="上次没独立做出的题，按间隔重新出现" />
            {data.reviewQueue.length === 0 ? (
              <EmptyRow>没有到期的复习题</EmptyRow>
            ) : (
              <ul>
                {data.reviewQueue.map((r) => (
                  <li
                    key={r.problem.id}
                    className="flex items-center gap-3.5 border-b border-divider px-5 py-3.5 last:border-b-0"
                  >
                    <span className="w-12 shrink-0 font-mono text-[13px] text-muted">
                      {problemNumber(r.problem.frontendId)}
                    </span>
                    <div className="min-w-0 grow">
                      <a
                        href={r.problem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-[15px] font-semibold hover:text-brand"
                      >
                        {r.problem.title}
                      </a>
                      <div className="mt-0.5 text-xs text-muted">
                        第 {r.reviewNumber} 次复习 · 上次{RESULT_LABEL[r.lastResult]} ·{" "}
                        {daysAgo(r.lastAttemptDay, data.today)}
                        {r.overdueDays > 0 && ` · 逾期 ${r.overdueDays} 天`}
                      </div>
                    </div>
                    <DifficultyBadge difficulty={r.problem.difficulty} />
                    <button
                      type="button"
                      onClick={() => logAttempt(r.problem)}
                      className="h-[34px] shrink-0 cursor-pointer rounded-lg border border-control bg-card px-3.5 text-[13px] font-medium hover:bg-page"
                    >
                      重做
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="今天做过的" />
            {data.todayAttempts.length === 0 ? (
              <EmptyRow>今天还没有记录。按 N 记一道题。</EmptyRow>
            ) : (
              <ul>
                {data.todayAttempts.map((a) => (
                  <AttemptRow key={a.id} attempt={a} />
                ))}
              </ul>
            )}
          </Card>
        </section>

        <aside className="flex min-w-0 grow basis-[340px] flex-col gap-6">
          <Card className="px-5 py-[18px]">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold">打卡热力图</h2>
              <span className="text-xs text-muted">
                近 {data.heatmap.length} 周 ·{" "}
                {data.heatmap.flat().reduce((n, c) => n + (c?.count ?? 0), 0)} 题
              </span>
            </div>
            <Heatmap weeks={data.heatmap} />
          </Card>
        </aside>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  unit,
  sub,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
}) {
  return (
    <Card className="px-5 py-[18px]">
      <div className="flex items-center gap-1.5 text-[13px] font-medium text-muted">{label}</div>
      <div className="mt-2 font-mono text-[30px] font-semibold leading-tight">
        {value}
        {unit && <span className="ml-1 font-sans text-sm font-medium text-muted">{unit}</span>}
      </div>
      {typeof sub === "string" ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : sub}
    </Card>
  );
}

function TodaySkeleton() {
  return (
    <div aria-busy="true" aria-label="加载中" className="flex animate-pulse flex-col gap-6">
      <div className="h-16 w-80 rounded-lg bg-border/60" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[118px] rounded-xl bg-border/60" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-border/60" />
    </div>
  );
}
