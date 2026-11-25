<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project context: LeetLog

A personal LeetCode / interview-prep check-in tracker, also a portfolio project. **Read `docs/design-decisions.md` before starting work** — it has the product scope, data model, conventions, deployment plan, v0.1 build order and the UI spec. The owner writes in Chinese; reply in Chinese.

### Current status

- v0.1 step 0–1 done: deps installed, initial migration generated in `drizzle/`, format / lint / typecheck / test pass.
- Not yet run: `docker compose up -d && pnpm db:migrate` (Docker was not installed on the dev machine at the time).
- Next: step 2 (pure-function business logic + Vitest tests).

### Conventions

- Store timestamps as UTC (`timestamptz`); compute "days" (today, streaks, heatmap) in the user's `timezone`, with `day_start_hour` as the day boundary.
- Expose features through route handlers (REST, Zod-validated, shared request/response types) because a Chrome extension will be a second client. Don't put business logic only in server actions.
- Business logic lives in pure functions under `src/lib/` with Vitest tests next to them (`*.test.ts`).
- DB access via Drizzle + postgres.js (`src/db`). Schema changes: edit `src/db/schema.ts`, then `pnpm db:generate` and commit the generated migration in `drizzle/`.
- Environment variables are validated in `src/env.ts`; add new ones there and to `.env.example`.
- `AUTH_MODE=local` must keep working (single-user mode, no login) for self-hosters.

### Commands

`pnpm dev` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm format` · `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:studio`
