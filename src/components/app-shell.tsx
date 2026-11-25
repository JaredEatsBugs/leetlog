"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import useSWR, { SWRConfig } from "swr";
import type { MeResponse } from "@/contracts/me";
import type { ProblemDto } from "@/contracts/problems";
import { ApiError, fetcher } from "./api";
import { LogAttemptDialog } from "./log-attempt-dialog";
import { SignIn } from "./sign-in";
import { TopBar } from "./top-bar";

const MeContext = createContext<MeResponse | null>(null);
const LogAttemptContext = createContext<(problem?: ProblemDto) => void>(() => {});

/** The signed-in user. Only for components <AppShell> renders once /api/me has answered (the dialog). */
export function useMe(): MeResponse {
  const me = useContext(MeContext);
  if (!me) throw new Error("useMe() outside <AppShell>");
  return me;
}

/** Opens the "记一道题" dialog, optionally for a known problem (e.g. "重做" in the review list). */
export function useLogAttempt() {
  return useContext(LogAttemptContext);
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: true }}>
      <Shell>{children}</Shell>
    </SWRConfig>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { data: me, error } = useSWR<MeResponse, unknown>("/api/me");
  const [dialog, setDialog] = useState<{ open: boolean; problem?: ProblemDto; key: number }>({
    open: false,
    key: 0,
  });

  const openDialog = useCallback(
    (problem?: ProblemDto) => setDialog((d) => ({ open: true, problem, key: d.key + 1 })),
    [],
  );

  // "N" opens the dialog from anywhere, unless the user is typing.
  useEffect(() => {
    if (!me) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable], dialog")) return;
      e.preventDefault();
      openDialog();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [me, openDialog]);

  if (error instanceof ApiError && error.status === 401) return <SignIn />;
  if (error) {
    return (
      <p className="p-8 text-center text-sm text-hard">
        加载失败：{error instanceof Error ? error.message : String(error)}
      </p>
    );
  }

  return (
    <MeContext.Provider value={me ?? null}>
      <LogAttemptContext.Provider value={openDialog}>
        <TopBar me={me} onLogAttempt={() => openDialog()} />
        {/* Always render the page, even before /api/me answers: pages show their own
            skeletons, and Next.js needs the segment in the prerendered shell to validate
            instant navigation. */}
        <main className="mx-auto flex max-w-[1160px] flex-col gap-6 px-4 pb-12 pt-8 sm:px-6">
          {children}
        </main>
        {me && dialog.open && (
          <LogAttemptDialog
            key={dialog.key}
            initialProblem={dialog.problem}
            onClose={() => setDialog((d) => ({ ...d, open: false }))}
          />
        )}
      </LogAttemptContext.Provider>
    </MeContext.Provider>
  );
}
