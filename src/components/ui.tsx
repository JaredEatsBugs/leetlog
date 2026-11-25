import type { ComponentProps, ReactNode } from "react";
import type { Difficulty } from "@/contracts/problems";
import { DIFFICULTY_LABEL } from "./format";

// Small shared building blocks. Plain Tailwind for now; swap for shadcn/ui when it pays off.

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-xl border border-border bg-card ${className}`} {...props} />;
}

export function CardHeader({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-divider px-5 py-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {aside && <span className="text-xs text-muted">{aside}</span>}
    </div>
  );
}

const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  easy: "text-easy bg-easy-soft",
  medium: "text-medium bg-medium-soft",
  hard: "text-hard bg-hard-soft",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIFFICULTY_CLASS[difficulty]}`}
    >
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-[5px] bg-white/20 px-1.5 py-0.5 font-mono text-[11px] font-medium">
      {children}
    </kbd>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-muted">{children}</p>;
}

const BUTTON = {
  primary: "bg-brand text-white hover:bg-brand-strong font-semibold",
  secondary: "border border-control bg-card text-ink hover:bg-page font-medium",
};

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof BUTTON }) {
  return (
    <button
      className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[9px] px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON[variant]} ${className}`}
      {...props}
    />
  );
}
