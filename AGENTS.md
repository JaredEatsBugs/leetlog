<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project context: LeetLog

A personal LeetCode / interview-prep check-in tracker, also a portfolio project. **Read `docs/design-decisions.md` before starting work** — it has the product scope, data model, conventions, deployment plan, v0.1 build order and the UI spec. The owner writes in Chinese; reply in Chinese.

### Current status

- v0.1 step 0–1 done: deps installed, initial migration generated in `drizzle/` and applied to the local Docker Postgres (OrbStack), format / lint / typecheck / test pass.
- v0.1 step 2 done: `src/lib/` has `day.ts` (user-day keys: timezone + day_start_hour), `streak.ts`, `review.ts` (review queue from attempts) and `heatmap.ts`, all with tests.
- v0.1 step 3 done: Auth.js (`src/auth.ts`, GitHub, JWT sessions, OAuth tokens not stored) + `accounts` table. Route handlers get the user via `getCurrentUser()` in `src/server/current-user.ts` (local mode: auto-created user `local`). `GET /api/me`; shared API types live in `src/contracts/`. GitHub mode is verified only up to the redirect to GitHub (no real OAuth App yet).
- v0.1 step 4 done: `POST/GET /api/attempts` (keyset cursor pagination), `GET /api/today` (built by `summarizeToday()` in `src/lib/today.ts`), `GET /api/problems?q=` (number, URL, slug or title). Route handlers stay thin: Zod contracts in `src/contracts/`, DB access in `src/server/`, row → DTO mapping in `src/server/dto.ts`, error helpers in `src/server/http.ts`.
- The shared problem catalog starts empty; problems are added when a client posts an attempt with `problem: {slug, title, difficulty, …}`. Decided 2026-11-24: no import from LeetCode for now. The catalog fills up through use, so the log-attempt modal must let the user type title / difficulty / tags when search finds nothing (the extension will send them from the LeetCode page).
- Next: step 5 (minimal UI).
- `cacheComponents` is on: GET route handlers prerender at build unless they read request data, so per-user handlers must go through `getCurrentUser()` (it calls `connection()`).

### Conventions

- Store timestamps as UTC (`timestamptz`); compute "days" (today, streaks, heatmap) in the user's `timezone`, with `day_start_hour` as the day boundary.
- Expose features through route handlers (REST, Zod-validated, shared request/response types) because a Chrome extension will be a second client. Don't put business logic only in server actions.
- Business logic lives in pure functions under `src/lib/` with Vitest tests next to them (`*.test.ts`).
- DB access via Drizzle + postgres.js (`src/db`). Schema changes: edit `src/db/schema.ts`, then `pnpm db:generate` and commit the generated migration in `drizzle/`.
- Environment variables are validated in `src/env.ts`; add new ones there and to `.env.example`.
- `AUTH_MODE=local` must keep working (single-user mode, no login) for self-hosters.

### Commands

`pnpm dev` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm format` · `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:studio`
