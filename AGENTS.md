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
- v0.1 step 5 (first pass) done: Today page, Log page and the "记一道题" dialog (N to open, ⌘↵ to save), styled after the mockup with Tailwind tokens in `src/app/globals.css`. Pages are client components that read the REST API through SWR (`src/components/`), the same API the extension will use; `AppShell` handles sign-in (github mode) and the dialog. Not done yet: Problem detail page, settings (daily goal, time zone), weak topics card, shadcn/ui.
- `cacheComponents` is on: GET route handlers prerender at build unless they read request data, so per-user handlers must go through `getCurrentUser()` (it calls `connection()`).
- Code is on GitHub (public): https://github.com/JaredEatsBugs/leetlog. CI (`.github/workflows/ci.yml`) passes on `main`.

### Decisions made (don't revisit without asking)

- Review intervals are fixed: hint → +3 days, solution → +1 day, solo → leaves the queue. They do not grow with each review (2026-11-24).
- No import of the LeetCode catalog for now; it fills up through use (2026-11-24).
- The CI annotation "Node.js 20 is deprecated" (actions/checkout, setup-node, pnpm/action-setup @v4) is left as is for now; the owner chose not to upgrade yet (2026-11-25).
- Where the mockup differs from these rules, the rules win (e.g. the mockup's "solo → spot-check after 7 days" is not used; the weak-topics card waits for v0.4).

### Next up

- The owner will pick one of: **settings page** (daily goal, time zone, day start hour; needs `PATCH /api/me`) or **Problem detail page** (attempt history for one problem; needs `GET /api/problems/:id`).
- Known gap: users created through GitHub sign-in get `timezone = 'UTC'` (schema default), so their "today" is wrong. Fix with the settings page, e.g. send the browser's `Intl.DateTimeFormat().resolvedOptions().timeZone` on first load. Local mode already uses the machine's time zone.
- GitHub sign-in has never been tested end to end: it needs a real GitHub OAuth App (callback `http://localhost:3000/api/auth/callback/github`), see `.env.example`.
- Still on the list for v0.1: weak-topics card, shadcn/ui.

### Conventions

- Store timestamps as UTC (`timestamptz`); compute "days" (today, streaks, heatmap) in the user's `timezone`, with `day_start_hour` as the day boundary.
- Expose features through route handlers (REST, Zod-validated, shared request/response types) because a Chrome extension will be a second client. Don't put business logic only in server actions.
- Business logic lives in pure functions under `src/lib/` with Vitest tests next to them (`*.test.ts`).
- DB access via Drizzle + postgres.js (`src/db`). Schema changes: edit `src/db/schema.ts`, then `pnpm db:generate` and commit the generated migration in `drizzle/`.
- Environment variables are validated in `src/env.ts`; add new ones there and to `.env.example`.
- `AUTH_MODE=local` must keep working (single-user mode, no login) for self-hosters.

### Commands

`pnpm dev` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm format` · `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:studio`
