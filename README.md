# LeetLog

A personal tracker for LeetCode / interview-prep check-ins: log what you solved, keep your streak, and get problems you struggled with back for review.

> Work in progress — v0.1 is under development.

## Tech stack

Next.js (App Router) · TypeScript · PostgreSQL · Drizzle ORM · Tailwind CSS · Vitest

## Quick start (local)

Requirements: Node.js 22+, pnpm, Docker.

```bash
git clone <this repo> && cd leetlog
cp .env.example .env.local
docker compose up -d          # starts Postgres on localhost:5432
pnpm install && pnpm db:migrate
pnpm dev                      # http://localhost:3000
```

By default the app runs in single-user mode (`AUTH_MODE=local`), so no login setup is needed.

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

MIT
