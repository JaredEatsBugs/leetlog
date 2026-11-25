import type { AttemptDto } from "@/contracts/attempts";
import { problemNumber, RESULT_COLOR, RESULT_LABEL } from "./format";
import { DifficultyBadge } from "./ui";

/** One attempt in a list: number, title, note, result and time spent. */
export function AttemptRow({
  attempt: a,
  showDifficulty = false,
}: {
  attempt: AttemptDto;
  showDifficulty?: boolean;
}) {
  return (
    <li className="flex items-center gap-3.5 border-b border-divider px-5 py-3.5 last:border-b-0">
      <span className="w-12 shrink-0 font-mono text-[13px] text-muted">
        {problemNumber(a.problem.frontendId)}
      </span>
      <div className="min-w-0 grow">
        <a
          href={a.problem.url}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-[15px] font-semibold hover:text-brand"
        >
          {a.problem.title}
        </a>
        {a.notes && <div className="mt-0.5 truncate text-xs text-muted">{a.notes}</div>}
      </div>
      {showDifficulty && <DifficultyBadge difficulty={a.problem.difficulty} />}
      <span className={`shrink-0 text-xs font-semibold ${RESULT_COLOR[a.result]}`}>
        {RESULT_LABEL[a.result]}
      </span>
      <span className="w-12 shrink-0 text-right font-mono text-xs text-muted">
        {a.durationMinutes ? `${a.durationMinutes}m` : "—"}
      </span>
    </li>
  );
}
