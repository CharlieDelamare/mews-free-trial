# Architecture & Project Structure

## Directory Tree

```
mews-free-trial/
├── app/                              # Next.js App Router
│   ├── api/                          # API routes
│   │   ├── cleanup-stuck-logs/       # POST - Admin cleanup of stuck logs
│   │   ├── close-bills/              # POST - Close all open bills
│   │   ├── create-reservation/       # POST - Create reservation (alternate flow)
│   │   ├── create-trial/             # POST - Create trial sandbox
│   │   ├── debug/                    # GET - Debug database inspection
│   │   ├── demo-filler/              # POST - Bulk reservation creation
│   │   ├── environments/list/        # GET - List all sandboxes
│   │   ├── extend-sandbox/           # POST - Extend trial expiration
│   │   ├── logs/                     # GET - Retrieve unified logs (paginated)
│   │   │   └── api-calls/[id]/       # GET - API call logs / single detail
│   │   ├── reservations/cancel-all/  # POST - Cancel all reservations
│   │   ├── reservations/get-all/     # POST - Get all reservations
│   │   ├── reset-environment/        # POST - 7-step sandbox reset
│   │   ├── salesforce-accounts/      # POST - Deduped Salesforce account list
│   │   ├── save-sandbox/             # POST - Remove expiration timer
│   │   ├── services/list/            # POST - List bookable services
│   │   ├── store-environment/        # POST - Validate & store access token
│   │   ├── test-classifications/     # GET - Diagnostic endpoint
│   │   └── webhook/access-token/     # POST/GET - Webhook for access tokens
│   ├── close-bills/page.tsx
│   ├── create/page.tsx
│   ├── extend/page.tsx
│   ├── fill/page.tsx
│   ├── logs/page.tsx
│   ├── reset/page.tsx
│   ├── save/page.tsx
│   ├── globals.css                   # Global styles + Mews design system CSS variables
│   ├── layout.tsx                    # Root layout with Navbar and Providers
│   ├── navbar.tsx                    # Burger-menu sidebar navigation
│   └── page.tsx                      # Home redirect → /create
├── components/                       # Reusable React components
│   ├── ApiCallLogs.tsx               # Expandable API call log viewer
│   ├── CopyButton.tsx                # Copy-to-clipboard button
│   ├── Pagination.tsx                # Page navigation with ellipsis
│   ├── Providers.tsx                 # App-wide context providers (Toast)
│   ├── SearchableSelect.tsx          # Dropdown with search/filter + keyboard nav
│   ├── StatusBadge.tsx               # Status indicator badges
│   └── Toast.tsx                     # Toast notification system
├── hooks/
│   └── useAdaptivePolling.ts         # Smart polling (5s active / 60s idle)
├── lib/                              # Shared utilities and services
│   ├── admin.ts                      # Admin email checking (isAdminEmail)
│   ├── api-call-logger.ts            # Batched API call logging with redaction
│   ├── background.ts                 # Vercel waitUntil wrapper for fire-and-forget
│   ├── bill-service.ts               # Bill fetching, payment posting, closing
│   ├── codes.ts                      # Country/language code mappings (50+ countries)
│   ├── config.ts                     # Centralized Mews API config (tokens, URLs)
│   ├── customer-data-pools.ts        # Name/phone/email pools for 27 nationalities
│   ├── customer-generator.ts         # Dynamic customer profile generation
│   ├── customer-service.ts           # Automatic customer creation service
│   ├── duration.ts                   # Trial duration utilities (7, 30, 60 days)
│   ├── email-service.ts              # Resend email for sandbox credentials
│   ├── fetch-timeout.ts              # Fetch wrapper with AbortController timeout
│   ├── force-log.ts                  # Unbuffered stderr logging for serverless
│   ├── log-enrichment.ts             # Enrich logs with customer/reservation stats
│   ├── mews-api.ts                   # Mews auth builder and endpoint helper
│   ├── mews-data-service.ts          # Dynamic fetching of services/rates/categories
│   ├── mews-rate-limiter.ts          # Sliding window rate limiter (200 req/30s)
│   ├── onboarding-tasks.ts           # 8 onboarding task definitions (multilingual)
│   ├── prisma.ts                     # Prisma client singleton
│   ├── reservation-service.ts        # Automatic reservation creation with distributions
│   ├── reservations.ts               # Reservation fetch/cancel/token resolution utilities
│   ├── reset-service.ts              # 7-step reset orchestration
│   ├── sample-customers.ts           # 100 predetermined customer profiles (static)
│   ├── task-service.ts               # Onboarding task creation service
│   ├── timezone-service.ts           # Timezone fetching from Mews configuration
│   ├── unified-logger.ts             # Central logging hub for all operation types
│   ├── validation.ts                 # Input validation helpers (email, strings, SF IDs)
│   ├── zapier.ts                     # Zapier webhook notification utility
│   └── translations/                 # Multilingual support (en, es, fr, nl, de)
├── types/
│   ├── reservations.ts               # Reservation states, Mews types, cancellation
│   ├── reset.ts                      # Reset operation types, bill types, step enum
│   └── unified-log.ts               # Unified log types, type guards, input/update types
├── prisma/
│   ├── schema.prisma                 # Database schema (8 models)
│   └── migrations/
├── scripts/
│   ├── migrate-deploy.js             # Production migration script with error recovery
│   └── smart-migrate-deploy.js       # Optimization wrapper (skips if up-to-date)
├── docs/
│   ├── claude/                       # Reference docs for AI sessions
│   ├── superpowers/specs/            # Design specs (e.g. 2026-03-16-control-centre-design.md)
│   └── superpowers/plans/            # Implementation plans
└── .worktrees/                       # Git worktrees for isolated feature branches
```

## Navigation & Pages

| Route | Purpose |
|-------|---------|
| `/create` | Trial sandbox creation form |
| `/reset` | 7-step sandbox reset |
| `/extend` | Extend trial expiration date |
| `/save` | Permanently remove expiration timer |
| `/fill` | Bulk-create reservations (demo filler) |
| `/close-bills` | Close all open bills |
| `/logs` | Unified log dashboard with adaptive polling |

Navbar groups: **Sandboxes** (Create, Extend, Save) · **Operations** (Reset, Fill, Close Bills) · **Logs**

## Key Files Quick Reference

| File | Purpose |
|------|---------|
| `app/api/create-trial/route.ts` | Core trial creation logic |
| `app/api/reset-environment/route.ts` | 7-step sandbox reset |
| `app/api/webhook/access-token/route.ts` | Webhook handler, triggers setup |
| `lib/customer-service.ts` | Batch customer creation (100 profiles) |
| `lib/reservation-service.ts` | Reservation creation with state distributions |
| `lib/reset-service.ts` | 7-step reset orchestration (750s deadline) |
| `lib/bill-service.ts` | Bill fetching, payments, closing |
| `lib/task-service.ts` | Onboarding task creation |
| `lib/unified-logger.ts` | Central logging hub for all operation types |
| `lib/api-call-logger.ts` | Batched API call logging with redaction |
| `lib/mews-rate-limiter.ts` | Sliding window rate limiter (200 req/30s) |
| `lib/mews-api.ts` | `buildMewsAuth()` and `mewsEndpoint()` helpers |
| `lib/mews-data-service.ts` | Dynamic service/rate/category fetching |
| `lib/codes.ts` | Country/language mappings (50+ countries) |
| `types/unified-log.ts` | Discriminated union types + type guards |
