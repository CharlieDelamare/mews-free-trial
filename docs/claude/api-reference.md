# API Reference

All routes return `{ success: boolean; error?: string; ...data }`.

## POST `/api/create-trial`

```typescript
{
  requestorEmail: string;
  firstName: string;
  lastName: string;
  customerEmail: string;
  preferredLanguage: string;    // e.g., "English (UK)"
  propertyName: string;
  propertyCountry: string;      // e.g., "United Kingdom"
  propertyType: 'hotel' | 'hostel' | 'apartments';
  durationDays: 7 | 30 | 60;   // default: 30
  salesforceAccountId?: string; // required unless admin email
  roomCount?: number;
  dormCount?: number;           // hostels only
  apartmentCount?: number;
  bedCount?: number;            // beds per dorm
}
```

Flow: addSample API → webhook → 100 customers → reservations → 8 tasks → email → Zapier

## POST `/api/reset-environment`

```typescript
{ enterpriseId?: string; accessToken?: string; }  // one required
```

7 steps: config/timezone → services → fetch reservations → cancel → prep bills → close bills → new reservations. Started (checked-in) reservations are NOT cancelled.

## POST `/api/extend-sandbox`

```typescript
{ enterpriseId: string; newExpirationUtc: string; }  // ISO 8601, must be future
```

## POST `/api/save-sandbox`

```typescript
{ enterpriseId: string; }
```

## POST `/api/demo-filler`

```typescript
{
  enterpriseId: string;
  startDate: string;         // ISO date, today or future
  endDate: string;           // ISO date, 3+ day range required
  reservationCount: number;  // 1-500, default 20
  serviceId?: string;        // auto-detected if omitted
}
```

## POST `/api/close-bills`

```typescript
{ enterpriseId: string; }
```

Flow: fetch order items → post external cash payments → close bills.

## POST `/api/store-environment`

```typescript
{ accessToken: string; }
```

Validates token against Mews API and stores the environment. Use to manually add a sandbox before webhook arrives.

## POST `/api/services/list`

```typescript
{ enterpriseId: string; }
```

## GET `/api/logs`

Params: `page` (default 1), `pageSize` (default 20). Returns `{ success, logs, total, hasActiveOperations }`.

## GET `/api/logs/api-calls`

Params: `logId` (required), `group` (optional), `limit` (default 2000), `offset`.

## GET `/api/logs/api-calls/[id]`

Full detail of a single API call log including request/response bodies.

## GET `/api/environments/list`

Lists all available trial sandboxes.

## POST `/api/reservations/get-all` / `cancel-all`

Both accept `{ enterpriseId: string }`.

## POST `/api/salesforce-accounts`

Returns deduplicated list of Salesforce Account IDs with property details.

## POST `/api/cleanup-stuck-logs`

Admin. Deletes stuck logs (building/processing) and associated API call logs.

## POST/GET `/api/webhook/access-token`

- **POST**: Receives Mews access token webhooks. Triggers customer/reservation/task creation in background.
- **GET**: Returns stored tokens. Optional `enterpriseId` query param.

## GET `/api/cleanup-stale-sandboxes`

Cron-triggered (Mon 8am UTC via `vercel.json`). Checks all stored sandboxes against the Mews API — removes `AccessToken` records for dead/expired enterprises. Returns `{ checked, removed, errors }`.

## Control Centre (`/api/control-centre/*`)

All routes accept `{ enterpriseId: string }` unless noted.

| Route | Method | Purpose |
|-------|--------|---------|
| `status` | GET | Sandbox health check (reservation counts, bill state) |
| `morning-prep` | POST | Run morning prep workflow (checkout overdue, close bills) |
| `auto-checkout` | POST | Auto-checkout reservations past departure |
| `close-overdue-tasks` | POST | Close onboarding tasks past due date |
| `inspect` | POST | Inspect full sandbox state |
| `ota-simulate` | POST | Simulate an OTA channel booking |
| `scenario-provision` | POST | Provision a named demo scenario |
| `scenario-status` | GET | Poll scenario provision job status (`?jobId=`) |
| `doors` | POST | Provision door lock demo data |
| `ibe` | POST | Simulate an IBE booking (`theme`, `checkIn`, `checkOut`, `guestCount`) |

## Research

### POST `/api/research/search`

```typescript
{ query: string; city?: string; checkIn?: string; checkOut?: string; }
```

Returns hotel list from SerpApi + LiteAPI enrichment. Requires `SERPAPI_API_KEY` and `LITEAPI_API_KEY`.

### GET `/api/research/hotel/[id]`

Returns detailed hotel data including pricing for a specific LiteAPI hotel ID.

## ROI Presentations

### GET `/api/roi-presentations`

Returns all saved ROI presentations for the current user (filtered by `createdBy`).

### POST `/api/roi-presentations`

```typescript
{ name: string; salesforceAccountId?: string; country: string; hotelType: string; numberOfRooms: number; stateJson: object; createdBy?: string; }
```

Creates a new persisted ROI presentation. Returns `{ id, ...presentation }`.

### GET `/api/roi-presentations/[id]`

Returns a single ROI presentation by ID.

### PUT `/api/roi-presentations/[id]`

Updates an existing presentation. Accepts partial state (same shape as POST body).

## GET `/api/debug`

Params: `enterpriseId` (optional), `limit` (optional). Raw database inspection.

## GET `/api/test-classifications`

Diagnostic: tests if customer classifications/notes persist in Mews demo API.
