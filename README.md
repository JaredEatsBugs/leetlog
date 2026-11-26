# LeetLog

A personal tracker for LeetCode / interview-prep check-ins: log what you solved, keep your streak, and get the problems you struggled with back for review.

> 🚧 **This project is still in progress.** v0.1 is being built right now — the core flow works locally, but features are missing, the API may still change, and there is no hosted version yet. See [Status](#status) and [Roadmap](#roadmap).

## Features

- **Log an attempt in seconds** — press <kbd>N</kbd>, paste a LeetCode link or type a problem number, pick how it went (solved alone / needed a hint / read the solution), save with <kbd>⌘</kbd><kbd>↵</kbd>.
- **Streaks and a 20-week heatmap** — days are counted in your own time zone, and a new day starts at 4 am by default, so a 1 am solve still counts for "today".
- **Spaced review** — problems you didn't solve on your own come back automatically: 3 days after needing a hint, 1 day after reading the solution. Solve it alone and it leaves the queue.
- **Today page** — goal progress, review queue with one-click redo, what you did today, this week's solo-AC rate.
- **Self-hostable** — single-user mode (`AUTH_MODE=local`) needs no login setup; GitHub sign-in is available for a shared deployment.

## Status

**Working now (local):** data model and migrations · business logic (day boundaries, streaks, review queue, heatmap) with unit tests · REST API · GitHub OAuth + local single-user mode · Today page, Log page and the log-attempt dialog.

**Not done yet:** problem detail page · settings (daily goal, time zone) · stats page · Chrome extension · production deployment. GitHub sign-in is implemented but not yet tested end to end.

## Roadmap

| Version  | Scope                                                         | Status         |
| -------- | ------------------------------------------------------------- | -------------- |
| **v0.1** | Sign-in, log a problem manually, attempt list, heatmap/streak | 🚧 In progress |
| v0.2     | Review queue polish, Today page refinements, settings         | Planned        |
| v0.3     | Chrome extension: one-click logging on LeetCode problem pages | Planned        |
| v0.4     | Stats: coverage by topic and difficulty                       | Planned        |

## Tech stack

Next.js 16 (App Router, Cache Components) · TypeScript · PostgreSQL · Drizzle ORM + postgres.js · Auth.js · Zod · SWR · Tailwind CSS · Vitest · GitHub Actions

## Architecture

The web app and the upcoming Chrome extension are both clients of the same REST API, so nothing important lives only in server actions.

```
src/
  lib/         Pure business logic (no DB, no framework) + Vitest tests next to each file
  contracts/   Zod schemas and types for API requests/responses, shared by all clients
  server/      Database access, row → DTO mapping, auth helpers
  app/api/     Thin route handlers: authenticate, validate with Zod, call server/
  components/  Client UI (reads the API through SWR)
  db/          Drizzle schema and client
drizzle/       Generated SQL migrations
```

- Timestamps are stored in UTC (`timestamptz`); "which day is it" is computed in the user's time zone with a configurable day-start hour, in exactly one function (`src/lib/day.ts`).
- The review queue is derived from the attempts table rather than stored separately.

### API

| Endpoint               | Description                                                               |
| ---------------------- | ------------------------------------------------------------------------- |
| `GET /api/me`          | Current user and settings                                                 |
| `POST /api/attempts`   | Log an attempt, by catalog id or by describing a new problem              |
| `GET /api/attempts`    | Attempts, newest first, cursor-paginated (`limit`, `cursor`, `problemId`) |
| `GET /api/today`       | Everything the Today page needs: streak, review queue, this week, heatmap |
| `GET /api/problems?q=` | Search the problem catalog by number, LeetCode URL, slug or title         |

## Quick start (local)

Requirements: Node.js 22+, pnpm, Docker (Docker Desktop or OrbStack).

```bash
git clone https://github.com/JaredEatsBugs/leetlog.git && cd leetlog
cp .env.example .env.local
docker compose up -d          # starts Postgres on localhost:5432
pnpm install && pnpm db:migrate
pnpm dev                      # http://localhost:3000
```

By default the app runs in single-user mode (`AUTH_MODE=local`), so no login setup is needed. To use GitHub sign-in instead, follow the comments in `.env.example`.

## Scripts

| Command                                      | What it does                                          |
| -------------------------------------------- | ----------------------------------------------------- |
| `pnpm dev`                                   | Start the dev server                                  |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Lint, type-check, run unit tests                      |
| `pnpm format`                                | Format the code with Prettier                         |
| `pnpm db:generate`                           | Create a migration from changes in `src/db/schema.ts` |
| `pnpm db:migrate`                            | Apply migrations to the database in `DATABASE_URL`    |
| `pnpm db:studio`                             | Browse the database in Drizzle Studio                 |

## License

[MIT](LICENSE)
