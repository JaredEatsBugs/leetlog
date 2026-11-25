import type { TodayResponse } from "@/contracts/today";
import { formatDay } from "./format";

const LEVEL_BG = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"];

export function Heatmap({ weeks }: { weeks: TodayResponse["heatmap"] }) {
  return (
    <>
      <div className="mt-3.5 overflow-x-auto">
        <div
          role="img"
          aria-label="每天做题数的热力图，颜色越深做得越多"
          className="grid w-max grid-flow-col grid-rows-[repeat(7,12px)] gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${weeks.length}, 12px)` }}
        >
          {weeks.flatMap((week, w) =>
            week.map((cell, d) =>
              cell ? (
                <div
                  key={cell.day}
                  title={`${formatDay(cell.day)}：${cell.count} 题`}
                  className={`size-3 rounded-[3px] ${LEVEL_BG[cell.level]}`}
                />
              ) : (
                <div key={`empty-${w}-${d}`} className="size-3" />
              ),
            ),
          )}
        </div>
      </div>
      <div
        className="mt-2.5 flex items-center justify-end gap-1 text-[11px] text-muted"
        aria-hidden="true"
      >
        少
        {LEVEL_BG.map((bg) => (
          <div key={bg} className={`size-2.5 rounded-[2px] ${bg}`} />
        ))}
        多
      </div>
    </>
  );
}
