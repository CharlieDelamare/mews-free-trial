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

## GET `/api/debug`

Params: `enterpriseId` (optional), `limit` (optional). Raw database inspection.

## GET `/api/test-classifications`

Diagnostic: tests if customer classifications/notes persist in Mews demo API.
