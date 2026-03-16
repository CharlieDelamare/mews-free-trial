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

Tab state is managed with `useState` in the page client component. No URL param needed for tab — the page is a single-session tool.

---

## Tabs

### 1. Dashboard
Displays real-time metrics for the selected property fetched from `/api/control-centre/status`.

**Metrics shown:**
- Room status breakdown: Dirty / Clean / Inspected / Out of Service / Out of Order (counts + visual bar)
- Occupancy % (checked-in guests / total rooms)
- Reservations: checked-in count, arrivals today, departures today
- Overdue task count

Auto-fetches when property changes. Manual refresh button.

---

### 2. Operations
Action buttons for one-click operational tasks. Each button requires a confirmation step before firing. Results shown inline via `StatusBadge` and `Toast`.

**Actions:**
- **Morning Prep** — Updates check-in/checkout times for all reservations + inspects all rooms
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

Each card shows: description, guest count, stay/price range, and a "Provision" button. Provisioning shows a progress indicator with success/failure counts. Reuses `ControlCentreLog` for tracking.

---

### 4. IBE (Internet Booking Engine)
Five themed booking engine experiences, each wired to the selected property.

| Theme | Property Name | Markup |
|---|---|---|
| Luxury | The Grand Maison | 30% |
| City | Metro Central Hotel | 20% |
| Resort | Azure Bay Resort & Spa | 35% |
| Conference | Congress Park Hotel | 25% |
| Budget | NomadNest | 40% |

The tab shows five theme cards. Clicking a theme opens `/control-centre/ibe/[theme]` — a full-page themed booking experience with:
- Custom color scheme and hero messaging
- Room/rate search (calls `/api/control-centre/ibe/search`)
- Full booking form (calls `/api/control-centre/ibe/book`)

IBE sub-pages are separate Next.js routes under `app/control-centre/ibe/[theme]/page.tsx`. They do not include the main navbar or tab layout — they render as standalone booking pages.

Sessions tracked in `IbeSession` model for auditing.

---

### 5. OTA Simulation
Simulates bookings arriving from OTA channels with source tracking.

**Controls:**
- Channel selector (Booking.com, Expedia, Airbnb, Direct, Other)
- Booking parameters (dates, room type, guest count)
- "Simulate Booking" button

Results shown inline. No persistence — fire-and-forget against the Mews API.

---

### 6. Doors (Vostio Integration)
Manages locker/door assignments for the selected property.

**Views:**
- Door assignments table (room → door group mapping)
- "Provision Doors" button (creates assignments for all rooms)
- "Recover Split Reservations" button (reassigns doors after split-night bookings)

Results shown inline via `StatusBadge`. No persistence.

---

### 7. Import
Bulk CSV reservation import.

**Flow:**
1. Drag-and-drop or file picker for semicolon-delimited CSV
2. Preview parsed rows in a table (first 10 rows shown)
3. Validation errors highlighted inline
4. "Import" button triggers batch creation (max 166/batch, Mews API limit)
5. Progress bar with success/failure counts
6. Tracked in `ControlCentreLog` model

**CSV schema:**
`FirstName, LastName, Email, CheckIn, CheckOut, Adults, Children, RoomCategory, RateName, Notes`

---

## API Routes

All routes under `/api/control-centre/`. All accept `{ accessToken: string, ...params }` in the POST body, consistent with existing app conventions.

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

Long-running routes (800s) added to `vercel.json` alongside existing extended-timeout routes.

---

## Data Models

Two new Prisma models. All other operations are stateless (fire-and-forget).

### `ControlCentreLog`
Tracks long-running operations (scenario provisioning, CSV import, OTA simulation).

```prisma
model ControlCentreLog {
  id               String    @id @default(cuid())
  accessTokenId    String
  operationType    String    // scenario_provision | csv_import | ota_simulate
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
  @@index([createdAt])
  @@index([operationType])
}
```

### `IbeSession`
Tracks IBE booking attempts for auditing.

```prisma
model IbeSession {
  id              String   @id @default(cuid())
  accessTokenId   String
  theme           String   // luxury | city | resort | conference | budget
  roomCategoryId  String?
  rateId          String?
  checkIn         DateTime?
  checkOut        DateTime?
  adults          Int      @default(1)
  children        Int      @default(0)
  status          String   // searched | booked | failed
  reservationId   String?
  totalPrice      Float?
  currency        String?
  createdAt       DateTime @default(now())

  @@index([accessTokenId])
  @@index([createdAt])
}
```

---

## File Structure

```
app/
  control-centre/
    page.tsx                        # Main tabbed page (client component)
    ibe/
      [theme]/
        page.tsx                    # Standalone themed IBE booking page
app/api/
  control-centre/
    status/route.ts
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
    ibe-service.ts                  # IBE search + booking logic
    ota-service.ts                  # OTA simulation logic
    door-service.ts                 # Door assignment logic
    csv-parser.ts                   # CSV parsing + validation
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
- `csv-parser.ts` — valid rows, malformed rows, batch splitting at 166-reservation limit
- `scenario-service.ts` — guest distribution, date ranges, price ranges per scenario
- `ibe-service.ts` — markup pricing calculation per theme
- `dashboard-service.ts` — metrics aggregation from Mews API responses

**Integration tests (MSW, `app/api/control-centre/`):**
- `status/route.ts` — mocked Mews responses → correct metric shape
- `scenario-provision/route.ts` — full provision flow with mocked Mews calls → correct log entry
- `import/route.ts` — CSV payload → batch creation → response shape

**Component tests (React Testing Library):**
- Tab switching renders correct panel
- Property selector change triggers data refetch
- Operations buttons show confirm step before firing
- Progress indicators update on polling

**Excluded from tests:**
- IBE iframe/sub-page rendering (visual, no logic to unit test)
- Door/Vostio integration (external system, no sandbox)

---

## Dependencies

No new npm packages required. All needed utilities already exist in the repo:
- Mews API client patterns (`lib/mews-api.ts`, `lib/mews-rate-limiter.ts`)
- Customer/reservation generation (`lib/customer-generator.ts`, `lib/reservation-service.ts`)
- Logging (`lib/unified-logger.ts`, `lib/api-call-logger.ts`)
- Prisma client (`lib/prisma.ts`)

---

## Environment Variables

No new environment variables. The control centre uses the same `MEWS_CLIENT_TOKEN`, `MEWS_API_URL`, and per-sandbox `accessToken` from the DB as the rest of the app.
