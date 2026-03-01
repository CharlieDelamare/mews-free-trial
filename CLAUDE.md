# CLAUDE.md

This document provides an overview of the Mews Sandbox Manager application for AI assistants working on this codebase.

## AI Assistant Instructions

**CRITICAL: ALWAYS START IN PLAN MODE**

When you receive any request to work on this codebase, you MUST follow this workflow:

1. **Plan First**: Before writing any code or making any changes, ALWAYS use the TodoWrite tool to create a detailed plan
2. **Break Down Tasks**: Decompose complex requests into specific, actionable steps
3. **Track Progress**: Use TodoWrite to mark tasks as `in_progress`, `completed`, or `pending` throughout your work
4. **One Task at a Time**: Keep exactly ONE task marked as `in_progress` at any given time
5. **Update Immediately**: Mark tasks as completed right after finishing them - do not batch completions

**When to Create a Plan:**
- Any task with 3+ distinct steps
- Any non-trivial implementation or bug fix
- Multiple feature requests or changes
- User provides a list of tasks to complete
- Complex debugging or investigation work

**When NOT to Create a Plan:**
- Simple single-step tasks (e.g., "show me the logs table")
- Purely informational questions
- Trivial changes to a single line of code

This ensures all work is methodical, trackable, and complete.

**CRITICAL: Database Schema Changes**

When modifying the Prisma schema (`prisma/schema.prisma`), you MUST:
1. Create the migration in the same commit/PR using `npx prisma migrate dev --name descriptive_name`
2. NEVER push schema changes without a corresponding migration
3. Include the generated migration files in `prisma/migrations/` in your commit
4. Ensure the migration is tested before pushing

Pushing schema changes without migrations will cause production deployment failures.

**CRITICAL: Working with External APIs**

When integrating with external APIs (Mews API or any other):
1. **Read API documentation carefully** when provided - do not skip or skim documentation
2. **If unsure about an endpoint**, ALWAYS ask for an example request & response before implementing
3. **Never guess** at API payload structures, parameters, or response formats
4. **Verify** the exact field names, data types, and required vs optional parameters from documentation or examples

This prevents implementing incorrect API calls that will fail in production.

## Project Overview

**Mews Sandbox Manager** is a Next.js web application for managing Mews demo trial sandboxes. Sales representatives can create, reset, extend, save, and populate trial hotel environments in the Mews demo system. The app integrates with the Mews API to provision sample hotels with automatic customer, reservation, and onboarding task creation, tracks all operations via a unified logging system, and sends notifications via Zapier webhooks and Resend email.

### Key Features

- **Trial sandbox creation**: Create 7, 30, or 60-day trial sandboxes with hotels, hostels, or apartments
- **Reset environment**: 7-step reset process that cancels reservations, closes bills, and creates fresh data
- **Extend trial**: Push sandbox expiration dates further into the future
- **Save sandbox**: Permanently remove expiration timer from a trial
- **Demo filler**: Bulk-create custom reservations with configurable date ranges and counts
- **Close bills**: Close all open bills in a sandbox with automatic payment posting
- **50+ country support**: Proper legal environment, currency, and tax configurations
- **Automatic customer creation**: 100 diverse sample customers added to each sandbox (static + dynamic generation)
- **Automatic reservation creation**: Realistic reservations with intelligent distribution across property lifecycle
- **Onboarding tasks**: 8 guided tasks created per sandbox in 5 languages (en, es, fr, nl, de)
- **Email notifications**: Sandbox credentials sent via Resend email service
- **Unified logging**: Single dashboard tracking all operation types with real-time adaptive polling
- **API call tracking**: Every Mews API call logged for debugging with request/response bodies
- **API rate limiting**: Sliding window rate limiter preventing 429 errors (200 req/30s per token)
- **Dynamic Mews data fetching**: Services, rates, and categories fetched automatically (no hardcoded IDs)
- **Webhook integration**: Receive and process access tokens from Mews
- **Zapier notifications**: Sandbox creation, setup, and CRM integration
- **Reusable components**: Searchable selects, status badges, toast notifications, pagination, copy buttons
- **Comprehensive testing**: 15 test files with Vitest, MSW, and React Testing Library

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM + Accelerate extension
- **Styling**: Tailwind CSS
- **Date handling**: date-fns / date-fns-tz
- **Email**: Resend
- **Background tasks**: @vercel/functions (waitUntil)
- **Testing**: Vitest + MSW + React Testing Library
- **Runtime**: Node.js
- **Deployment**: Vercel (serverless)

## Project Structure

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
│   │   ├── environments/
│   │   │   └── list/                 # GET - List all sandboxes
│   │   ├── extend-sandbox/           # POST - Extend trial expiration
│   │   ├── logs/                     # GET - Retrieve unified logs (paginated)
│   │   │   └── api-calls/            # GET - API call logs for a unified log
│   │   │       └── [id]/             # GET - Single API call detail
│   │   ├── reservations/
│   │   │   ├── cancel-all/           # POST - Cancel all reservations
│   │   │   └── get-all/              # POST - Get all reservations
│   │   ├── reset-environment/        # POST - 7-step sandbox reset
│   │   ├── salesforce-accounts/      # POST - Deduped Salesforce account list
│   │   ├── save-sandbox/             # POST - Remove expiration timer
│   │   ├── services/
│   │   │   └── list/                 # POST - List bookable services
│   │   ├── store-environment/        # POST - Validate & store access token
│   │   ├── test-classifications/     # GET - Diagnostic endpoint
│   │   └── webhook/
│   │       └── access-token/         # POST/GET - Webhook for access tokens
│   ├── close-bills/                  # Close bills page
│   │   └── page.tsx
│   ├── create/                       # Trial creation form page
│   │   └── page.tsx
│   ├── extend/                       # Extend trial page
│   │   └── page.tsx
│   ├── fill/                         # Demo filler page
│   │   └── page.tsx
│   ├── logs/                         # Unified logs dashboard
│   │   └── page.tsx
│   ├── reset/                        # Reset environment page
│   │   └── page.tsx
│   ├── save/                         # Save sandbox page
│   │   └── page.tsx
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
├── hooks/                            # Custom React hooks
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
│   └── translations/                 # Multilingual support
│       ├── index.ts                  # Translation exports
│       ├── language-utils.ts         # Language resolution helpers
│       ├── customer-notes/           # Customer note translations (en, es, fr, nl, de)
│       └── onboarding-tasks/         # Task translations (en, es, fr, nl, de)
├── types/                            # TypeScript type definitions
│   ├── reservations.ts               # Reservation states, Mews types, cancellation
│   ├── reset.ts                      # Reset operation types, bill types, step enum
│   └── unified-log.ts               # Unified log types, type guards, input/update types
├── prisma/
│   ├── schema.prisma                 # Database schema (8 models)
│   └── migrations/                   # Database migrations
├── scripts/
│   ├── migrate-deploy.js             # Production migration script with error recovery
│   └── smart-migrate-deploy.js       # Optimization wrapper (skips if up-to-date)
├── tests/
│   └── setup.ts                      # Global test setup (env vars)
├── docs/                             # Internal documentation
│   ├── CLASSIFICATIONS_NOTES_DEBUG.md
│   ├── design-system-audit.md
│   └── plans/
├── .env.example                      # Environment variable template
├── next.config.js                    # Next.js config (no sourcemaps in prod)
├── tailwind.config.js                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── vitest.config.ts                  # Vitest test configuration
├── TESTING.md                        # Comprehensive testing guide
└── WEBHOOK_SETUP.md                  # Webhook documentation
```

## Navigation & Pages

The app uses a burger-menu sidebar navigation (`app/navbar.tsx`) organized into sections:

| Route | Page | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Redirects to `/create` |
| `/create` | `app/create/page.tsx` | Trial sandbox creation form |
| `/reset` | `app/reset/page.tsx` | Reset an existing sandbox (cancel reservations, close bills, recreate) |
| `/extend` | `app/extend/page.tsx` | Extend trial expiration date |
| `/save` | `app/save/page.tsx` | Permanently remove expiration timer |
| `/fill` | `app/fill/page.tsx` | Bulk-create reservations (demo filler) |
| `/close-bills` | `app/close-bills/page.tsx` | Close all open bills in a sandbox |
| `/logs` | `app/logs/page.tsx` | Unified log dashboard with adaptive polling |

**Navigation groups:**
- **Sandboxes**: Create, Extend, Save
- **Operations**: Reset, Fill, Close Bills
- **Logs**: Always pinned at bottom

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production (includes Prisma generate)
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Generate Prisma client (runs automatically on postinstall with --no-engine)
npx prisma generate

# Run database migrations (development)
npx prisma migrate dev

# Deploy migrations to production
npm run migrate:deploy

# Smart migration deploy (skips if up-to-date)
npm run migrate:smart
```

## Environment Variables

Required variables (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `mews_free_trial_PRISMA_DATABASE_URL` | Prisma Accelerate proxy URL |
| `mews_free_trial_POSTGRES_URL` | Direct PostgreSQL connection (for migrations) |
| `MEWS_SAMPLE_TOKEN` | Token for creating sample enterprises via addSample API |
| `MEWS_CLIENT_TOKEN` | Client token for Mews Connector API |
| `MEWS_ACCESS_TOKEN` | Access token for Mews Connector API (for manual operations) |
| `MEWS_API_URL` | Mews API base URL (default: https://api.mews-demo.com) |

Optional:

| Variable | Description |
|----------|-------------|
| `ZAPIER_WEBHOOK_URL` | Zapier webhook for all notifications (Slack, CRM, etc.) |
| `RESEND_API_KEY` | Resend API key for sending sandbox credential emails |
| `ADMIN_EMAILS` / `NEXT_PUBLIC_ADMIN_EMAILS` | Comma-separated admin email addresses (get 1-day trials, skip SF ID) |

**Note:** Service IDs, Rate IDs, and Resource Category IDs are fetched dynamically from the Mews API using `lib/mews-data-service.ts` — no environment variables needed.

## API Endpoints

### POST `/api/create-trial`

Creates a new trial hotel sandbox in the Mews demo system with automatic customer, reservation, and task creation.

**Request Body:**
```typescript
{
  requestorEmail: string;       // Sales rep email
  firstName: string;            // Customer first name
  lastName: string;             // Customer last name
  customerEmail: string;        // Customer login email
  preferredLanguage: string;    // e.g., "English (UK)"
  propertyName: string;         // Hotel name
  propertyCountry: string;      // e.g., "United Kingdom"
  propertyType: 'hotel' | 'hostel' | 'apartments';
  durationDays: 7 | 30 | 60;   // Trial duration (default: 30)
  salesforceAccountId?: string; // Required unless admin email
  roomCount?: number;           // For hotels/hostels
  dormCount?: number;           // For hostels only
  apartmentCount?: number;      // For apartments
  bedCount?: number;            // Beds per dorm (hostels)
}
```

**Process Flow:**
1. Creates enterprise via Mews addSample API
2. Logs status as "building" in UnifiedLog
3. Mews sends webhook with access token
4. Status updated to "processing"
5. Automatically creates 100 customers
6. Automatically creates realistic reservations
7. Creates 8 onboarding tasks
8. Sends email with login credentials
9. Status updated to "completed"
10. Sends Zapier notifications

### POST `/api/reset-environment`

Resets an existing sandbox with a 7-step process.

**Request Body:**
```typescript
{
  enterpriseId?: string;  // Either enterpriseId or accessToken required
  accessToken?: string;
}
```

**7-step process:**
1. Get configuration & timezone
2. Fetch bookable services
3. Get existing reservations (Confirmed + Optional only)
4. Cancel reservations (batches of 1000)
5. Prepare for bill closure
6. Close all open bills (with automatic cash payments)
7. Create new reservations (7-day window)

**Note:** Checked-in guests (Started reservations) are NOT affected.

### POST `/api/extend-sandbox`

Extends a trial sandbox's expiration date.

**Request Body:**
```typescript
{
  enterpriseId: string;
  newExpirationUtc: string;  // ISO 8601, must be future date
}
```

### POST `/api/save-sandbox`

Permanently removes the expiration timer from a trial sandbox.

**Request Body:**
```typescript
{
  enterpriseId: string;
}
```

### POST `/api/demo-filler`

Creates custom reservations in bulk within a date range.

**Request Body:**
```typescript
{
  enterpriseId: string;
  startDate: string;          // ISO date, today or future
  endDate: string;            // ISO date, same or after startDate
  reservationCount: number;   // 1-500 (default: 20)
  serviceId?: string;         // Optional, auto-detected if not provided
}
```

**Validation:** Date range must be 3+ days.

### POST `/api/close-bills`

Closes all open bills for a sandbox environment.

**Request Body:**
```typescript
{
  enterpriseId: string;
}
```

**Process:** Fetches order items → posts external cash payments for non-zero balances → closes bills.

### POST `/api/store-environment`

Validates an access token against the Mews API and stores the environment.

**Request Body:**
```typescript
{
  accessToken: string;
}
```

**Use Case:** Manually add a sandbox to the dropdown list before the webhook arrives.

### POST `/api/services/list`

Fetches bookable services for an enterprise.

**Request Body:**
```typescript
{
  enterpriseId: string;
}
```

### GET `/api/logs`

Returns paginated unified logs from the database.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)

**Response:** Returns `{ success, logs, total, hasActiveOperations }`.

### GET `/api/logs/api-calls`

Returns API call logs for a specific unified log entry.

**Query Parameters:**
- `logId` (required): Unified log ID
- `group` (optional): Filter by group (initial, setup, customers, reservations, etc.)
- `limit` (optional): Max items (default: 2000)
- `offset` (optional): Skip items

### GET `/api/logs/api-calls/[id]`

Returns full detail of a single API call log including request/response bodies.

### GET `/api/environments/list`

Lists all available trial sandboxes with their details.

### POST `/api/reservations/get-all`

Retrieves all reservations for a specific sandbox.

### POST `/api/reservations/cancel-all`

Cancels all reservations in a specific sandbox.

### POST `/api/salesforce-accounts`

Returns deduplicated list of Salesforce Account IDs with property details.

### POST `/api/cleanup-stuck-logs`

Admin endpoint. Deletes stuck logs (building/processing status) and their associated API call logs.

### GET `/api/test-classifications`

Diagnostic endpoint. Tests if customer classifications and notes persist in Mews demo API.

### POST/GET `/api/webhook/access-token`

- **POST**: Receives access token webhooks from Mews. Triggers automatic customer, reservation, and task creation in background.
- **GET**: Retrieves stored access tokens (optional `enterpriseId` query param).

### GET `/api/debug`

Debug endpoint for inspecting database records.

**Query Parameters:** `enterpriseId` (optional), `limit` (optional).

## Database Schema

### AccessToken

Stores access tokens received via webhook:

```prisma
model AccessToken {
  id              Int      @id @default(autoincrement())
  accessToken     String
  enterpriseId    String
  enterpriseName  String
  serviceId       String?
  serviceName     String?
  integrationId   String?
  integrationName String?
  createdUtc      String
  receivedAt      DateTime @default(now())
  isEnabled       Boolean  @default(true)
  action          String

  @@unique([enterpriseId, integrationId, accessToken])
  @@index([enterpriseId])
  @@index([integrationId])
}
```

### EnvironmentLog

Tracks created trial sandboxes (legacy table, retained for historical data).

```prisma
model EnvironmentLog {
  id                  String   @id @default(cuid())
  timestamp           DateTime @default(now())
  propertyName        String
  customerName        String
  customerEmail       String
  propertyCountry     String
  propertyType        String
  loginUrl            String
  loginEmail          String
  loginPassword       String
  status              String   // 'building' | 'Updating' | 'completed' | 'failure'
  errorMessage        String?
  enterpriseId        String?
  requestorEmail      String?
  durationDays        Int?
  roomCount           Int?
  dormCount           Int?
  apartmentCount      Int?
  bedCount            Int?
  timezone            String?
  salesforceAccountId String?
}
```

### CustomerCreationLog

Tracks automatic creation of sample customers:

```prisma
model CustomerCreationLog {
  id              Int      @id @default(autoincrement())
  enterpriseId    String
  accessTokenId   Int
  totalCustomers  Int
  successCount    Int
  failureCount    Int
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  status          String   // 'processing' | 'completed' | 'failed'
  errorSummary    String?  @db.Text
  customerResults Json?
}
```

### ReservationCreationLog

Tracks automatic and demo-filler reservation creation:

```prisma
model ReservationCreationLog {
  id                  Int       @id @default(autoincrement())
  enterpriseId        String
  accessTokenId       Int
  totalReservations   Int
  successCount        Int
  failureCount        Int
  startedAt           DateTime  @default(now())
  completedAt         DateTime?
  status              String    // 'processing' | 'completed' | 'failed'
  errorSummary        String?   @db.Text
  reservationResults  Json?
  operationType       String?   @default("automatic") // 'automatic' | 'demo_filler'
}
```

### TaskCreationLog

Tracks onboarding task creation:

```prisma
model TaskCreationLog {
  id              Int       @id @default(autoincrement())
  enterpriseId    String
  accessTokenId   Int
  totalTasks      Int
  successCount    Int
  failureCount    Int
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  status          String    // 'processing' | 'completed' | 'failed'
  errorSummary    String?   @db.Text
  taskResults     Json?
}
```

### ResetOperationLog

Tracks 7-step reset operations:

```prisma
model ResetOperationLog {
  id                Int       @id @default(autoincrement())
  enterpriseId      String
  accessTokenId     Int
  status            String    // 'processing' | 'completed' | 'failed'
  currentStep       Int       @default(0)
  totalSteps        Int       @default(7)
  startedAt         DateTime  @default(now())
  completedAt       DateTime?
  errorSummary      String?   @db.Text
  operationDetails  Json?
}
```

### UnifiedLog

**Primary logging table** for all operation types:

```prisma
model UnifiedLog {
  id              String    @id @default(cuid())
  logType         String    // 'environment' | 'reset' | 'demo_filler' | 'close_bills'
  timestamp       DateTime  @default(now())
  enterpriseId    String?
  status          String    // 'building' | 'processing' | 'completed' | 'failed'
  completedAt     DateTime?
  errorMessage    String?   @db.Text

  // Environment-specific fields
  propertyName        String?
  customerName        String?
  customerEmail       String?
  propertyCountry     String?
  propertyType        String?
  loginUrl            String?
  loginEmail          String?
  loginPassword       String?
  signInUrl           String?   // Passwordless sign-in URL from Mews
  requestorEmail      String?
  durationDays        Int?
  roomCount           Int?
  dormCount           Int?
  apartmentCount      Int?
  bedCount            Int?
  timezone            String?
  salesforceAccountId String?

  // Reset-specific fields
  currentStep       Int?
  totalSteps        Int?

  // Shared operation fields
  accessTokenId       Int?
  totalItems          Int?
  successCount        Int?
  failureCount        Int?
  operationDetails    Json?   // Type-specific data (customer/reservation stats, reset details, etc.)
}
```

**Log Types:**
- `environment` — New sandbox creation (customers, reservations, tasks)
- `reset` — 7-step sandbox reset with step tracking
- `demo_filler` — Bulk reservation creation
- `close_bills` — Bill closure operations

### ApiCallLog

Tracks every individual Mews API call for debugging:

```prisma
model ApiCallLog {
  id            Int      @id @default(autoincrement())
  unifiedLogId  String
  timestamp     DateTime @default(now())
  endpoint      String   // e.g., "customers/add", "services/getAll"
  method        String   @default("POST")
  url           String
  group         String   // "initial" | "setup" | "customers" | "reservations" | "state_transitions" | "tasks" | "bills"
  statusCode    Int?
  durationMs    Int
  success       Boolean  @default(true)
  requestBody   String?  @db.Text
  responseBody  String?  @db.Text
  errorMessage  String?
  metadata      Json?
}
```

## Unified Logging System

All operations are tracked through a single `UnifiedLog` table with type-specific fields, replacing individual log endpoints.

### Architecture

- **`lib/unified-logger.ts`**: Central hub — creates and updates logs for all operation types
- **`lib/api-call-logger.ts`**: Logs every Mews API call with batched writes (50-entry batches, 2s flush interval), token redaction, and response truncation (10KB limit)
- **`lib/log-enrichment.ts`**: Enriches logs with customer/reservation statistics for the dashboard
- **`types/unified-log.ts`**: Discriminated union types with type guards (`isEnvironmentLog()`, `isResetLog()`, etc.)

### Dashboard

The `/logs` page displays all operation types with:
- Pagination (20 items per page)
- Adaptive polling via `useAdaptivePolling` hook (5s when operations active, 60s when idle)
- Status badges (building, processing, completed, failed)
- Expandable API call logs per operation
- Copy-to-clipboard for login credentials

## Automatic Customer Creation

When a trial sandbox is created, 100 sample customer profiles are automatically added after the webhook access token is received.

### Customer Generation

Two systems work together:
- **Static profiles** (`lib/sample-customers.ts`): 100 predetermined diverse customers
- **Dynamic generation** (`lib/customer-generator.ts` + `lib/customer-data-pools.ts`): Generates unique profiles on demand with weighted nationality distribution across 27 nationalities, optional classifications (up to 3), and notes (50% chance)

### Profile Characteristics

- **Mix**: 70% personal travelers, 30% business travelers
- **Diversity**: 27 nationalities (GB, US, DE, FR, IT, ES, NL, PL, CZ, PT, SE, DK, NO, IE, AT, BE, HU, GR, RO, RU, EE, FI, JP, KR, CH, etc.)
- **Full profiles**: name, email, phone, birth date, nationality, language, gender, title, company
- **Unique emails**: Index-based suffix to prevent duplicates

### Technical Details

- **Concurrency**: 5 customers processed at a time
- **Duration**: ~20-30 seconds for all 100 customers
- **Error Handling**: Continues processing even if some fail; tracks individual results
- **Rate Limiting**: Uses `mews-rate-limiter.ts` to prevent 429 errors

### Files

| File | Purpose |
|------|---------|
| `lib/sample-customers.ts` | 100 predetermined customer profiles (static) |
| `lib/customer-generator.ts` | Dynamic customer profile generation |
| `lib/customer-data-pools.ts` | Name/phone/email pools for 27 nationalities |
| `lib/customer-service.ts` | Batch processing logic, Mews API integration |

## Automatic Reservation Creation

After customers are created, realistic sample reservations are automatically added to populate the trial sandbox.

### Reservation Characteristics

- **Mix of states**: Confirmed (60%), Started (15%), Processed (15%), Optional (5%), Canceled (5%)
- **Time distribution**: Past, present, and future reservations
- **Variable length**: 1-7 night stays with realistic patterns
- **Intelligent distribution**: Spread across available rooms/apartments
- **Guest assignment**: Uses customers created in previous step

### Technical Details

- **Concurrency**: 3 reservations processed at a time
- **Duration**: ~30-60 seconds depending on property size
- **Dependencies**: Requires customers to exist first; dynamically fetches services/rates via `mews-data-service.ts`
- **Rate Limiting**: Uses `mews-rate-limiter.ts`

### Files

| File | Purpose |
|------|---------|
| `lib/reservation-service.ts` | Reservation creation orchestration and distribution logic |
| `lib/mews-data-service.ts` | Fetches services, rates, and resource categories |
| `lib/reservations.ts` | Fetch, cancel, and token resolution utilities |
| `types/reservations.ts` | Reservation states and Mews types |

## Onboarding Tasks

8 onboarding tasks are automatically created per sandbox to guide prospects through Mews features.

### Tasks Created

1. Create a New Reservation
2. Check In a Reservation
3. Check Out a Reservation
4. Cancel a Reservation
5. Add a Product to a Reservation
6. Correct a Closed Bill
7. Change the Reservation Owner
8. Look Up a Guest Profile

### Multilingual Support

Tasks are translated into 5 languages: English, Spanish, French, Dutch, German. Language is resolved from the property's configuration.

### Files

| File | Purpose |
|------|---------|
| `lib/task-service.ts` | Task creation orchestration |
| `lib/onboarding-tasks.ts` | 8 task definitions with translations |
| `lib/translations/` | Translation files for customer notes and tasks |

## Reset Environment

The reset operation is a 7-step process orchestrated by `lib/reset-service.ts`.

### Steps

1. **Get configuration & timezone** — Fetches enterprise timezone via `lib/timezone-service.ts`
2. **Fetch bookable services** — Gets all services via `lib/mews-data-service.ts`
3. **Get existing reservations** — Fetches Confirmed + Optional reservations only
4. **Cancel reservations** — Cancels in batches of 1000
5. **Prepare for bill closure** — Transition step
6. **Close all open bills** — Uses `lib/bill-service.ts` (fetch bills → post payments → close)
7. **Create new reservations** — Fresh 7-day window of reservations

**Note:** Started (checked-in) reservations are NOT affected by reset.

### Files

| File | Purpose |
|------|---------|
| `lib/reset-service.ts` | 7-step orchestration (750s deadline) |
| `lib/bill-service.ts` | Bill fetching, payment posting, closing |
| `types/reset.ts` | Reset types, bill types, ResetStep enum |

## Email Notifications

Sandbox login credentials are sent via the Resend email service after setup completes.

### Features

- Sends to both customer and requestor (if different)
- Branded HTML template with Mews design system colors
- Optional passwordless sign-in URL
- Non-blocking (logs errors but doesn't throw)

### Files

| File | Purpose |
|------|---------|
| `lib/email-service.ts` | Resend integration, HTML template builder |

## API Rate Limiting

The `lib/mews-rate-limiter.ts` implements a sliding window rate limiter to prevent Mews API 429 errors.

### Configuration

- **Window**: 200 requests per 30 seconds per access token
- **Throttle**: Starts queuing at 90% (180 requests)
- **Backoff**: Exponential (1s, 2s, 4s, 8s) on 429 responses
- **Retry-After**: Parses header from Mews responses

### API Call Logging

`lib/api-call-logger.ts` provides:
- `loggedFetch()` — drop-in fetch replacement that logs to ApiCallLog
- `fetchWithRateLimitAndLog()` — combines rate limiting + logging
- Batched DB writes (50 entries, 2s flush interval, max 3 concurrent writes)
- Token redaction (ClientToken, AccessToken fields)
- Response body truncation (10KB limit)
- Only reads error response bodies (saves I/O)

## Trial Duration Feature

### Available Durations

- **7 days**: Quick demos
- **30 days**: Standard trial (default)
- **60 days**: Extended evaluation

### Special Rules

- **Admin exception**: Trials created by admin emails (configured via `ADMIN_EMAILS` env var or hardcoded in `lib/admin.ts`) are set to 1 day and skip Salesforce ID requirement
- Duration utilities in `lib/duration.ts`:
  ```typescript
  type TrialDuration = 7 | 30 | 60;
  function daysToMilliseconds(days: TrialDuration): number
  function getTrialExpiryDate(startDate: Date, days: TrialDuration): Date
  ```

## Reusable Components

| Component | Purpose |
|-----------|---------|
| `components/ApiCallLogs.tsx` | Expandable API call log viewer with group filtering, success/failure stats, lazy-loaded detail |
| `components/CopyButton.tsx` | Copy-to-clipboard with toast notification |
| `components/Pagination.tsx` | Page navigation with ellipsis and "Showing X-Y of Z" |
| `components/Providers.tsx` | App-wide context providers (ToastProvider) |
| `components/SearchableSelect.tsx` | Dropdown with search/filter, keyboard navigation, click-outside close |
| `components/StatusBadge.tsx` | Status indicator badges with emojis and card styling |
| `components/Toast.tsx` | Toast notification system with auto-dismiss (3s), success/error/info types |

## Custom Hooks

### `useAdaptivePolling`

Smart polling hook that adjusts interval based on whether active operations exist.

- **Fast interval**: 5s (when operations are in progress)
- **Idle interval**: 60s (when all operations complete)
- **Tab visibility**: Pauses when hidden, fetches immediately on return
- **Error handling**: Assumes active on errors (up to 3 consecutive), then backs off
- **AbortController**: Cancels in-flight requests on cleanup

## Key Files and Their Purpose

| File | Purpose |
|------|---------|
| **Pages** | |
| `app/page.tsx` | Home redirect → `/create` |
| `app/create/page.tsx` | Trial creation form with admin auto-fill |
| `app/reset/page.tsx` | Reset sandbox (cancel reservations, close bills, recreate) |
| `app/extend/page.tsx` | Extend trial expiration date |
| `app/save/page.tsx` | Permanently remove expiration timer |
| `app/fill/page.tsx` | Demo filler — bulk reservation creation |
| `app/close-bills/page.tsx` | Close all open bills |
| `app/logs/page.tsx` | Unified log dashboard with adaptive polling |
| `app/navbar.tsx` | Burger-menu sidebar navigation |
| **API Routes** | |
| `app/api/create-trial/route.ts` | Core trial creation logic |
| `app/api/reset-environment/route.ts` | 7-step sandbox reset |
| `app/api/extend-sandbox/route.ts` | Extend trial expiration |
| `app/api/save-sandbox/route.ts` | Remove expiration timer |
| `app/api/demo-filler/route.ts` | Bulk reservation creation |
| `app/api/close-bills/route.ts` | Close open bills |
| `app/api/store-environment/route.ts` | Validate & store access token |
| `app/api/webhook/access-token/route.ts` | Webhook handler, triggers setup |
| `app/api/environments/list/route.ts` | List all sandboxes |
| `app/api/logs/route.ts` | Paginated unified logs |
| `app/api/logs/api-calls/route.ts` | API call logs for a unified log |
| `app/api/logs/api-calls/[id]/route.ts` | Single API call detail |
| `app/api/services/list/route.ts` | List bookable services |
| `app/api/salesforce-accounts/route.ts` | Deduped SF account list |
| `app/api/cleanup-stuck-logs/route.ts` | Admin cleanup of stuck logs |
| `app/api/reservations/get-all/route.ts` | Get all reservations |
| `app/api/reservations/cancel-all/route.ts` | Cancel all reservations |
| `app/api/debug/route.ts` | Database inspection |
| `app/api/test-classifications/route.ts` | Diagnostic endpoint |
| **Core Services** | |
| `lib/customer-service.ts` | Batch customer creation |
| `lib/customer-generator.ts` | Dynamic customer profile generation |
| `lib/customer-data-pools.ts` | Name/phone/email pools (27 nationalities) |
| `lib/reservation-service.ts` | Reservation creation with distributions |
| `lib/reservations.ts` | Reservation fetch/cancel utilities |
| `lib/reset-service.ts` | 7-step reset orchestration |
| `lib/bill-service.ts` | Bill fetching, payments, closing |
| `lib/task-service.ts` | Onboarding task creation |
| `lib/email-service.ts` | Resend email integration |
| **Infrastructure** | |
| `lib/unified-logger.ts` | Central logging hub for all operation types |
| `lib/api-call-logger.ts` | Batched API call logging with redaction |
| `lib/log-enrichment.ts` | Log statistics enrichment |
| `lib/mews-rate-limiter.ts` | Sliding window rate limiter |
| `lib/mews-api.ts` | Auth builder and endpoint helper |
| `lib/mews-data-service.ts` | Dynamic service/rate/category fetching |
| `lib/config.ts` | Centralized Mews API config |
| `lib/background.ts` | Vercel waitUntil wrapper |
| `lib/fetch-timeout.ts` | Fetch with AbortController timeout |
| `lib/force-log.ts` | Unbuffered stderr logging |
| **Utilities** | |
| `lib/codes.ts` | Country/language mappings (50+ countries) |
| `lib/duration.ts` | Trial duration utilities |
| `lib/timezone-service.ts` | Timezone fetching from Mews |
| `lib/validation.ts` | Input validation (email, strings, SF IDs) |
| `lib/admin.ts` | Admin email checking |
| `lib/onboarding-tasks.ts` | 8 onboarding task definitions |
| `lib/sample-customers.ts` | 100 static customer profiles |
| `lib/prisma.ts` | Prisma client singleton |
| `lib/zapier.ts` | Zapier webhook notifications |
| **Types** | |
| `types/reservations.ts` | Reservation states, Mews types |
| `types/reset.ts` | Reset types, bill types, step enum |
| `types/unified-log.ts` | Unified log types, type guards, input/update types |

## Code Conventions

### TypeScript

- Strict mode enabled
- Use path alias `@/*` for imports from root
- Define interfaces for API request/response types
- Use `Record<string, T>` for object mappings

### API Routes

- Use Next.js App Router route handlers (`route.ts`)
- Return `NextResponse.json()` with consistent response format:
  ```typescript
  { success: boolean; error?: string; ...data }
  ```
- Always include try/catch for error handling
- Long operations use `runInBackground()` from `lib/background.ts` (fire-and-forget via Vercel waitUntil)

### Components

- Client components use `'use client'` directive
- Use React hooks (`useState`, `useEffect`) for state management
- Tailwind CSS for styling with Mews design system CSS variables
- Toast notifications via `useToast()` context hook

### Prisma

- Use singleton pattern to prevent multiple client instances in development
- Access via `import { prisma } from '@/lib/prisma'`
- Uses Prisma Accelerate extension for connection pooling

## External Integrations

### Mews API

- **Demo Environment**: `https://app.mews-demo.com`
- **Sample Enterprise API**: `https://app.mews-demo.com/api/general/v1/enterprises/addSample`
- **Connector API**: `https://api.mews-demo.com/api/connector/v1/`
- **Key endpoints used**: customers/add, reservations/add, services/getAll, bills/getAll, bills/close, payments/addExternal, configuration/get, tasks/add
- Default login password for trials: `Sample123`
- Trial lifetime: 7, 30, or 60 days (configurable)
- Auth helper: `lib/mews-api.ts` — `buildMewsAuth()` and `mewsEndpoint()`
- Rate limiting: `lib/mews-rate-limiter.ts` — 200 req/30s per token

### Zapier

- Webhook integration for all notifications (Slack, CRM, etc.)
- Simple JSON payload with messageType for routing
- Configured via `ZAPIER_WEBHOOK_URL` environment variable
- Message types: trial_generation_failure, environment_ready, access_token_no_match, manual_environment_configured, manual_environment_added

### Resend (Email)

- Sends sandbox login credentials to customers and requestors
- Branded HTML templates with Mews design colors
- Configured via `RESEND_API_KEY` environment variable
- Non-blocking — logs errors but doesn't fail the operation

## Production Deployment

- Deployed on Vercel (serverless)
- Background operations use `@vercel/functions` waitUntil (750s deadline for resets)
- Webhook endpoint: `https://<your-domain>.vercel.app/api/webhook/access-token`
- Smart migration deploy: `npm run migrate:smart` (skips if schema up-to-date)

## Test Infrastructure

### Testing Framework

- **Test Runner**: Vitest with happy-dom environment
- **React Testing**: `@testing-library/react` and `@testing-library/jest-dom`
- **API Mocking**: MSW (Mock Service Worker) for HTTP request interception
- **Mock Extensions**: `vitest-mock-extended` for Prisma mocking
- **Configuration**: `vitest.config.ts`
- **Setup**: `tests/setup.ts` (global env vars)

### Test Files

| File | Purpose |
|------|---------|
| `app/api/create-trial/route.test.ts` | Trial creation endpoint (25+ tests) |
| `app/api/logs/route.test.ts` | Logs endpoint |
| `app/api/reservations/cancel-all/route.test.ts` | Cancel reservations endpoint |
| `app/api/webhook/access-token/route.test.ts` | Webhook handling |
| `hooks/useAdaptivePolling.test.ts` | Adaptive polling behavior |
| `lib/codes.test.ts` | Country/language mappings (23 tests) |
| `lib/customer-generator.test.ts` | Dynamic customer generation |
| `lib/customer-service.test.ts` | Batch customer creation |
| `lib/duration.test.ts` | Duration utilities |
| `lib/mews-data-service.test.ts` | Data fetching |
| `lib/reservation-service.test.ts` | Reservation creation |
| `lib/unified-logger.test.ts` | Unified logging |
| `lib/validation.test.ts` | Input validation |
| `lib/zapier.test.ts` | Webhook notifications |
| `tests/lib/mews-rate-limiter.test.ts` | Rate limiting |

### Running Tests

```bash
npm run test           # Run all tests once
npm run test:watch     # Watch mode
npm run test:ui        # Interactive browser UI
npm run test:coverage  # Coverage report
```

### Test Patterns

- API route tests use MSW to mock external Mews API calls
- Prisma operations mocked with `vitest-mock-extended`
- Component tests use React Testing Library
- Focus on integration tests over unit tests where practical
- Coverage goals: 80%+ unit, 70%+ integration

## Common Tasks

### Adding a New Country

1. Add entry to `countries` object in `lib/codes.ts`:
   ```typescript
   "Country Name": { LE: "XX-YYYY", Currency: "XXX", Environment: "Gross" | "Net" }
   ```

### Adding a New Language

1. Add entry to `preferredLanguage` object in `lib/codes.ts`
2. Add translation files in `lib/translations/customer-notes/` and `lib/translations/onboarding-tasks/` if needed

### Modifying the Trial Creation Process

1. Update `app/api/create-trial/route.ts`
2. Update form fields in `app/create/page.tsx` if needed
3. Update UnifiedLog fields in `prisma/schema.prisma` and `lib/unified-logger.ts` if storing new data

### Database Changes

**CRITICAL:** Schema changes and migrations MUST be in the same pull request.

1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name` to generate the migration
3. Commit BOTH the schema changes AND the generated migration files in `prisma/migrations/`
4. Update affected lib functions and API routes
5. Test the migration locally before pushing

### Resetting a Sandbox

1. Navigate to `/reset` in the UI
2. Select a sandbox from the dropdown (or manually add via access token)
3. Confirm the reset operation
4. Monitor progress on `/logs` dashboard

### Extending a Trial

1. Navigate to `/extend`
2. Select a trial sandbox (manual sandboxes are filtered out)
3. Set a new expiration date (must be in the future)
4. Confirm

### Saving a Sandbox Permanently

1. Navigate to `/save`
2. Select a trial sandbox
3. Confirm — this permanently removes the expiration timer

### Using Demo Filler

1. Navigate to `/fill`
2. Select a sandbox and service
3. Set start date, end date, and reservation count (1-500)
4. Submit — reservations are created in Confirmed state

### Closing Bills

1. Navigate to `/close-bills`
2. Select a sandbox
3. Confirm — all open bills are closed with automatic cash payments

### Debugging Operations

1. Check `/logs` dashboard for status and errors
2. Expand an operation to see API call logs
3. Click individual API calls to see request/response bodies
4. Use `/api/debug?enterpriseId=xxx` for raw database inspection
5. Use `/api/cleanup-stuck-logs` to clear stuck building/processing logs

### Adding New Trial Durations

1. Update `TrialDuration` type in `lib/duration.ts`
2. Update duration selection UI in `app/create/page.tsx`
3. Update database migrations if needed

### Modifying Reservation Distribution

1. Edit `lib/reservation-service.ts`
2. Adjust state distribution percentages
3. Test with existing sandboxes using the Demo Filler page
