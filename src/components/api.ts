"use client";

import { mutate } from "swr";
import type { CreateAttemptRequest, CreateAttemptResponse } from "@/contracts/attempts";

// The web UI talks to the same REST API as the Chrome extension will.

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: { error?: string; message?: string; issues?: { message: string }[] },
  ) {
    super(body.message ?? body.issues?.[0]?.message ?? body.error ?? `HTTP ${status}`);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

/** SWR fetcher: the key is the API path. */
export const fetcher = <T>(url: string) => request<T>(url);

export async function createAttempt(input: CreateAttemptRequest) {
  const res = await request<CreateAttemptResponse>("/api/attempts", {
    method: "POST",
    body: JSON.stringify(input),
  });
  // Today, the log and search results all change; refetch everything under /api/.
  await mutate((key) => typeof key === "string" && key.startsWith("/api/"));
  return res.attempt;
}
