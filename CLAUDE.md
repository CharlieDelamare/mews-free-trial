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

**Mews Free Trial** is a Next.js web application that allows Mews sales representatives to create 45-day trial hotel environments in the Mews demo system. The app integrates with the Mews API to provision sample hotels, stores environment logs in PostgreSQL, and sends notifications via Zapier webhooks.

### Key Features

- Create trial hotel environments with customizable property types (hotel, hostel, apartments)
- Support for 50+ countries with proper legal environment, currency, and tax configurations
- Webhook endpoint to receive and store access tokens from Mews
- **Automatic customer creation**: 100 sample customers automatically added to each trial environment
- Environment logs dashboard to view created trials
- Zapier webhook notifications for trial creation and environment setup
- CRM integration via Zapier webhooks

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
│   │   ├── create-trial/         # POST - Create trial environment
│   │   ├── create-reservation/   # POST - Create reservation (alternate flow)
│   │   ├── logs/                 # GET - Retrieve environment logs
│   │   └── webhook/
│   │       └── access-token/     # POST/GET - Webhook for access tokens
│   ├── logs/                     # Environment logs page
│   │   └── page.tsx
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main form page
├── lib/                          # Shared utilities
│   ├── codes.ts                  # Country/language code mappings
│   ├── customer-service.ts       # Automatic customer creation service
│   ├── logger.ts                 # Environment log functions
│   ├── prisma.ts                 # Prisma client singleton
│   ├── sample-customers.ts       # 100 predetermined customer profiles
│   └── zapier.ts                 # Zapier webhook notification utility
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
├── .env.example                  # Environment variable template
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
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
| `MEWS_SAMPLE_TOKEN` | Token for creating sample enterprises |
| `MEWS_CLIENT_TOKEN` | Client token for Mews Connector API |
| `MEWS_ACCESS_TOKEN` | Access token for Mews Connector API |
| `MEWS_BOOKABLE_SERVICE_ID` | Service ID for reservations |
| `MEWS_RATE_ID` | Rate ID for reservations |
| `MEWS_RESOURCE_CATEGORY_ID` | Resource category for reservations |
| `MEWS_API_URL` | Mews API base URL (default: https://api.mews-demo.com) |

Optional:

| Variable | Description |
|----------|-------------|
| `ZAPIER_WEBHOOK_URL` | Zapier webhook for all notifications (Slack, CRM, etc.) |

## API Endpoints

### POST `/api/create-trial`

Creates a new trial hotel environment in the Mews demo system.

**Request Body:**
```typescript
{
  requestorEmail: string;    // Sales rep email
  firstName: string;         // Customer first name
  lastName: string;          // Customer last name
  customerEmail: string;     // Customer login email
  preferredLanguage: string; // e.g., "English (UK)"
  propertyName: string;      // Hotel name
  propertyCountry: string;   // e.g., "United Kingdom"
  propertyType: 'hotel' | 'hostel' | 'apartments';
}
```

**Response:** Returns login URL, email, and default password on success.

### POST `/api/create-reservation`

Creates a customer and reservation in an existing Mews property.

### GET `/api/logs`

Returns all environment creation logs from the database.

### POST/GET `/api/webhook/access-token`

- **POST**: Receives access token webhooks from Mews when hotels are created
- **GET**: Retrieves stored access tokens (optional `enterpriseId` query param)

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

Tracks created trial environments:

```prisma
model EnvironmentLog {
  id              String   @id @default(cuid())
  timestamp       DateTime @default(now())
  propertyName    String
  customerName    String
  customerEmail   String
  propertyCountry String
  propertyType    String
  loginUrl        String
  loginEmail      String
  loginPassword   String
  status          String   // 'success' | 'failure'
  errorMessage    String?
}
```

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

## Key Files and Their Purpose

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main trial creation form (client component) |
| `app/logs/page.tsx` | Environment logs dashboard (client component) |
| `app/api/create-trial/route.ts` | Core trial creation logic, Mews API calls, Zapier notifications |
| `lib/codes.ts` | Country/language mappings for 50+ countries with legal environment codes, currencies, and tax configurations |
| `lib/logger.ts` | Database logging functions for environment creation |
| `lib/prisma.ts` | Prisma client singleton pattern for Next.js |
| `lib/zapier.ts` | Zapier webhook notification utility for all notification types |

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
- Default login password for trials: `Sample123`
- Trial lifetime: 45 days

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
