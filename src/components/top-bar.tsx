"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MeResponse } from "@/contracts/me";
import { Logo } from "./logo";
import { Kbd } from "./ui";

const NAV = [
  { href: "/", label: "Today" },
  { href: "/log", label: "Log" },
];

export function TopBar({ me, onLogAttempt }: { me?: MeResponse; onLogAttempt: () => void }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3.5 sm:px-6">
        <Link href="/" aria-label="LeetLog 首页">
          <Logo />
        </Link>
        <nav className="flex grow gap-1" aria-label="主导航">
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3.5 py-2 text-sm ${
                  active
                    ? "bg-brand-soft font-semibold text-brand-strong"
                    : "font-medium text-[#4b5563] hover:bg-page"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <span
            className="cursor-default rounded-lg px-3.5 py-2 text-sm font-medium text-faint"
            title="v0.4 再做"
          >
            Stats
          </span>
        </nav>
        {me && (
          <>
            <button
              type="button"
              onClick={onLogAttempt}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-[9px] bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              记一道题
              <Kbd>N</Kbd>
            </button>
            <Avatar me={me} />
          </>
        )}
      </div>
    </header>
  );
}

function Avatar({ me }: { me: MeResponse }) {
  const face = me.image ? (
    // eslint-disable-next-line @next/next/no-img-element -- GitHub avatar, tiny and already sized
    <img src={me.image} alt="" className="size-9 rounded-full border border-border" />
  ) : (
    <span className="flex size-9 items-center justify-center rounded-full border border-border bg-border text-[13px] font-semibold text-[#374151]">
      {(me.name ?? "?").slice(0, 1).toUpperCase()}
    </span>
  );

  if (me.authMode === "local") {
    return <span title={`${me.name ?? ""}（本地单用户模式）`}>{face}</span>;
  }

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-full" aria-label="账户">
        {face}
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-border bg-card p-1 shadow-lg">
        <p className="truncate px-3 py-2 text-xs text-muted">{me.name}</p>
        <button
          type="button"
          onClick={() => signOut({ redirectTo: "/" })}
          className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm hover:bg-page"
        >
          退出登录
        </button>
      </div>
    </details>
  );
}
