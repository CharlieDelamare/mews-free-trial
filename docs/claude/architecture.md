# Architecture & Project Structure

## Directory Tree

```
mews-free-trial/
├── app/                              # Next.js App Router
│   ├── api/                          # API routes
│   │   ├── cleanup-stale-sandboxes/  # GET - Weekly cron: remove dead sandboxes
│   │   ├── cleanup-stuck-logs/       # POST - Admin cleanup of stuck logs
│   │   ├── close-bills/              # POST - Close all open bills
│   │   ├── control-centre/           # Control Centre sub-routes
│   │   │   ├── auto-checkout/        # POST - Auto-checkout overdue reservations
│   │   │   ├── close-overdue-tasks/  # POST - Close overdue onboarding tasks
│   │   │   ├── doors/                # POST - Door lock scenario provisioning
│   │   │   ├── ibe/                  # POST - IBE booking simulation
│   │   │   ├── inspect/              # POST - Inspect sandbox state
│   │   │   ├── morning-prep/         # POST - Morning prep workflow
│   │   │   ├── ota-simulate/         # POST - OTA channel simulation
│   │   │   ├── scenario-provision/   # POST - Provision demo scenario
│   │   │   ├── scenario-status/      # GET - Poll scenario provision status
│   │   │   └── status/               # GET - Sandbox health/status check
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
│   │   ├── research/                 # Hotel research sub-routes
│   │   │   ├── search/               # POST - Search hotels (SerpApi + LiteAPI)
│   │   │   └── hotel/[id]/           # GET - Hotel detail with pricing
│   │   ├── reset-environment/        # POST - 7-step sandbox reset
│   │   ├── roi-presentations/        # GET/POST/PUT - Persisted ROI Calculator state
│   │   │   └── [id]/                 # GET/PUT - Single presentation by ID
│   │   ├── salesforce-accounts/      # POST - Deduped Salesforce account list
│   │   ├── save-sandbox/             # POST - Remove expiration timer
│   │   ├── services/list/            # POST - List bookable services
│   │   ├── store-environment/        # POST - Validate & store access token
│   │   ├── test-classifications/     # GET - Diagnostic endpoint
│   │   └── webhook/access-token/     # POST/GET - Webhook for access tokens
│   ├── add-bi/page.tsx               # Add Mews BI onboarding
│   ├── close-bills/page.tsx
│   ├── control-centre/               # Control Centre dashboard + IBE sub-page
│   │   ├── ibe/[theme]/page.tsx
│   │   └── page.tsx
│   ├── create/page.tsx
│   ├── extend/page.tsx
│   ├── fill/page.tsx
│   ├── logs/page.tsx
│   ├── research/page.tsx             # Hotel research tool
│   ├── reset/page.tsx
│   ├── roi-calculator/               # ROI Calculator (new + saved presentations)
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
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
│   ├── Toast.tsx                     # Toast notification system
│   ├── control-centre/               # Control Centre tab components
│   │   ├── DashboardTab.tsx
│   │   ├── DoorsTab.tsx
│   │   ├── IbeTab.tsx
│   │   ├── OperationsTab.tsx
│   │   ├── OtaTab.tsx
│   │   └── ScenariosTab.tsx
│   └── roi-calculator/               # ROI Calculator components
│       ├── PDFTemplate.tsx           # PDF export template (inline styles — PDF context only)
│       ├── ExecSummaryPDFTemplate.tsx
│       ├── PresentationWizard.tsx
│       ├── ProspectIntake.tsx
│       ├── ROIStage.tsx
│       ├── WaterfallChart.tsx
│       ├── sections/                 # ROI module sections
│       └── ui/                       # Shared UI: ActionDock, NavigationSidebar, Slider, etc.
├── hooks/
│   └── useAdaptivePolling.ts         # Smart polling (5s active / 60s idle)
├── lib/                              # Shared utilities and services
│   ├── admin.ts                      # Admin email checking (isAdminEmail)
│   ├── api-call-logger.ts            # Batched API call logging with redaction
│   ├── background.ts                 # Vercel waitUntil wrapper for fire-and-forget
│   ├── bill-service.ts               # Bill fetching, payment posting, closing
│   ├── codes.ts                      # Country/language code mappings (50+ countries)
│   ├── config.ts                     # Centralized Mews API config (tokens, URLs)
│   ├── control-centre/               # Control Centre services
│   │   ├── csv-parser.ts             # Import CSV of reservations/guests
│   │   ├── dashboard-service.ts      # Sandbox status aggregation
│   │   ├── door-service.ts           # Door lock provisioning
│   │   ├── ibe-service.ts            # IBE booking simulation
│   │   ├── operations-service.ts     # Morning prep, auto-checkout, task closing
│   │   ├── ota-service.ts            # OTA channel simulation
│   │   └── scenario-service.ts       # Demo scenario provisioning
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
│   ├── research/                     # Hotel research services
│   │   ├── inference.ts              # AI-enriched property summaries
│   │   ├── liteapi.ts                # LiteAPI hotel pricing data (LITEAPI_API_KEY)
│   │   └── serpapi.ts                # SerpApi competitor search (SERPAPI_API_KEY)
│   ├── reservation-service.ts        # Automatic reservation creation with distributions
│   ├── reservations.ts               # Reservation fetch/cancel/token resolution utilities
│   ├── reset-service.ts              # 7-step reset orchestration
│   ├── roi-calculator/               # ROI Calculator logic
│   │   ├── utils/calculations.ts     # Core savings calculations
│   │   ├── utils/confidenceScoring.ts # Input confidence scoring
│   │   ├── utils/narratives.ts       # ROI narrative generation
│   │   ├── utils/persistence.ts      # Save/load RoiPresentation DB records
│   │   ├── utils/priorityInputs.ts   # Priority input detection
│   │   ├── utils/defaultState.ts     # Default calculator state
│   │   ├── utils/hotelDefaults.ts    # Hotel-type benchmarks
│   │   ├── utils/leverDescriptors.ts # Module lever descriptions
│   │   ├── utils/timeFormat.ts       # Duration formatting
│   │   ├── data/countryBenchmarks.ts # Country-level industry benchmarks
│   │   ├── data/usStateBenchmarks.ts # US state benchmarks
│   │   ├── types/                    # ROI Calculator TypeScript types
│   │   └── translations/             # ROI Calculator i18n strings
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
| `/extend` | Extend trial expiration date |
| `/save` | Permanently remove expiration timer |
| `/add-bi` | Mews BI onboarding flow |
| `/reset` | 7-step sandbox reset |
| `/fill` | Bulk-create reservations (demo filler) |
| `/close-bills` | Close all open bills |
| `/control-centre` | Control Centre dashboard (tabs: Dashboard, Scenarios, Operations, OTA, Doors, IBE) |
| `/control-centre/ibe/[theme]` | IBE booking simulation for a specific theme |
| `/roi-calculator/new` | Create new ROI presentation |
| `/roi-calculator/[id]` | View/edit saved ROI presentation |
| `/research` | Hotel research tool (pricing, competitors) |
| `/logs` | Unified log dashboard with adaptive polling |

Navbar groups: **Sandboxes** (Create, Extend, Save, Add BI) · **Operations** (Reset, Fill, Close Bills, Control Centre) · **Tools** (ROI Calculator, Research) · **Logs**

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
| `lib/control-centre/scenario-service.ts` | Demo scenario provisioning |
| `lib/control-centre/ibe-service.ts` | IBE booking simulation |
| `lib/roi-calculator/utils/calculations.ts` | Core ROI savings calculations |
| `lib/roi-calculator/utils/persistence.ts` | Save/load ROI presentations (DB) |
| `lib/research/liteapi.ts` | Hotel pricing data via LiteAPI |
| `lib/research/serpapi.ts` | Competitor search via SerpApi |
| `vercel.json` | Cron: cleanup-stale-sandboxes (Mon 8am UTC) + function timeouts |
