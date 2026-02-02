# CLAUDE.md

This document provides an overview of the Mews Free Trial application for AI assistants working on this codebase.

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

## Project Overview

**Mews Free Trial** is a Next.js web application that allows Mews sales representatives to create trial hotel environments (7, 30, or 60 days) in the Mews demo system. The app integrates with the Mews API to provision sample hotels with automatic customer and reservation creation, stores environment logs in PostgreSQL, and sends notifications via Zapier webhooks.

### Key Features

- **Flexible trial durations**: Create 7, 30, or 60-day trial environments
- **Customizable property types**: Hotels, hostels, and apartments with configurable room/apartment counts
- **50+ country support**: Proper legal environment, currency, and tax configurations
- **Automatic customer creation**: 100 diverse sample customers added to each trial
- **Automatic reservation creation**: Realistic reservations with intelligent distribution across property lifecycle
- **Manual environment management**: Reset tab for adding existing environments via access token
- **Real-time environment tracking**: Auto-refreshing dashboard with status updates (building → Updating → completed)
- **Reservation management**: Get and cancel all reservations for any environment
- **Dynamic Mews data fetching**: Services, rates, and categories fetched automatically (no hardcoded IDs)
- **Webhook integration**: Receive and process access tokens from Mews
- **Zapier notifications**: Trial creation, environment setup, and CRM integration
- **Comprehensive testing**: Vitest test suite with API mocking and React Testing Library
- **Debug tools**: Database inspection endpoint for troubleshooting

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Runtime**: Node.js
- **Deployment**: Render (standalone output mode)

## Project Structure

```
mews-free-trial-2/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── add-environment/      # POST - Manually add environment via access token
│   │   ├── create-trial/         # POST - Create trial environment
│   │   ├── create-reservation/   # POST - Create reservation (alternate flow)
│   │   ├── debug/                # GET - Debug database inspection
│   │   ├── environments/
│   │   │   └── list/             # GET - List all environments
│   │   ├── logs/                 # GET - Retrieve environment logs
│   │   ├── reservations/
│   │   │   ├── cancel-all/       # POST - Cancel all reservations
│   │   │   └── get-all/          # POST - Get all reservations
│   │   └── webhook/
│   │       └── access-token/     # POST/GET - Webhook for access tokens
│   ├── logs/                     # Environment logs page
│   │   └── page.tsx
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main form page (with reset tab)
├── lib/                          # Shared utilities
│   ├── codes.ts                  # Country/language code mappings
│   ├── customer-service.ts       # Automatic customer creation service
│   ├── duration.ts               # Trial duration utilities (7, 30, 60 days)
│   ├── logger.ts                 # Environment log functions
│   ├── mews-data-service.ts      # Dynamic Mews data fetching service
│   ├── prisma.ts                 # Prisma client singleton
│   ├── reservation-service.ts    # Automatic reservation creation service
│   ├── sample-customers.ts       # 100 predetermined customer profiles
│   └── zapier.ts                 # Zapier webhook notification utility
├── types/
│   └── reservations.ts           # TypeScript types for reservation operations
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
├── scripts/
│   └── migrate-deploy.js         # Production migration script
├── .env.example                  # Environment variable template
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts              # Vitest test configuration
└── WEBHOOK_SETUP.md              # Webhook documentation
```

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

# Generate Prisma client (runs automatically on postinstall)
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Deploy migrations to production
npx prisma migrate deploy
```

## Environment Variables

Required variables (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `MEWS_SAMPLE_TOKEN` | Token for creating sample enterprises via addSample API |
| `MEWS_CLIENT_TOKEN` | Client token for Mews Connector API |
| `MEWS_ACCESS_TOKEN` | Access token for Mews Connector API (for manual operations) |
| `MEWS_API_URL` | Mews API base URL (default: https://api.mews-demo.com) |

Optional:

| Variable | Description |
|----------|-------------|
| `ZAPIER_WEBHOOK_URL` | Zapier webhook for all notifications (Slack, CRM, etc.) |
| `MEWS_BOOKABLE_SERVICE_ID` | Service ID for reservations (deprecated - now fetched dynamically) |
| `MEWS_RATE_ID` | Rate ID for reservations (deprecated - now fetched dynamically) |
| `MEWS_RESOURCE_CATEGORY_ID` | Resource category for reservations (deprecated - now fetched dynamically) |
| `NEXT_PUBLIC_BASE_URL` | Base URL for the application (used in reservation flows) |

**Note:** Service IDs, Rate IDs, and Resource Category IDs are now fetched dynamically from the Mews API using `lib/mews-data-service.ts` rather than requiring environment variables.

## API Endpoints

### POST `/api/create-trial`

Creates a new trial hotel environment in the Mews demo system with automatic customer and reservation creation.

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
  durationDays: 7 | 30 | 60;    // Trial duration (default: 30)
  salesforceAccountId?: string; // Optional Salesforce account ID
  // Property-specific counts:
  roomCount?: number;           // For hotels/hostels
  dormCount?: number;           // For hostels only
  apartmentCount?: number;      // For apartments
  bedCount?: number;            // Beds per dorm (hostels)
}
```

**Response:** Returns login URL, email, and default password on success.

**Process Flow:**
1. Creates enterprise via Mews addSample API
2. Logs status as "building" in database
3. Mews sends webhook with access token
4. Status updated to "Updating"
5. Automatically creates 100 customers
6. Automatically creates realistic reservations
7. Status updated to "completed"
8. Sends Zapier notifications

### POST `/api/add-environment`

Manually adds an existing trial environment to the system using an access token from Mews.

**Request Body:**
```typescript
{
  accessToken: string;      // Access token from Mews
  enterpriseId: string;     // Enterprise/hotel ID
  salesforceAccountId?: string;
}
```

**Use Case:** For environments created outside the main flow that need to be tracked in the logs.

### POST `/api/create-reservation`

Creates a customer and reservation in an existing Mews property.

**Request Body:**
```typescript
{
  accessToken: string;
  firstName: string;
  lastName: string;
  email: string;
  // ... additional reservation details
}
```

### GET `/api/logs`

Returns all environment creation logs from the database, sorted by timestamp (newest first).

**Response:**
```typescript
{
  success: boolean;
  logs: EnvironmentLog[];
}
```

**Note:** Caching is disabled on this endpoint to ensure real-time data.

### GET `/api/environments/list`

Lists all available trial environments with their details.

**Response:**
```typescript
{
  success: boolean;
  environments: Array<{
    enterpriseId: string;
    enterpriseName: string;
    accessToken: string;
    loginUrl: string;
    loginEmail: string;
    propertyType: string;
    // ... additional fields
  }>;
}
```

### POST `/api/reservations/get-all`

Retrieves all reservations for a specific environment.

**Request Body:**
```typescript
{
  accessToken: string;
  enterpriseId: string;
}
```

### POST `/api/reservations/cancel-all`

Cancels all reservations in a specific environment.

**Request Body:**
```typescript
{
  accessToken: string;
  enterpriseId: string;
}
```

### GET `/api/debug`

Debug endpoint for inspecting database records.

**Query Parameters:**
- `enterpriseId` (optional): Filter by enterprise ID
- `limit` (optional): Limit number of results

### POST/GET `/api/webhook/access-token`

- **POST**: Receives access token webhooks from Mews when hotels are created. Triggers automatic customer and reservation creation in background.
- **GET**: Retrieves stored access tokens (optional `enterpriseId` query param)

**Note:** Caching is disabled on this endpoint to ensure webhook reliability.

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
}
```

### EnvironmentLog

Tracks created trial environments with complete configuration details:

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
  requestorEmail      String?  // Sales rep who created the trial
  durationDays        Int?     // Trial duration: 7, 30, or 60 days
  roomCount           Int?     // Number of hotel/hostel rooms
  dormCount           Int?     // Number of hostel dorms
  apartmentCount      Int?     // Number of apartments
  bedCount            Int?     // Beds per dorm (hostels)
  timezone            String?  // IANA timezone from Mews API
  salesforceAccountId String?  // Salesforce account ID
}
```

**Status Lifecycle:**
1. `building` - Initial creation via addSample API
2. `Updating` - Webhook received, customer/reservation creation in progress
3. `completed` - All setup finished successfully
4. `failure` - Error occurred during creation

### CustomerCreationLog

Tracks automatic creation of sample customers in trial environments:

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
  errorSummary    String?
  customerResults Json?    // Array of individual customer results
}
```

### ReservationCreationLog

Tracks automatic creation of sample reservations in trial environments:

```prisma
model ReservationCreationLog {
  id                Int      @id @default(autoincrement())
  enterpriseId      String
  accessTokenId     Int
  totalReservations Int
  successCount      Int
  failureCount      Int
  startedAt         DateTime @default(now())
  completedAt       DateTime?
  status            String   // 'processing' | 'completed' | 'failed'
  errorSummary      String?
  reservationResults Json?   // Array of individual reservation results
}
```

## Automatic Customer Creation

When a trial environment is created, 100 sample customer profiles are automatically added to the Mews demo environment after the webhook access token is received.

### Process Flow

1. Trial created via `/api/create-trial`
2. Mews sends webhook to `/api/webhook/access-token` with access token
3. Webhook triggers automatic customer creation in background (fire-and-forget)
4. 100 predetermined customers created via Mews Connector API
5. Results logged to `CustomerCreationLog` database table

### Customer Profiles

- **Static list** of 100 diverse customers (same every time, not randomly generated)
- **Full profiles** including: name, email, phone, birth date, nationality, language, gender, title, company
- **Mix**: 70% personal travelers, 30% business travelers
- **Diversity**: 20+ nationalities represented (GB, US, FR, DE, IT, ES, PL, SE, PT, CZ, etc.)
- **Realistic data**: Hand-crafted profiles with appropriate email domains and phone numbers

### Technical Details

- **Endpoint**: `https://api.mews-demo.com/api/connector/v1/customers/add`
- **Client Token**: `B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0` (hardcoded)
- **Access Token**: Received from webhook (enterprise-specific)
- **Concurrency**: 5 customers processed at a time
- **Duration**: ~20-30 seconds for all 100 customers
- **Error Handling**: Continues processing even if some fail; tracks individual results
- **No retries**: Failures are logged but not automatically retried

### Files

| File | Purpose |
|------|---------|
| `lib/sample-customers.ts` | 100 predetermined customer profiles |
| `lib/customer-service.ts` | Batch processing logic, Mews API integration |
| `app/api/webhook/access-token/route.ts` | Triggers customer creation after token receipt |

### Database Tracking

All customer creation attempts are logged in the `CustomerCreationLog` table with:
- Total customers attempted
- Success/failure counts
- Individual results (stored as JSON)
- Start and completion timestamps
- Status tracking (processing → completed/failed)

## Automatic Reservation Creation

After customers are created, realistic sample reservations are automatically added to populate the trial environment with booking data.

### Process Flow

1. Customer creation completes successfully
2. Reservation service automatically triggers (fire-and-forget)
3. Fetches property configuration (rooms, rates, services) dynamically via `mews-data-service.ts`
4. Creates reservations with realistic distributions:
   - **Mix of states**: Confirmed (60%), Started (15%), Processed (15%), Optional (5%), Canceled (5%)
   - **Time distribution**: Past, present, and future reservations
   - **Realistic patterns**: Weekend stays, varying lengths, appropriate guest counts
5. Results logged to `ReservationCreationLog` database table

### Reservation Characteristics

- **Intelligent distribution**: Reservations spread across available rooms/apartments
- **Realistic timing**: Mix of check-ins yesterday, today, tomorrow, and future dates
- **Variable length**: 1-7 night stays with realistic patterns
- **Guest assignment**: Uses existing customers created in previous step
- **State variety**: Covers full reservation lifecycle (optional, confirmed, started, processed, canceled)

### Technical Details

- **Endpoint**: `https://api.mews-demo.com/api/connector/v1/reservations/add`
- **Client Token**: Hardcoded in service
- **Access Token**: Received from webhook (enterprise-specific)
- **Concurrency**: 3 reservations processed at a time
- **Duration**: ~30-60 seconds depending on property size
- **Error Handling**: Continues processing even if some fail; tracks individual results
- **Dependencies**: Requires customers to exist first; dynamically fetches services/rates

### Files

| File | Purpose |
|------|---------|
| `lib/reservation-service.ts` | Reservation creation orchestration and distribution logic |
| `lib/mews-data-service.ts` | Fetches services, rates, and resource categories from Mews API |
| `types/reservations.ts` | TypeScript types for reservation states and operations |
| `app/api/webhook/access-token/route.ts` | Triggers reservation creation after customers are created |

### Database Tracking

All reservation creation attempts are logged in the `ReservationCreationLog` table with:
- Total reservations attempted
- Success/failure counts
- Individual results (stored as JSON)
- Start and completion timestamps
- Status tracking (processing → completed/failed)

## Trial Duration Feature

Trial environments can be created with flexible durations to match customer needs.

### Available Durations

- **7 days**: Quick demos and short-term evaluations
- **30 days**: Standard trial period (default)
- **60 days**: Extended evaluation for complex requirements

### Configuration

Duration is specified in the trial creation form via the `durationDays` field:
```typescript
durationDays: 7 | 30 | 60  // Default: 30
```

### Special Rules

- **Charlie Delamare exception**: Trials created by Charlie Delamare (`charlie.delamare@mews.com`) are automatically set to 7 days regardless of selection
- Duration stored in `EnvironmentLog.durationDays` field
- Duration utilities provided in `lib/duration.ts`:
  ```typescript
  type TrialDuration = 7 | 30 | 60;
  function daysToMilliseconds(days: TrialDuration): number
  function getTrialExpiryDate(startDate: Date, days: TrialDuration): Date
  ```

### Implementation

The duration feature is implemented in:
- `app/page.tsx`: Duration selection UI
- `app/api/create-trial/route.ts`: Duration processing and storage
- `lib/duration.ts`: Duration conversion utilities
- `prisma/schema.prisma`: EnvironmentLog.durationDays field

## Key Files and Their Purpose

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main trial creation form with duration selection and reset tab (client component) |
| `app/logs/page.tsx` | Environment logs dashboard with auto-refresh (client component) |
| `app/api/create-trial/route.ts` | Core trial creation logic, Mews API calls, Zapier notifications |
| `app/api/add-environment/route.ts` | Manual environment addition via access token |
| `app/api/webhook/access-token/route.ts` | Webhook handler, triggers customer and reservation creation |
| `app/api/environments/list/route.ts` | List all trial environments |
| `app/api/reservations/get-all/route.ts` | Retrieve all reservations for an environment |
| `app/api/reservations/cancel-all/route.ts` | Cancel all reservations in an environment |
| `app/api/debug/route.ts` | Debug endpoint for database inspection |
| `lib/codes.ts` | Country/language mappings for 50+ countries with legal environment codes, currencies, and tax configurations |
| `lib/customer-service.ts` | Automatic customer creation service with batch processing |
| `lib/reservation-service.ts` | Automatic reservation creation with realistic distributions |
| `lib/mews-data-service.ts` | Dynamic fetching of services, rates, and resource categories from Mews API |
| `lib/duration.ts` | Trial duration utilities and type definitions |
| `lib/logger.ts` | Database logging functions for environment creation |
| `lib/prisma.ts` | Prisma client singleton pattern for Next.js |
| `lib/zapier.ts` | Zapier webhook notification utility for all notification types |
| `lib/sample-customers.ts` | 100 predetermined customer profiles |
| `types/reservations.ts` | TypeScript types for reservation operations |
| `prisma/schema.prisma` | Database schema with AccessToken, EnvironmentLog, CustomerCreationLog, ReservationCreationLog models |
| `vitest.config.ts` | Vitest test configuration |

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
- Log errors with `console.error()`

### Components

- Client components use `'use client'` directive
- Use React hooks (`useState`, `useEffect`) for state management
- Tailwind CSS for styling with responsive design

### Prisma

- Use singleton pattern to prevent multiple client instances in development
- Access via `import { prisma } from '@/lib/prisma'`

## External Integrations

### Mews API

- **Demo Environment**: `https://app.mews-demo.com`
- **Sample Enterprise API**: `https://app.mews-demo.com/api/general/v1/enterprises/addSample`
- **Connector API**: `https://api.mews.com/api/connector/v1/`
- **Customers API**: `https://api.mews-demo.com/api/connector/v1/customers/add`
- **Reservations API**: `https://api.mews-demo.com/api/connector/v1/reservations/add`
- **Services API**: `https://api.mews-demo.com/api/connector/v1/services/getAll`
- Default login password for trials: `Sample123`
- Trial lifetime: 7, 30, or 60 days (configurable)

### Zapier

- Webhook integration for all notifications (Slack, CRM, etc.)
- Simple JSON payload with messageType for routing in Zapier
- Configured via `ZAPIER_WEBHOOK_URL` environment variable
- Notifications include trial creation, environment setup, and manual operations
- Message types: trial_generation_failure, environment_ready, access_token_no_match, manual_environment_configured, manual_environment_added

## Production Deployment

- Deployed on Render at `https://mews-free-trial-2.onrender.com`
- Uses `output: 'standalone'` for optimized Docker builds
- Webhook endpoint: `https://mews-free-trial-2.onrender.com/api/webhook/access-token`

## Test Infrastructure

The application uses Vitest for unit and integration testing.

### Testing Framework

- **Test Runner**: Vitest (fast, modern alternative to Jest)
- **React Testing**: `@testing-library/react` and `@testing-library/jest-dom`
- **API Mocking**: MSW (Mock Service Worker) for HTTP request interception
- **Configuration**: `vitest.config.ts`

### Test Files

| File | Purpose |
|------|---------|
| `app/api/create-trial/route.test.ts` | Tests for trial creation endpoint |
| `app/api/logs/route.test.ts` | Tests for logs endpoint |
| `lib/codes.test.ts` | Tests for country/language mappings |
| `lib/logger.test.ts` | Tests for logging utilities |

### Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI (interactive browser interface)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Test Patterns

- API route tests use MSW to mock external Mews API calls
- Database operations use in-memory or test database instances
- Component tests use React Testing Library for user interaction simulation
- Focus on integration tests over unit tests where practical

## Common Tasks

### Adding a New Country

1. Add entry to `countries` object in `lib/codes.ts`:
   ```typescript
   "Country Name": { LE: "XX-YYYY", Currency: "XXX", Environment: "Gross" | "Net" }
   ```

### Adding a New Language

1. Add entry to `preferredLanguage` object in `lib/codes.ts`:
   ```typescript
   "Language Name": "xx-XX"
   ```

### Modifying the Trial Creation Process

1. Update `app/api/create-trial/route.ts`
2. Update form fields in `app/page.tsx` if needed
3. Update `EnvironmentLog` schema and logger if storing new data

### Database Changes

1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Update affected lib functions and API routes

### Manually Adding an Existing Environment

To add a trial environment created outside the main flow:

1. Obtain the access token from Mews webhook or admin panel
2. Get the enterprise ID from the Mews environment
3. Send POST request to `/api/add-environment`:
   ```json
   {
     "accessToken": "your-token-here",
     "enterpriseId": "enterprise-id-here",
     "salesforceAccountId": "optional-sf-id"
   }
   ```
4. Environment will be added to logs and tracked in the system

### Debugging Environment Issues

1. Use `/api/debug` endpoint to inspect database records:
   ```
   GET /api/debug?enterpriseId=xxx&limit=10
   ```
2. Check environment status in logs dashboard
3. Review `CustomerCreationLog` and `ReservationCreationLog` for setup issues
4. Verify access token exists in `AccessToken` table

### Testing Customer/Reservation Creation

1. Use the reset tab in the main UI to test on existing environments
2. Select an environment from the dropdown
3. Trigger customer/reservation creation
4. Monitor logs dashboard for real-time status updates
5. Use `/api/reservations/get-all` to verify reservations were created

### Adding New Trial Durations

1. Update `TrialDuration` type in `lib/duration.ts`:
   ```typescript
   export type TrialDuration = 7 | 30 | 60 | 90; // Add new duration
   ```
2. Update duration selection UI in `app/page.tsx`
3. Update database migrations if needed
4. Update documentation

### Modifying Reservation Distribution

1. Edit `lib/reservation-service.ts`
2. Adjust state distribution percentages:
   ```typescript
   const stateDistribution = {
     Confirmed: 0.6,    // 60%
     Started: 0.15,     // 15%
     // ... modify as needed
   }
   ```
3. Test with existing environments using reset tab
