# CLAUDE.md

Mews Sandbox Manager — Next.js app for managing Mews demo trial sandboxes. Sales reps create, reset, extend, save, and populate trial hotel environments via the Mews API.

## Project Overview

This is a TypeScript project using Next.js. Primary language is TypeScript. Use strict typing and avoid `any` types.

## AI Workflow

**Always plan before coding.** Use TodoWrite for any task with 3+ steps. Keep exactly one task `in_progress` at a time. Mark complete immediately after finishing — never batch.

Skip planning for: single-step tasks, informational questions, trivial one-line changes.

## Critical Rules

**Database schema changes** — ALWAYS run `npx prisma migrate dev --name <name>` in the same PR. Never push schema changes without a migration. Commit both `prisma/schema.prisma` and the generated files in `prisma/migrations/`.

**External APIs** — Read docs carefully. Never guess at payload structures, field names, or parameter types. If unsure, ask for an example request/response before implementing.

## Tech Stack

Next.js 14 (App Router) · TypeScript strict · PostgreSQL + Prisma + Accelerate · Tailwind CSS · Vitest + MSW · Vercel serverless · date-fns · Resend email

## Dev Commands

```bash
npm run dev                                    # development server
npm run test / test:watch / test:coverage      # tests
npm run lint                                   # linter
npm run build                                  # production build (includes prisma generate)
npx prisma migrate dev --name <name>           # create migration
npm run migrate:smart                          # deploy migrations (skips if up-to-date)
git worktree list                              # list active feature worktrees
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `mews_free_trial_PRISMA_DATABASE_URL` | Prisma Accelerate proxy URL |
| `mews_free_trial_POSTGRES_URL` | Direct PostgreSQL (for migrations) |
| `MEWS_SAMPLE_TOKEN` | Token for addSample enterprise API |
| `MEWS_CLIENT_TOKEN` | Mews Connector API client token |
| `MEWS_ACCESS_TOKEN` | Mews Connector API access token |
| `MEWS_API_URL` | Mews API base URL (default: https://api.mews-demo.com) |
| `SLACK_WEBHOOK_URL` | Slack Workflow webhook URL |
| `RESEND_API_KEY` | Resend email API key |
| `ADMIN_EMAILS` / `NEXT_PUBLIC_ADMIN_EMAILS` | Comma-separated admin emails (1-day trials, skip SF ID) |
| `LITEAPI_API_KEY` | LiteAPI hotel pricing data (Research feature) |
| `SERPAPI_API_KEY` | SerpApi competitor data (Research feature) |

Service/Rate/Category IDs are fetched dynamically — no env vars needed.

## Code Conventions

- Path alias `@/*` for all imports from root
- API routes: `NextResponse.json({ success: boolean; error?: string; ...data })`
- Long operations: `runInBackground()` from `lib/background.ts` (Vercel waitUntil)
- Prisma: singleton via `import { prisma } from '@/lib/prisma'`
- Components: `'use client'` directive, `useToast()` for notifications

## UI/Styling

When making UI/styling changes, confirm the exact elements and desired styles with the user before applying. Do not assume which components to modify — ask if ambiguous.

## Development Workflow

After any code change that affects types or builds, run `npm run build` (or the project's build command) before committing to catch type errors early.

## API Integration

When fixing bugs or building features, do not assume API response shapes or field names. If unsure, read the actual API types/interfaces in the codebase or ask the user to paste real payloads.

## Git Workflow

When post-merge changes need deployment, always create a new PR from the current branch — do not push directly to main. Ask before pushing to any protected branch.

## Mews API

- Demo: `https://app.mews-demo.com` · Connector: `https://api.mews-demo.com/api/connector/v1/`
- Auth: `buildMewsAuth()` and `mewsEndpoint()` in `lib/mews-api.ts`
- Rate limit: 200 req/30s per token (`lib/mews-rate-limiter.ts`)
- Default trial password: `Sample123`
- **Cursor pagination**: paginated endpoints return a `Cursor` field; loop with `do/while` until `Cursor` is `null`/`undefined`. Missing this causes silent data loss (e.g. `getBills`).
- `mewsRateLimiter` already handles backpressure between batches — never add manual `setTimeout` sleeps.

## Reference Docs

Detailed reference — read these when working in the relevant area:

- **Architecture & file map**: `docs/claude/architecture.md`
- **API endpoint reference**: `docs/claude/api-reference.md`
- **Database schema**: `docs/claude/database.md`
- **Services & features**: `docs/claude/services.md`
- **Testing guide**: `docs/claude/testing.md`
- **Design system rules**: `.claude/rules/design-system.md`
- **Webhook setup**: `WEBHOOK_SETUP.md`
