# Maintainability Sprint 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix five low-risk, high-value maintainability issues identified in the April 2026 principal engineer review — no behaviour changes, just safer and clearer code.

**Architecture:** All changes are refactors confined to existing files. No new files. Each task is independently deployable. The existing Vitest + MSW test suite is the safety net; `npm run build` is used as a final type-check after each task.

**Tech Stack:** TypeScript strict, Next.js 14 App Router, Vitest, Prisma

---

## Files touched

| File | Task | Change |
|---|---|---|
| `app/api/create-trial/route.ts` | 1 | Replace hardcoded `isCharlie` with `isAdminEmail()` |
| `lib/mews-rate-limiter.ts` | 2 | Remove dead `isProcessing` field and `queueLength: 0` lie |
| `lib/mews-rate-limiter.ts` | 3 | Remove false generic from `executeRequest<T>` |
| `lib/reservation-service.ts` | 4 | Adopt `buildMewsAuth()` in all four local auth constructions; fix wrong client name |
| `lib/reservation-service.ts` | 5 | Replace `any[]` result types with `CreatedReservation`/`FailedReservation` interfaces |

---

## Task 1: Replace `isCharlie` with `isAdminEmail`

**Why:** Four occurrences of hardcoded personal email addresses in a route handler. `lib/admin.ts` already exports `isAdminEmail()` which reads from the `ADMIN_EMAILS` env var. The route just isn't using it.

**Files:**
- Modify: `app/api/create-trial/route.ts`

- [ ] **Step 1: Read the current route to confirm the four `isCharlie` uses**

  ```bash
  grep -n "isCharlie\|isAdmin" app/api/create-trial/route.ts
  ```

  Expected output:
  ```
  57:    const isCharlie = requestorEmail === 'charlie.delamare@gmail.com' ||
  58:                      requestorEmail === 'charlie.delamare@mews.com';
  61:    const validDurations = isCharlie ? [1, 7, 30, 60] : [7, 30, 60];
  66:          error: isCharlie
  121:    if (!isCharlie && salesforceAccountId) {
  ```

- [ ] **Step 2: Replace the `isCharlie` block with `isAdminEmail`**

  In `app/api/create-trial/route.ts`, make two edits:

  **Edit A — add import at the top** (after the existing imports, before the `MEWS_API_URL` const):
  ```ts
  import { isAdminEmail } from '@/lib/admin';
  ```

  **Edit B — replace the four-line block** starting at line 57:

  Old:
  ```ts
  // Check for Charlie user exception (needs to be before duration validation)
  const isCharlie = requestorEmail === 'charlie.delamare@gmail.com' ||
                    requestorEmail === 'charlie.delamare@mews.com';

  // Validate duration (context-aware for Charlie)
  const validDurations = isCharlie ? [1, 7, 30, 60] : [7, 30, 60];
  if (!validDurations.includes(durationDays)) {
    return NextResponse.json(
      {
        success: false,
        error: isCharlie
          ? 'Invalid duration. Must be 1, 7, 30, or 60 days'
          : 'Invalid duration. Must be 7, 30, or 60 days'
      },
      { status: 400 }
    );
  }
  ```

  New:
  ```ts
  // Admin users (configured via ADMIN_EMAILS env var) can create 1-day trials
  // and skip Salesforce Account ID validation.
  const isAdmin = isAdminEmail(requestorEmail);

  // Validate duration (admins can create 1-day trials for testing)
  const validDurations = isAdmin ? [1, 7, 30, 60] : [7, 30, 60];
  if (!validDurations.includes(durationDays)) {
    return NextResponse.json(
      {
        success: false,
        error: isAdmin
          ? 'Invalid duration. Must be 1, 7, 30, or 60 days'
          : 'Invalid duration. Must be 7, 30, or 60 days'
      },
      { status: 400 }
    );
  }
  ```

  **Edit C — update the duplicate-check guard** at line 121:

  Old:
  ```ts
  if (!isCharlie && salesforceAccountId) {
  ```

  New:
  ```ts
  if (!isAdmin && salesforceAccountId) {
  ```

- [ ] **Step 3: Verify no `isCharlie` references remain**

  ```bash
  grep -n "isCharlie" app/api/create-trial/route.ts
  ```

  Expected: no output.

- [ ] **Step 4: Run type-check**

  ```bash
  npm run build 2>&1 | tail -20
  ```

  Expected: build succeeds (exits 0). Any type error here means the import or rename was incomplete.

- [ ] **Step 5: Commit**

  ```bash
  git add app/api/create-trial/route.ts
  git commit -m "refactor(auth): replace isCharlie with isAdminEmail from lib/admin"
  ```

---

## Task 2: Remove dead fields from `MewsRateLimiter`

**Why:** `RequestWindow.isProcessing` is set to `false` on init and never changed. `RateLimitMetrics.queueLength` is always returned as `0`. Both fields mislead readers about what the rate limiter tracks.

**Files:**
- Modify: `lib/mews-rate-limiter.ts`

- [ ] **Step 1: Confirm `isProcessing` is never written after init**

  ```bash
  grep -n "isProcessing" lib/mews-rate-limiter.ts
  ```

  Expected:
  ```
  43:  isProcessing: boolean;
  320:    this.windows.set(accessToken, {
  321:      timestamps: [],
  322:      isProcessing: false
  323:    });
  ```

  Only two lines — the interface declaration and the initializer. It is never set to `true` anywhere. Safe to remove.

- [ ] **Step 2: Confirm `queueLength` is always 0**

  ```bash
  grep -n "queueLength" lib/mews-rate-limiter.ts
  ```

  Expected:
  ```
  55:  queueLength: number;
  339:    queueLength: 0,
  358:    `Queue: ${metrics.queueLength} | ` +
  ```

  Three lines — the interface, the hardcoded return value, and a log line. The value never varies.

- [ ] **Step 3: Apply the three deletions**

  **Edit A — remove `isProcessing` from the `RequestWindow` interface** (lines 39–44):

  Old:
  ```ts
  interface RequestWindow {
    /** Timestamps of requests made within the window */
    timestamps: number[];
    /** Flag indicating if queue is being processed */
    isProcessing: boolean;
  }
  ```

  New:
  ```ts
  interface RequestWindow {
    /** Timestamps of requests made within the window */
    timestamps: number[];
  }
  ```

  **Edit B — remove `isProcessing: false` from `getOrCreateWindow`** (around line 319):

  Old:
  ```ts
  this.windows.set(accessToken, {
    timestamps: [],
    isProcessing: false
  });
  ```

  New:
  ```ts
  this.windows.set(accessToken, {
    timestamps: [],
  });
  ```

  **Edit C — remove `queueLength` from the `RateLimitMetrics` interface** (lines 49–58):

  Old:
  ```ts
  export interface RateLimitMetrics {
    /** Current number of requests in the window */
    currentCount: number;
    /** Percentage of rate limit used (0-100) */
    percentageUsed: number;
    /** Number of requests in queue */
    queueLength: number;
    /** Whether throttling is active */
    isThrottling: boolean;
  }
  ```

  New:
  ```ts
  export interface RateLimitMetrics {
    /** Current number of requests in the window */
    currentCount: number;
    /** Percentage of rate limit used (0-100) */
    percentageUsed: number;
    /** Whether throttling is active */
    isThrottling: boolean;
  }
  ```

  **Edit D — remove `queueLength: 0` from `getMetrics` return** (around line 336):

  Old:
  ```ts
  return {
    currentCount,
    percentageUsed: Math.round((currentCount / this.config.maxRequests) * 100),
    queueLength: 0,
    isThrottling: currentCount >= threshold
  };
  ```

  New:
  ```ts
  return {
    currentCount,
    percentageUsed: Math.round((currentCount / this.config.maxRequests) * 100),
    isThrottling: currentCount >= threshold
  };
  ```

  **Edit E — remove the `Queue:` line from `logMetrics`** (around line 354):

  Old:
  ```ts
  console.log(
    `[RATE-LIMITER] Token: ${this.redactToken(accessToken)} | ` +
    `Requests: ${metrics.currentCount}/${this.config.maxRequests} (${metrics.percentageUsed}%) | ` +
    `Queue: ${metrics.queueLength} | ` +
    `Status: ${status}`
  );
  ```

  New:
  ```ts
  console.log(
    `[RATE-LIMITER] Token: ${this.redactToken(accessToken)} | ` +
    `Requests: ${metrics.currentCount}/${this.config.maxRequests} (${metrics.percentageUsed}%) | ` +
    `Status: ${status}`
  );
  ```

- [ ] **Step 4: Check for any external callers of `queueLength`**

  ```bash
  grep -rn "queueLength" --include="*.ts" .
  ```

  Expected: no output (the only usages were inside the rate limiter itself).

- [ ] **Step 5: Run type-check**

  ```bash
  npm run build 2>&1 | tail -20
  ```

  Expected: exits 0. If any caller was reading `metrics.queueLength`, TypeScript will surface it here.

- [ ] **Step 6: Commit**

  ```bash
  git add lib/mews-rate-limiter.ts
  git commit -m "refactor(rate-limiter): remove dead isProcessing and queueLength fields"
  ```

---

## Task 3: Fix false generic on `executeRequest`

**Why:** `executeRequest<T>` claims to return `Promise<T>` but always returns `response as T`. The generic allows callers to lie to TypeScript (`executeRequest<string>()`) while always getting a `Response`. Remove the generic and declare the real return type.

**Files:**
- Modify: `lib/mews-rate-limiter.ts`

- [ ] **Step 1: Confirm the signature and the cast**

  ```bash
  grep -n "executeRequest\|return response as" lib/mews-rate-limiter.ts
  ```

  Expected:
  ```
  100:  async executeRequest<T>(
  104:  ): Promise<T> {
  145:        return response as T;
  ```

- [ ] **Step 2: Update the method signature and return type**

  **Edit A — change the method signature** (line 100):

  Old:
  ```ts
  async executeRequest<T>(
    accessToken: string,
    requestFn: () => Promise<Response>,
    options?: {
      maxRetries?: number;
      logContext?: string;
    }
  ): Promise<T> {
  ```

  New:
  ```ts
  async executeRequest(
    accessToken: string,
    requestFn: () => Promise<Response>,
    options?: {
      maxRetries?: number;
      logContext?: string;
    }
  ): Promise<Response> {
  ```

  **Edit B — fix the return statement** (line 145):

  Old:
  ```ts
  return response as T;
  ```

  New:
  ```ts
  return response;
  ```

- [ ] **Step 3: Check the `fetchWithRateLimit` wrapper still compiles cleanly**

  ```bash
  grep -n -A5 "export async function fetchWithRateLimit" lib/mews-rate-limiter.ts
  ```

  Expected output shows:
  ```ts
  return mewsRateLimiter.executeRequest<Response>(
    accessToken,
    () => fetch(url, options),
    { logContext: context }
  );
  ```

  Update this too — remove the now-redundant `<Response>` type argument:

  Old:
  ```ts
  return mewsRateLimiter.executeRequest<Response>(
  ```

  New:
  ```ts
  return mewsRateLimiter.executeRequest(
  ```

- [ ] **Step 4: Run type-check**

  ```bash
  npm run build 2>&1 | tail -20
  ```

  Expected: exits 0. TypeScript will catch any call sites that were relying on the generic.

- [ ] **Step 5: Commit**

  ```bash
  git add lib/mews-rate-limiter.ts
  git commit -m "refactor(rate-limiter): remove false generic from executeRequest, return Promise<Response>"
  ```

---

## Task 4: Adopt `buildMewsAuth()` in `reservation-service.ts`

**Why:** `buildMewsAuth(accessToken)` from `lib/mews-api.ts` centralises the three-field auth object (`ClientToken`, `AccessToken`, `Client`). Four functions in `reservation-service.ts` build it manually instead. One of them uses the wrong client name (`'Free Trial Generator'`), which will cause silent bugs if Mews ever rejects unknown client names.

**Files:**
- Modify: `lib/reservation-service.ts`

The four functions to fix are: `fetchTimezoneFromMews`, `getCustomerByEmail`, `createSingleCustomer`, `sendReservationGroup`.

- [ ] **Step 1: Confirm `buildMewsAuth` is not yet imported in this file**

  ```bash
  grep -n "buildMewsAuth\|mews-api" lib/reservation-service.ts
  ```

  Expected: no output (it uses `getMewsClientToken` and `getMewsApiUrl` directly instead).

- [ ] **Step 2: Add `buildMewsAuth` to the import**

  At the top of `lib/reservation-service.ts`, find the existing import from `@/lib/config`:

  ```ts
  import { getMewsClientToken, getMewsApiUrl } from '@/lib/config';
  ```

  Add a new import after it:

  ```ts
  import { buildMewsAuth } from '@/lib/mews-api';
  ```

  (`getMewsClientToken` and `getMewsApiUrl` are still needed for URL construction, so keep that import.)

- [ ] **Step 3: Fix `fetchTimezoneFromMews`**

  Find the body construction inside `fetchTimezoneFromMews` (around line 70):

  Old:
  ```ts
  body: JSON.stringify({
    ClientToken: getMewsClientToken(),
    AccessToken: accessToken,
    Client: 'Mews Sandbox Manager'
  })
  ```

  New:
  ```ts
  body: JSON.stringify({
    ...buildMewsAuth(accessToken),
  })
  ```

- [ ] **Step 4: Fix `getCustomerByEmail`**

  Find the body construction inside `getCustomerByEmail` (around line 644):

  Old:
  ```ts
  body: JSON.stringify({
    ClientToken: getMewsClientToken(),
    AccessToken: accessToken,
    Client: 'Mews Sandbox Manager',
    Emails: [email],
    Extent: {
      Customers: true,
      Documents: false,
      Addresses: false
    }
  })
  ```

  New:
  ```ts
  body: JSON.stringify({
    ...buildMewsAuth(accessToken),
    Emails: [email],
    Extent: {
      Customers: true,
      Documents: false,
      Addresses: false
    }
  })
  ```

- [ ] **Step 5: Fix `createSingleCustomer` (and fix wrong client name)**

  Find the `requestBody` object inside `createSingleCustomer` (around line 692):

  Old:
  ```ts
  const requestBody = {
    ClientToken: getMewsClientToken(),
    AccessToken: accessToken,
    Client: 'Free Trial Generator',
    FirstName: customer.FirstName,
    ...
  ```

  New:
  ```ts
  const requestBody = {
    ...buildMewsAuth(accessToken),
    FirstName: customer.FirstName,
    ...
  ```

  (Remove the three auth fields and spread `buildMewsAuth` in their place. The `'Free Trial Generator'` name is replaced by the canonical `'Mews Sandbox Manager'` inside `buildMewsAuth`.)

- [ ] **Step 6: Fix `sendReservationGroup`**

  Find the body construction inside `sendReservationGroup` (around line 998):

  Old:
  ```ts
  body: JSON.stringify({
    ClientToken: getMewsClientToken(),
    AccessToken: accessToken,
    Client: 'Mews Sandbox Manager',
    ServiceId: serviceId,
    Reservations: group.map(r => {
  ```

  New:
  ```ts
  body: JSON.stringify({
    ...buildMewsAuth(accessToken),
    ServiceId: serviceId,
    Reservations: group.map(r => {
  ```

- [ ] **Step 7: Verify no leftover manual auth constructions remain in this file**

  ```bash
  grep -n "ClientToken: getMewsClientToken\|Client: 'Free Trial Generator'\|Client: 'Mews Sandbox Manager'" lib/reservation-service.ts
  ```

  Expected: no output.

- [ ] **Step 8: Run the existing test suite**

  ```bash
  npm run test -- lib/reservation-service.test.ts
  ```

  Expected: all tests pass. The tests mock `fetch` so auth fields aren't validated, but any import error or syntax error in the service will be caught here.

- [ ] **Step 9: Run type-check**

  ```bash
  npm run build 2>&1 | tail -20
  ```

  Expected: exits 0.

- [ ] **Step 10: Commit**

  ```bash
  git add lib/reservation-service.ts
  git commit -m "refactor(reservations): adopt buildMewsAuth(), fix 'Free Trial Generator' client name"
  ```

---

## Task 5: Type `any[]` reservation results

**Why:** `sendReservationGroup`, `createReservationGroups`, `createReservationGroupsWithCustomers`, and the main orchestrator all use `any[]` for created/failed reservation arrays. Adding two small interfaces enables autocomplete, catches property-name typos at compile time, and removes the `(r: any)` cast when reading results.

**Files:**
- Modify: `lib/reservation-service.ts`

- [ ] **Step 1: Confirm the `any[]` locations**

  ```bash
  grep -n "any\[\]" lib/reservation-service.ts
  ```

  Expected output includes at minimum:
  ```
  214:      let createdReservations: any[];
  215:      let failures: any[];
  990:): Promise<{ created: any[]; failed: any[] }> {
  991:  const created: any[] = [];
  992:  const failed: any[] = [];
  1108:): Promise<{ createdReservations: any[]; failures: any[] }> {
  1109:  const createdReservations: any[] = [];
  1110:  const failures: any[] = [];
  1139:): Promise<{ createdReservations: any[]; failures: any[]; customerPool: Map<number, string> }> {
  1140:  const createdReservations: any[] = [];
  1141:  const failures: any[] = [];
  ```

- [ ] **Step 2: Add two interfaces near the top of the file (after the existing interfaces)**

  After the `CategoryTarget` interface (around line 60), add:

  ```ts
  interface CreatedReservation {
    id: string;
    isOptional: boolean;
  }

  interface FailedReservation {
    error: string;
    skipped?: boolean;
    checkInUtc?: Date;
    checkOutUtc?: Date;
  }
  ```

- [ ] **Step 3: Update `sendReservationGroup` signature and locals**

  Old:
  ```ts
  ): Promise<{ created: any[]; failed: any[] }> {
    const created: any[] = [];
    const failed: any[] = [];
  ```

  New:
  ```ts
  ): Promise<{ created: CreatedReservation[]; failed: FailedReservation[] }> {
    const created: CreatedReservation[] = [];
    const failed: FailedReservation[] = [];
  ```

  Inside the function, the `failed.push(...)` calls already pass objects with `error` and optional `skipped`/date fields — they match `FailedReservation` exactly. The `created.push(...)` call passes `{ id, isOptional }` — matches `CreatedReservation` exactly. No other changes needed inside the function body.

- [ ] **Step 4: Update `createReservationGroups` signature and locals**

  Old:
  ```ts
  ): Promise<{ createdReservations: any[]; failures: any[] }> {
    const createdReservations: any[] = [];
    const failures: any[] = [];
  ```

  New:
  ```ts
  ): Promise<{ createdReservations: CreatedReservation[]; failures: FailedReservation[] }> {
    const createdReservations: CreatedReservation[] = [];
    const failures: FailedReservation[] = [];
  ```

- [ ] **Step 5: Update `createReservationGroupsWithCustomers` signature and locals**

  Old:
  ```ts
  ): Promise<{ createdReservations: any[]; failures: any[]; customerPool: Map<number, string> }> {
    const createdReservations: any[] = [];
    const failures: any[] = [];
  ```

  New:
  ```ts
  ): Promise<{ createdReservations: CreatedReservation[]; failures: FailedReservation[]; customerPool: Map<number, string> }> {
    const createdReservations: CreatedReservation[] = [];
    const failures: FailedReservation[] = [];
  ```

- [ ] **Step 6: Update the main function's `let` declarations**

  Find around line 214:

  Old:
  ```ts
  let createdReservations: any[];
  let failures: any[];
  ```

  New:
  ```ts
  let createdReservations: CreatedReservation[];
  let failures: FailedReservation[];
  ```

- [ ] **Step 7: Fix the `(r: any)` cast in the unified log update block**

  Around line 383 in the main function, there are two filter/map operations with `(r: any)`:

  Old:
  ```ts
  const optionalCount = createdReservations.filter((r: any) => r.isOptional).length;
  ```

  New:
  ```ts
  const optionalCount = createdReservations.filter(r => r.isOptional).length;
  ```

  And around line 390:

  Old:
  ```ts
  const formattedFailures = failures.map((f: any) => ({
    error: f.error,
    skipped: f.skipped || false,
    checkInUtc: f.checkInUtc?.toISOString?.() || f.checkInUtc,
    checkOutUtc: f.checkOutUtc?.toISOString?.() || f.checkOutUtc
  }));
  ```

  New:
  ```ts
  const formattedFailures = failures.map(f => ({
    error: f.error,
    skipped: f.skipped ?? false,
    checkInUtc: f.checkInUtc?.toISOString(),
    checkOutUtc: f.checkOutUtc?.toISOString()
  }));
  ```

  (The `?.toISOString?.()` double-optional-chain was guarding against `toISOString` not being a function — that can't happen on a `Date`, so it simplifies to a single `?.`.)

- [ ] **Step 8: Run type-check**

  ```bash
  npm run build 2>&1 | tail -20
  ```

  Expected: exits 0. TypeScript will surface any push/access patterns that don't match the new interfaces. Fix each error by inspecting the push site and ensuring the object literal includes `id: string` and `isOptional: boolean` (for `CreatedReservation`) or `error: string` (for `FailedReservation`).

- [ ] **Step 9: Run tests**

  ```bash
  npm run test -- lib/reservation-service.test.ts
  ```

  Expected: all pass.

- [ ] **Step 10: Commit**

  ```bash
  git add lib/reservation-service.ts
  git commit -m "refactor(reservations): type CreatedReservation/FailedReservation, remove any[]"
  ```

---

## Self-review

**Spec coverage check:**

| Review finding | Task |
|---|---|
| Hardcoded `isCharlie` emails | Task 1 ✓ |
| Dead `isProcessing` field | Task 2 ✓ |
| Dead `queueLength: 0` field | Task 2 ✓ |
| False generic `executeRequest<T>` | Task 3 ✓ |
| `buildMewsAuth` not used in reservation-service | Task 4 ✓ |
| `'Free Trial Generator'` wrong client name | Task 4 ✓ |
| `any[]` reservation result types | Task 5 ✓ |

**Items intentionally deferred to a later plan:**
- `logId ? fetchWithRateLimitAndLog : fetchWithRateLimit` extraction — requires touching all three service files and adding a new helper; higher surface area for a separate sprint
- Split `createReservationsForEnvironment` into A/B paths — significant refactor, warrants its own plan
- `buildMewsAuth` adoption in `reset-service.ts` and `bill-service.ts` — straightforward but touches two more files; include in the next sprint
- `fetchEnvironmentData` backwards-compat comment — documentation only, can be added any time

**Placeholder scan:** No TBDs, no "add appropriate handling", no "similar to Task N" patterns. All steps include actual code.

**Type consistency:** `CreatedReservation` and `FailedReservation` are defined in Task 5 Step 2 and used in Steps 3–7. Names are consistent throughout.
