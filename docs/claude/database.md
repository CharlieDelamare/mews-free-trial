# Database Schema

**Primary table:** `UnifiedLog` — all operation types. Legacy tables retained for historical data.

See `prisma/schema.prisma` for authoritative source.

## UnifiedLog (primary)

```prisma
model UnifiedLog {
  id              String    @id @default(cuid())
  logType         String    // 'environment' | 'reset' | 'demo_filler' | 'close_bills'
  timestamp       DateTime  @default(now())
  enterpriseId    String?
  status          String    // 'building' | 'processing' | 'completed' | 'failed'
  completedAt     DateTime?
  errorMessage    String?   @db.Text

  // Environment-specific
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

  // Reset-specific
  currentStep       Int?
  totalSteps        Int?

  // Shared
  accessTokenId       Int?
  totalItems          Int?
  successCount        Int?
  failureCount        Int?
  operationDetails    Json?
}
```

## ApiCallLog

```prisma
model ApiCallLog {
  id            Int      @id @default(autoincrement())
  unifiedLogId  String
  timestamp     DateTime @default(now())
  endpoint      String   // e.g., "customers/add"
  method        String   @default("POST")
  url           String
  group         String   // "initial"|"setup"|"customers"|"reservations"|"state_transitions"|"tasks"|"bills"
  statusCode    Int?
  durationMs    Int
  success       Boolean  @default(true)
  requestBody   String?  @db.Text
  responseBody  String?  @db.Text
  errorMessage  String?
  metadata      Json?
}
```

## AccessToken

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

## IbeSession

```prisma
model IbeSession {
  id             String    @id @default(cuid())
  enterpriseId   String
  theme          String    // 'luxury' | 'city' | 'resort' | 'conference' | 'budget'
  reservationId  String?
  checkIn        String
  checkOut       String
  guestCount     Int
  totalPrice     Float?
  status         String    // 'searching' | 'booked' | 'failed'
  createdAt      DateTime  @default(now())
  completedAt    DateTime?
  metadata       Json?
}
```

Used by Control Centre IBE simulation to track booking attempts per sandbox.

## RoiPresentation

```prisma
model RoiPresentation {
  id                  String   @id @default(uuid())
  name                String
  salesforceAccountId String?
  country             String
  hotelType           String
  numberOfRooms       Int      @default(0)
  totalAnnualSavings  Float    @default(0)
  createdBy           String?
  stateJson           Json     // full ROI calculator state
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

Used by ROI Calculator to persist and share presentations. `stateJson` holds the full calculator state blob — managed via `lib/roi-calculator/utils/persistence.ts`.

## Legacy Tables (historical data only)

- `EnvironmentLog` — original trial creation log
- `CustomerCreationLog` — tracks batch customer creation per enterprise
- `ReservationCreationLog` — tracks reservation creation (`operationType`: 'automatic' | 'demo_filler')
- `TaskCreationLog` — tracks onboarding task creation
- `ResetOperationLog` — tracks 7-step reset operations

## Logging Infrastructure

- **`lib/unified-logger.ts`**: Creates/updates logs for all operation types
- **`lib/api-call-logger.ts`**: `loggedFetch()` and `fetchWithRateLimitAndLog()` — batched writes (50 entries, 2s flush), token redaction, 10KB response truncation
- **`lib/log-enrichment.ts`**: Enriches logs with customer/reservation stats for dashboard
- **`types/unified-log.ts`**: Type guards — `isEnvironmentLog()`, `isResetLog()`, etc.
