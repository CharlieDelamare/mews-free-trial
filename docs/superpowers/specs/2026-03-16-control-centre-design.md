# Control Centre — Design Spec

**Date:** 2026-03-16
**Status:** Approved
**Repo:** mews-free-trial

---

## Overview

Add a `/control-centre` page to the existing `mews-free-trial` Next.js 14 app. This page ports all functionality from the `mews-automation-shared` Python/Flask app into the existing stack, reusing the established design system, components, and sandbox property selection patterns.

The Control Centre is a single page with a property selector at the top and seven tabs below. Each tab maps to a distinct feature area of the automation suite.

---

## Goals

- Port all `mews-automation-shared` features into `mews-free-trial` as a native Next.js page
- Reuse existing components (`SearchableSelect`, `StatusBadge`, `Toast`, `Pagination`, etc.)
- Reuse existing sandbox property selection (DB-backed, with `+` to add a property)
- Follow all existing code conventions (TypeScript strict, App Router, Prisma, Tailwind, Vitest + MSW)
- All API routes namespaced under `/api/control-centre/`

---

## Non-Goals

- No migration of existing data from the Python app
- No new authentication layer
- No mobile-first layout (matches existing app's desktop-first approach)

---

## Page Structure

### Route
`/control-centre` — added to the existing navbar alongside `/create`, `/reset`, `/fill`, etc.

### Layout
```
┌─────────────────────────────────────────────────┐
│ Property Selector  [SearchableSelect]  [+]       │
├─────────────────────────────────────────────────┤
│ [Dashboard] [Operations] [Scenarios] [IBE]       │
│ [OTA] [Doors] [Import]                           │
├─────────────────────────────────────────────────┤
│                                                  │
│  Tab Content Panel                               │
│                                                  │
└─────────────────────────────────────────────────┘
```

The property selector reuses the same `SearchableSelect` component and the same `/api/environments/list` endpoint already used on `/reset`, `/extend`, `/fill`, etc. The `+` button links to the existing webhook/store-environment flow.

**Tab state** is persisted in the URL as `?tab=dashboard` (default). This allows deep-linking and survives refresh, consistent with standard web conventions. The page reads `useSearchParams()` on mount and updates `router.push` on tab change — a lightweight addition with no extra dependencies.

### API request body convention

All `/api/control-centre/*` routes accept `{ enterpriseId?: string; accessToken?: string; ...params }`, matching the existing `resolveAccessToken(enterpriseId?, accessToken?)` helper used throughout the app. The property selector stores `enterpriseId`, so the UI passes `enterpriseId` — not a raw token string.

---

## Tabs

### 1. Dashboard
Displays real-time metrics for the selected property fetched from `/api/control-centre/status`.

**Metrics shown:**
- Room status breakdown: Dirty / Clean / Inspected / Out of Service / Out of Order (counts + visual bar)
- Occupancy % (checked-in guests / total rooms)
- Reservations: checked-in count, arrivals today, departures today
- Overdue task count

Auto-fetches when property changes. Manual refresh button. The route includes `export const dynamic = 'force-dynamic'` to prevent Vercel CDN caching stale dashboard data.

---

### 2. Operations
Action buttons for one-click operational tasks. Each button requires a confirmation step before firing. Results shown inline via `StatusBadge` and `Toast`.

**Actions:**
- **Morning Prep** — Updates check-in/checkout times for all in-house reservations to hardcoded defaults (`checkInTime: "07:30:00"`, `checkOutTime: "06:00:00"`) then inspects all rooms. These defaults match the Python implementation (`fix_times_and_inspect.py`); they are not user-configurable.
- **Inspect All Rooms** — Sets all Dirty and Clean rooms to Inspected
- **Close Overdue Tasks** — Marks all overdue tasks as completed
- **Auto-Checkout** — Processes all guests due for departure today

---

### 3. Scenarios
Six scenario cards for provisioning realistic demo reservation data.

| Scenario | Guests | Stay | Price/night |
|---|---|---|---|
| Individual Travelers | 25 | 1–4 nights | €89–249 |
| Groups & Blocks | 20 | 2–4 nights | group rate |
| Hostel / Budget | 40 | 1–2 nights | €15–45 |
| Long-Stay / Extended | 8 | 7–30 nights | €55–95 |
| Package-Heavy | 15 | 2–5 nights | €120–220 |
| Multi-Service | 12 | 2–4 nights | varies |

Each card shows: description, guest count, stay/price range, and a "Provision" button. Provisioning shows a progress indicator with success/failure counts. Tracked in `ControlCentreLog`.

---

### 4. IBE (Internet Booking Engine)
Five themed booking engine experiences. Each theme is a **visual skin** applied over the user's currently selected sandbox property. No hardcoded internal properties are used — the selected `enterpriseId` from the property selector drives all IBE searches and bookings.

| Theme | Display Name | Markup |
|---|---|---|
| luxury | The Grand Maison | 30% |
| city | Metro Central Hotel | 20% |
| resort | Azure Bay Resort & Spa | 35% |
| conference | Congress Park Hotel | 25% |
| budget | NomadNest | 40% |

The tab shows five theme cards. Clicking a theme navigates to `/control-centre/ibe/[theme]?enterpriseId=<id>` — a full-page standalone themed booking experience (no main navbar or tab layout). The `enterpriseId` is passed as a query param so the sub-page can resolve the access token independently.

**IBE sub-page flow:**
1. Room/rate search form (calls `/api/control-centre/ibe/search` with `{ enterpriseId, theme, checkIn, checkOut, adults, children }`)
2. Results list with themed pricing (base rate × markup per theme)
3. Booking form → calls `/api/control-centre/ibe/book`

Sessions tracked in `IbeSession` model for auditing.

---

### 5. OTA Simulation
Simulates bookings arriving from OTA channels with source tracking.

**Controls:**
- Channel selector (Booking.com, Expedia, Airbnb, Direct, Other)
- Booking parameters (dates, room type, guest count)
- "Simulate Booking" button

Results shown inline. Fire-and-forget — no persistence.

---

### 6. Doors (Vostio Integration)
The Vostio door mapping is tied to a specific set of physical room names (`0212`, `0201`, etc.) that only exist on the **Mews Hotel TradeShow** demo property. This tab is therefore only functional when that specific property is selected.

**Behaviour:**
- When the selected property is not the Mews Hotel TradeShow sandbox: tab shows a disabled state with an explanatory message ("Door management is only available for the Mews Hotel TradeShow property").
- When the correct property is selected: full functionality is available.

**Views (active state):**
- Door assignments table (room → door group mapping)
- "Provision Doors" button (creates assignments for all mapped rooms)
- "Recover Split Reservations" button (reassigns doors after split-night bookings)

The TradeShow property's `enterpriseId` is stored as an environment variable (`VOSTIO_ENTERPRISE_ID`) so the page can detect when it is selected. Results shown inline via `StatusBadge`. No DB persistence for door operations.

---

### 7. Import
Bulk CSV reservation import.

**CSV schema (semicolon-delimited):**
`FirstName; LastName; Email; CheckIn; CheckOut; Adults; Children; PricePerNight; Notes`

- `RoomCategory` and `RateName` are auto-discovered from the property (matching the Python implementation's `discover_ids()` approach — no manual lookup required). If these columns appear in an uploaded file (as in the Python `example_reservations.csv`), they are accepted and silently ignored.
- `PricePerNight` is optional; if omitted, the property's default rate pricing applies.

**Batching behaviour (enhancement over the Python implementation):**
- The Python app hard-caps at 166 rows and returns an error for larger files. This implementation removes that cap: files of any size are supported. Rows are processed in sequential batches of 166 (the Mews API hard limit per request).
- A progress bar tracks batch completion (e.g. "Batch 2 of 4 — 87 / 166 succeeded").
- Partial failures within a batch are reported per-row in the results table.
- The full import is tracked as a single `ControlCentreLog` entry.

**Flow:**
1. Drag-and-drop or file picker for semicolon-delimited CSV
2. Preview parsed rows in a table (first 10 rows shown)
3. Validation errors highlighted inline before submission
4. "Import" button triggers batched creation
5. Progress bar with per-batch and total success/failure counts

---

## API Routes

All routes under `/api/control-centre/`. All accept `{ enterpriseId?: string; accessToken?: string; ...params }` in the POST body.

| Route | Method | Purpose | Vercel Timeout |
|---|---|---|---|
| `/api/control-centre/status` | POST | Dashboard metrics | default |
| `/api/control-centre/inspect` | POST | Set rooms → Inspected | default |
| `/api/control-centre/morning-prep` | POST | Times + inspect | 800s |
| `/api/control-centre/close-overdue-tasks` | POST | Complete overdue tasks | default |
| `/api/control-centre/auto-checkout` | POST | Process departures | 800s |
| `/api/control-centre/scenario-provision` | POST | Create scenario reservations | 800s |
| `/api/control-centre/ibe/search` | POST | Room/rate availability | default |
| `/api/control-centre/ibe/book` | POST | Create IBE reservation | default |
| `/api/control-centre/ota-simulate` | POST | Simulate OTA booking | default |
| `/api/control-centre/doors` | POST | Get door assignments | default |
| `/api/control-centre/doors/provision` | POST | Create door assignments | 800s |
| `/api/control-centre/doors/recover-split` | POST | Reassign doors post-split | default |
| `/api/control-centre/import` | POST | Bulk CSV import | 800s |

Long-running routes added to `vercel.json`:
```json
{
  "functions": {
    "app/api/control-centre/morning-prep/route.ts": { "maxDuration": 800 },
    "app/api/control-centre/auto-checkout/route.ts": { "maxDuration": 800 },
    "app/api/control-centre/scenario-provision/route.ts": { "maxDuration": 800 },
    "app/api/control-centre/doors/provision/route.ts": { "maxDuration": 800 },
    "app/api/control-centre/import/route.ts": { "maxDuration": 800 }
  }
}
```

---

## Data Models

Two new Prisma models. All other operations (Operations, OTA, Doors) are fire-and-forget.

### `ControlCentreLog`
Tracks long-running operations (scenario provisioning, CSV import).

```prisma
model ControlCentreLog {
  id               Int       @id @default(autoincrement())
  accessTokenId    Int
  enterpriseId     String
  operationType    String    // scenario_provision | csv_import
  scenarioType     String?   // individual | groups | hostel | long_stay | packages | multi_service
  status           String    // pending | processing | completed | failed
  totalItems       Int       @default(0)
  successCount     Int       @default(0)
  failureCount     Int       @default(0)
  errorMessage     String?
  operationDetails Json?
  createdAt        DateTime  @default(now())
  completedAt      DateTime?

  @@index([accessTokenId])
  @@index([enterpriseId])
  @@index([createdAt])
  @@index([operationType])
}
```

### `IbeSession`
Tracks IBE booking attempts for auditing.

```prisma
model IbeSession {
  id              Int       @id @default(autoincrement())
  accessTokenId   Int
  enterpriseId    String
  theme           String    // luxury | city | resort | conference | budget
  roomCategoryId  String?
  rateId          String?
  checkIn         DateTime?
  checkOut        DateTime?
  adults          Int       @default(1)
  children        Int       @default(0)
  status          String    // searched | booked | failed
  reservationId   String?
  totalPrice      Float?
  currency        String?
  createdAt       DateTime  @default(now())

  @@index([accessTokenId])
  @@index([enterpriseId])
  @@index([createdAt])
}
```

---

## File Structure

```
app/
  control-centre/
    page.tsx                        # Main tabbed page (client component, ?tab= URL state)
    ibe/
      [theme]/
        page.tsx                    # Standalone themed IBE booking page
app/api/
  control-centre/
    status/route.ts                 # force-dynamic
    inspect/route.ts
    morning-prep/route.ts
    close-overdue-tasks/route.ts
    auto-checkout/route.ts
    scenario-provision/route.ts
    ibe/
      search/route.ts
      book/route.ts
    ota-simulate/route.ts
    doors/
      route.ts
      provision/route.ts
      recover-split/route.ts
    import/route.ts
components/
  control-centre/
    DashboardTab.tsx
    OperationsTab.tsx
    ScenariosTab.tsx
    IbeTab.tsx
    OtaTab.tsx
    DoorsTab.tsx
    ImportTab.tsx
lib/
  control-centre/
    scenario-service.ts             # Scenario provisioning logic
    ibe-service.ts                  # IBE search + booking + markup logic
    ota-service.ts                  # OTA simulation logic
    door-service.ts                 # Door assignment logic
    csv-parser.ts                   # CSV parsing + validation + batching
    dashboard-service.ts            # Metrics aggregation
    operations-service.ts           # Inspect, morning-prep, checkout logic
prisma/
  schema.prisma                     # + ControlCentreLog + IbeSession models
  migrations/
    [new migration]
types/
  control-centre.ts                 # Shared TypeScript types
```

---

## Testing Strategy

Follows existing app conventions (Vitest + MSW + React Testing Library, 30% coverage threshold).

**Unit tests (`lib/control-centre/`):**
- `csv-parser.ts` — valid rows, malformed rows, batch splitting at 166-row limit, multi-batch files, optional `PricePerNight`
- `scenario-service.ts` — guest distribution, date ranges, price ranges per scenario
- `ibe-service.ts` — markup pricing calculation per theme
- `dashboard-service.ts` — metrics aggregation from Mews API responses

**Integration tests (MSW, `app/api/control-centre/`):**
- `status/route.ts` — mocked Mews responses → correct metric shape
- `scenario-provision/route.ts` — full provision flow with mocked Mews calls → correct `ControlCentreLog` entry
- `import/route.ts` — CSV payload → batch creation → response shape, multi-batch progress

**Component tests (React Testing Library):**
- Tab switching updates `?tab=` URL param and renders correct panel
- Property selector change triggers data refetch
- Operations buttons show confirm step before firing
- Doors tab shows disabled state when non-TradeShow property is selected
- Progress indicators update on polling

**Excluded from tests:**
- IBE sub-page visual rendering
- Door/Vostio external API calls (mocked at MSW level)

---

## Dependencies

No new npm packages required. All needed utilities already exist in the repo:
- Mews API client patterns (`lib/mews-api.ts`, `lib/mews-rate-limiter.ts`)
- Customer/reservation generation (`lib/customer-generator.ts`, `lib/reservation-service.ts`)
- Logging (`lib/unified-logger.ts`, `lib/api-call-logger.ts`)
- Prisma client (`lib/prisma.ts`)
- Token resolution (`resolveAccessToken` in `lib/reservations.ts`)

---

## Environment Variables

One new environment variable for the Doors tab feature detection:

```
VOSTIO_ENTERPRISE_ID=<enterprise-id-of-mews-hotel-tradeshow-sandbox>
```

All other variables (`MEWS_CLIENT_TOKEN`, `MEWS_API_URL`, per-sandbox `accessToken` from DB) are unchanged.
