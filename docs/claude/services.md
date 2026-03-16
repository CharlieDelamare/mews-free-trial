# Services & Features

## Customer Creation

100 sample profiles added automatically after webhook fires. Two systems:
- **Static** (`lib/sample-customers.ts`): 100 predetermined profiles
- **Dynamic** (`lib/customer-generator.ts` + `lib/customer-data-pools.ts`): weighted nationality distribution (27 nationalities), optional classifications (up to 3), notes (50% chance)

Mix: 70% personal, 30% business. Concurrency: 5 at a time. Duration: ~20-30s.

## Reservation Creation

Created after customers. State mix: Confirmed 60%, Started 15%, Processed 15%, Optional 5%, Canceled 5%. Spread across past/present/future. Concurrency: 3 at a time. Duration: ~30-60s.

**Mews API constraints (hard limits):**
- `ScheduledStartUtc` filter window: max 3 months — queries beyond this fail
- Optional reservation `ReleasedUtc`: must be a future date
- Reset cancellation: fetch reservations starting up to 7 days ago to catch recently-started ones

## Onboarding Tasks

8 tasks created per sandbox in 5 languages (en, es, fr, nl, de):
1. Create a New Reservation
2. Check In a Reservation
3. Check Out a Reservation
4. Cancel a Reservation
5. Add a Product to a Reservation
6. Correct a Closed Bill
7. Change the Reservation Owner
8. Look Up a Guest Profile

Language resolved from enterprise configuration. Files: `lib/task-service.ts`, `lib/onboarding-tasks.ts`, `lib/translations/`.

## Reset Environment (7 steps)

Orchestrated by `lib/reset-service.ts` (750s Vercel deadline):
1. Get configuration & timezone (`lib/timezone-service.ts`)
2. Fetch bookable services (`lib/mews-data-service.ts`)
3. Fetch Confirmed + Optional reservations (Started/checked-in are NOT touched)
4. Cancel reservations in batches of 1000
5. Prepare for bill closure
6. Close all open bills (`lib/bill-service.ts`: fetch → post cash payments → close)
7. Create fresh reservations (7-day window)

## API Rate Limiting

`lib/mews-rate-limiter.ts` — sliding window, 200 req/30s per token. Queues at 90% (180 req). Exponential backoff on 429 (1s → 2s → 4s → 8s). Parses `Retry-After` header.

## Trial Durations

7 / 30 (default) / 60 days. Admin emails (via `ADMIN_EMAILS` env or `lib/admin.ts`) get 1-day trials and skip Salesforce ID requirement.

## Reusable Components

| Component | Purpose |
|-----------|---------|
| `SearchableSelect` | Dropdown with search, keyboard nav, click-outside close |
| `StatusBadge` | Status indicators (building, processing, completed, failed) |
| `Toast` | Auto-dismiss notifications (3s), success/error/info |
| `CopyButton` | Copy-to-clipboard with toast |
| `Pagination` | Page nav with ellipsis and "Showing X-Y of Z" |
| `ApiCallLogs` | Expandable API call viewer with group filtering |

## useAdaptivePolling Hook

`hooks/useAdaptivePolling.ts` — 5s poll when operations active, 60s when idle. Pauses on hidden tab, fetches immediately on return. Cancels in-flight requests on cleanup.

## Email (Resend)

`lib/email-service.ts` — sends credentials to customer and requestor (if different). Branded HTML template. Non-blocking — logs errors but never throws.

## Zapier Webhooks

`lib/zapier.ts` — JSON payload with `messageType`. Message types: `trial_generation_failure`, `environment_ready`, `access_token_no_match`, `manual_environment_configured`, `manual_environment_added`.
