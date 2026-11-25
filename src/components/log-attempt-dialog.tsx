"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import useSWR from "swr";
import type { AttemptResult, CreateAttemptRequest } from "@/contracts/attempts";
import type { Difficulty, ProblemDto, SearchProblemsResponse } from "@/contracts/problems";
import { toDayKey } from "@/lib/day";
import { parseProblemQuery, slugFromTitle, titleFromSlug } from "@/lib/leetcode";
import { nextReviewDay } from "@/lib/review";
import { createAttempt } from "./api";
import { useMe } from "./app-shell";
import { daysAhead, DIFFICULTY_LABEL, formatDay, problemNumber } from "./format";
import { Button, DifficultyBadge, Kbd } from "./ui";

const RESULTS: { id: AttemptResult; label: string; sub: string }[] = [
  { id: "solo", label: "独立 AC", sub: "不进复习队列" },
  { id: "hint", label: "看了提示", sub: "3 天后复习" },
  { id: "solution", label: "看了题解", sub: "1 天后复习" },
];

const INPUT =
  "w-full rounded-[9px] border border-control bg-card px-3 text-sm focus:outline-2 focus:-outline-offset-1 focus:outline-brand";

type Manual = {
  frontendId: string;
  slug: string;
  title: string;
  difficulty?: Difficulty;
  tags: string;
};

export function LogAttemptDialog({
  initialProblem,
  onClose,
}: {
  initialProblem?: ProblemDto;
  onClose: () => void;
}) {
  const me = useMe();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const queryRef = useRef<HTMLInputElement>(null);
  const ids = useId();

  const [query, setQuery] = useState(
    initialProblem ? `${problemNumber(initialProblem.frontendId)} ${initialProblem.title}` : "",
  );
  const [picked, setPicked] = useState<ProblemDto | null>(initialProblem ?? null);
  const [manualEdits, setManualEdits] = useState<Partial<Manual>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Open as a modal (focus trap, Esc, backdrop). No close() on cleanup: it fires a "close"
  // event, which would close the dialog again when dev-mode effects run twice. Unmounting
  // removes the element, which ends the modal state anyway.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // showModal() focuses the first focusable element (the close button); start in the input.
    queryRef.current?.focus();
  }, []);

  // Search the catalog as the user types (debounced).
  const debounced = useDebounced(query.trim(), 250);
  const { data: search, isLoading: searching } = useSWR<SearchProblemsResponse>(
    !picked && debounced ? `/api/problems?q=${encodeURIComponent(debounced)}` : null,
  );
  const parsed = debounced ? parseProblemQuery(debounced) : null;
  const matches = search?.problems ?? [];
  // A number, URL or slug that matches exactly one problem needs no extra click.
  const autoPick = !picked && parsed?.kind !== "text" && matches.length === 1 ? matches[0] : null;
  const problem = picked ?? autoPick;
  const notInCatalog = !problem && !!search && matches.length === 0 && debounced === query.trim();

  // Manual entry for problems not in the catalog yet, pre-filled from what was typed.
  const guess: Manual = {
    frontendId: parsed?.kind === "number" ? String(parsed.frontendId) : "",
    slug:
      parsed?.kind === "slug"
        ? parsed.slug
        : parsed?.kind === "text"
          ? slugFromTitle(parsed.text)
          : "",
    title:
      parsed?.kind === "slug"
        ? titleFromSlug(parsed.slug)
        : parsed?.kind === "text"
          ? parsed.text
          : "",
    tags: "",
  };
  const manual: Manual = { ...guess, ...manualEdits };
  const editManual = (patch: Partial<Manual>) => setManualEdits((m) => ({ ...m, ...patch }));

  const manualReady = !!manual.slug && !!manual.title.trim() && !!manual.difficulty;
  const canSave = !saving && !!result && (problem ? true : notInCatalog && manualReady);

  const today = toDayKey(new Date(), me);
  const reviewDay = result ? nextReviewDay(result, today) : null;

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!canSave || !result) return;
    setSaving(true);
    setError(null);

    const common = {
      result,
      durationMinutes: duration ? Number(duration) : null,
      notes: notes.trim() || null,
    };
    const body: CreateAttemptRequest = problem
      ? { ...common, problemId: problem.id }
      : {
          ...common,
          problem: {
            slug: manual.slug,
            frontendId: manual.frontendId ? Number(manual.frontendId) : null,
            title: manual.title.trim(),
            difficulty: manual.difficulty!,
            tags: manual.tags
              .split(/[,，]/)
              .map((t) => t.trim())
              .filter(Boolean),
          },
        };

    try {
      await createAttempt(body);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${ids}-title`}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          void submit();
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[560px] rounded-2xl bg-card p-0 text-ink shadow-[0_24px_60px_rgba(17,24,39,0.25)]"
    >
      <form onSubmit={submit} className="flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 id={`${ids}-title`} className="text-lg font-bold">
            记一道题
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-page"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-[18px] px-6 pb-2 pt-[18px]">
          {/* Problem */}
          <div>
            <label htmlFor={`${ids}-q`} className="mb-1.5 block text-[13px] font-semibold">
              题目
            </label>
            <input
              id={`${ids}-q`}
              ref={queryRef}
              autoComplete="off"
              value={query}
              placeholder="贴 LeetCode 链接，或输入题号 / 标题"
              onChange={(e) => {
                setQuery(e.target.value);
                setPicked(null);
                setManualEdits({});
              }}
              className={`${INPUT} h-[42px] font-mono text-[13px]`}
            />

            {problem ? (
              <PickedProblem problem={problem} />
            ) : notInCatalog ? (
              <ManualProblem ids={ids} manual={manual} onChange={editManual} />
            ) : matches.length > 0 ? (
              <ul className="mt-2 max-h-56 overflow-y-auto rounded-[9px] border border-border">
                {matches.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setPicked(p)}
                      className="flex w-full cursor-pointer items-center gap-2.5 border-b border-divider px-3 py-2.5 text-left last:border-b-0 hover:bg-page"
                    >
                      <span className="w-12 font-mono text-[13px] text-muted">
                        {problemNumber(p.frontendId)}
                      </span>
                      <span className="grow truncate text-sm font-medium">{p.title}</span>
                      <DifficultyBadge difficulty={p.difficulty} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted">
                {searching ? "搜索中…" : "贴链接或输入题号，自动识别"}
              </p>
            )}
          </div>

          {/* Result */}
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-semibold">结果</legend>
            <div className="grid grid-cols-3 gap-2">
              {RESULTS.map((r) => {
                const on = result === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setResult(r.id)}
                    className={`flex h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[10px] ${
                      on
                        ? "border-2 border-brand bg-brand-soft"
                        : "border border-control bg-card hover:bg-page"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${on ? "text-brand-strong" : "text-ink"}`}
                    >
                      {r.label}
                    </span>
                    <span className="text-[11px] text-muted">{r.sub}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Duration + notes */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="sm:w-[140px]">
              <label htmlFor={`${ids}-t`} className="mb-1.5 block text-[13px] font-semibold">
                用时（分钟）
              </label>
              <input
                id={`${ids}-t`}
                type="number"
                inputMode="numeric"
                min={1}
                max={1440}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={`${INPUT} h-[42px] font-mono`}
              />
            </div>
            <div className="grow">
              <label htmlFor={`${ids}-n`} className="mb-1.5 block text-[13px] font-semibold">
                笔记 <span className="font-normal text-muted">卡在哪、关键思路</span>
              </label>
              <textarea
                id={`${ids}-n`}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${INPUT} resize-none py-2.5`}
              />
            </div>
          </div>

          {/* When it comes back */}
          {result && (
            <div
              className={`flex items-center gap-2 rounded-[9px] px-3 py-2.5 text-[13px] ${
                reviewDay ? "bg-medium-soft text-warn-ink" : "bg-brand-soft text-brand-strong"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>
                {reviewDay
                  ? `将于 ${formatDay(reviewDay)}（${daysAhead(reviewDay, today)}）出现在「待复习」里`
                  : "独立做出，不加入复习队列"}
              </span>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-[9px] bg-hard-soft px-3 py-2.5 text-[13px] text-hard"
            >
              保存失败：{error}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-divider px-6 pb-5 pt-4">
          <Button type="button" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" variant="primary" disabled={!canSave}>
            {saving ? "保存中…" : "保存"}
            <Kbd>⌘↵</Kbd>
          </Button>
        </div>
      </form>
    </dialog>
  );
}

function PickedProblem({ problem }: { problem: ProblemDto }) {
  return (
    <>
      <div className="mt-2 flex items-center gap-2.5 rounded-[9px] bg-page px-3 py-2.5">
        <span className="font-mono text-[13px] text-muted">
          {problemNumber(problem.frontendId)}
        </span>
        <a
          href={problem.url}
          target="_blank"
          rel="noreferrer"
          className="grow truncate text-sm font-semibold hover:text-brand"
        >
          {problem.title}
        </a>
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>
      {problem.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {problem.tags.map((t) => (
            <span
              key={t}
              className="rounded-md border border-border px-2 py-0.5 text-xs text-[#374151]"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function ManualProblem({
  ids,
  manual,
  onChange,
}: {
  ids: string;
  manual: Manual;
  onChange: (patch: Partial<Manual>) => void;
}) {
  const small = `${INPUT} h-9`;
  return (
    <div className="mt-2 flex flex-col gap-3 rounded-[9px] bg-page p-3">
      <p className="text-xs text-muted">题库里还没有这道题，补一下信息。贴链接能自动填好 slug。</p>
      <div className="grid grid-cols-[88px_1fr] gap-2">
        <div>
          <label htmlFor={`${ids}-fid`} className="mb-1 block text-xs font-semibold">
            题号
          </label>
          <input
            id={`${ids}-fid`}
            inputMode="numeric"
            value={manual.frontendId}
            onChange={(e) => onChange({ frontendId: e.target.value.replace(/\D/g, "") })}
            className={`${small} font-mono`}
          />
        </div>
        <div>
          <label htmlFor={`${ids}-title`} className="mb-1 block text-xs font-semibold">
            标题
          </label>
          <input
            id={`${ids}-title`}
            value={manual.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className={small}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${ids}-slug`} className="mb-1 block text-xs font-semibold">
          slug{" "}
          <span className="font-normal text-muted">
            leetcode.com/problems/<b>这一段</b>/
          </span>
        </label>
        <input
          id={`${ids}-slug`}
          value={manual.slug}
          onChange={(e) => onChange({ slug: e.target.value.trim().toLowerCase() })}
          className={`${small} font-mono text-[13px]`}
        />
      </div>
      <fieldset>
        <legend className="mb-1 text-xs font-semibold">难度</legend>
        <div className="flex gap-2">
          {(["easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={manual.difficulty === d}
              onClick={() => onChange({ difficulty: d })}
              className={`h-8 cursor-pointer rounded-lg px-3 text-xs font-semibold ${
                manual.difficulty === d
                  ? `border-2 ${d === "easy" ? "border-easy bg-easy-soft text-easy" : d === "medium" ? "border-medium bg-medium-soft text-medium" : "border-hard bg-hard-soft text-hard"}`
                  : "border border-control bg-card text-ink"
              }`}
            >
              {DIFFICULTY_LABEL[d]}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor={`${ids}-tags`} className="mb-1 block text-xs font-semibold">
          Tags <span className="font-normal text-muted">逗号分隔，可留空</span>
        </label>
        <input
          id={`${ids}-tags`}
          value={manual.tags}
          placeholder="Array, Hash Table"
          onChange={(e) => onChange({ tags: e.target.value })}
          className={small}
        />
      </div>
    </div>
  );
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
