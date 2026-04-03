# Performance Bottlenecks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate N+1 API patterns, fix a silent data-loss bug in bill fetching, and remove artificial latency across the reset, bill-close, and customer-creation hot paths.

**Architecture:** Six targeted refactors, each independently committable. Most critical is the bill-service N+1 fix: swap the per-bill serial fetch loop for two batch calls + a concurrent close phase. All other changes (cursor pagination, parallel reservation fetch, currency pass-through, sleep removal, promise-array leak) are small and self-contained.

**Tech Stack:** TypeScript strict · Vitest · MSW + vi.fn() mocks · Prisma (mocked via vitest-mock-extended) · Mews Connector API

---

## File Map

| File | Change |
|------|--------|
| `lib/bill-service.ts` | Add cursor pagination to `getBills`; extract `fetchItemsForBills` helper; refactor `closeBillsForEnvironment` to 2-phase batch; add optional `currencyOverride` param; extract `processSingleBill` helper |
| `lib/reset-service.ts` | Parallelize Steps 3 & 4 reservation fetches; pass `config.currency` to `closeBillsForEnvironment` |
| `app/api/close-bills/route.ts` | No signature change needed (uses default `currencyOverride = undefined`) |
| `lib/customer-service.ts` | Remove 100 ms artificial sleep between chunks |
| `lib/api-call-logger.ts` | Replace unbounded `inflightPromises` array with resolver-notification pattern |
| `lib/bill-service.test.ts` | **New file** — tests for all bill-service changes |

---

## Task 1: Fix cursor pagination in `getBills`

**Files:**
- Modify: `lib/bill-service.ts` (inside `getBills`, the `while` loop)
- Create: `lib/bill-service.test.ts`

**Context:** `getBills` uses a 90-day sliding window but never follows the `Cursor` token in the response. If any window returns exactly 1000 bills, the remainder are silently dropped.

- [ ] **Step 1: Create `lib/bill-service.test.ts` with the failing pagination test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBills } from './bill-service';

// Silence console in tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

vi.mock('./api-call-logger', () => ({ loggedFetch: vi.fn() }));
vi.mock('./timezone-service', () => ({
  fetchTimezoneFromConfiguration: vi.fn().mockResolvedValue({
    timezone: 'UTC',
    currency: 'EUR',
  }),
}));
vi.mock('@/lib/config', () => ({
  getMewsClientToken: () => 'test-client-token',
  getMewsApiUrl: () => 'https://api.mews-demo.com',
}));

describe('getBills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('follows Cursor token within a window to fetch all pages', async () => {
    const page1Bills = [{ Id: 'bill-1', AccountId: 'acc-1' }];
    const page2Bills = [{ Id: 'bill-2', AccountId: 'acc-2' }];

    // First call returns a cursor; second call returns no cursor
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Bills: page1Bills, Cursor: 'cursor-abc' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Bills: page2Bills, Cursor: null }),
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const { bills } = await getBills('access-token', 'Open');

    // Should have followed the cursor and combined both pages
    expect(bills).toHaveLength(2);
    expect(bills.map((b) => b.Id)).toEqual(['bill-1', 'bill-2']);

    // Second call must include the cursor from the first response
    const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(secondCallBody.Limitation.Cursor).toBe('cursor-abc');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd /Users/charlie.delamare/projects/mews-free-trial/.claude/worktrees/eager-antonelli
npx vitest run lib/bill-service.test.ts --reporter=verbose
```

Expected: test fails — `bills` has length 1 (cursor not followed).

- [ ] **Step 3: Add cursor pagination inside each window in `getBills`**

In `lib/bill-service.ts`, replace the inner block of the `while (windowEnd > oneYearAgo)` loop. Currently it makes one request per window with no cursor loop; replace it with a `do/while` that follows the cursor:

```typescript
// Replace the inner try-block (lines ~51-92) with:
      try {
        let cursor: string | null = null;
        do {
          const body: Record<string, unknown> = {
            ClientToken: getMewsClientToken(),
            AccessToken: accessToken,
            Client: 'Mews Sandbox Manager',
            UpdatedUtc: {
              StartUtc: windowStart.toISOString(),
              EndUtc: windowEnd.toISOString(),
            },
            ...(state && { State: state }),
            Limitation: {
              Count: 1000,
              ...(cursor && { Cursor: cursor }),
            },
          };

          const fetchOptions: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          };

          const response = logId
            ? await loggedFetch(url, fetchOptions, {
                unifiedLogId: logId,
                group: 'bills',
                endpoint: 'bills/getAll',
              })
            : await fetch(url, fetchOptions);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.warn(
              `[BILL-SERVICE] Window ${windowCount} failed: ${response.status} - ${errorData.Message || response.statusText}`
            );
            break; // skip remaining pages in this window
          }

          const data = await response.json();
          const bills: Bill[] = data.Bills || [];
          for (const bill of bills) {
            allBills.set(bill.Id, bill);
          }
          cursor = data.Cursor ?? null;
          console.log(
            `[BILL-SERVICE] Window ${windowCount}: page cursor=${cursor ?? 'none'}, ${bills.length} bills (${allBills.size} unique total)`
          );
        } while (cursor !== null);
      } catch (windowError) {
        console.warn(`[BILL-SERVICE] Window ${windowCount} error:`, windowError);
      }
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
npx vitest run lib/bill-service.test.ts --reporter=verbose
```

Expected: PASS — cursor followed, both pages returned.

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/bill-service.ts lib/bill-service.test.ts
git commit -m "fix(bill-service): follow cursor pagination in getBills to prevent silent data loss"
```

---

## Task 2: Eliminate N+1 API calls in `closeBillsForEnvironment`

**Files:**
- Modify: `lib/bill-service.ts` — add `fetchItemsForBills` helper, extract `processSingleBill`, refactor `closeBillsForEnvironment`
- Modify: `lib/bill-service.test.ts` — add N+1 test

**Context:** The current loop calls `getOrderItems` + `getPaymentItems` once per bill. With 500 open bills that's ~1000 sequential network hops. Both Mews endpoints accept an array of `BillIds`, so we can fetch all at once.

- [ ] **Step 1: Add the N+1 test to `lib/bill-service.test.ts`**

Add this describe block inside the existing `describe('getBills', ...)` file (or alongside it):

```typescript
import { closeBillsForEnvironment } from './bill-service';
import { fetchTimezoneFromConfiguration } from './timezone-service';

describe('closeBillsForEnvironment', () => {
  it('fetches order items and payment items in two batch calls, not N calls per bill', async () => {
    const openBills = [
      { Id: 'bill-1', AccountId: 'acc-1', State: 'Open' },
      { Id: 'bill-2', AccountId: 'acc-2', State: 'Open' },
      { Id: 'bill-3', AccountId: 'acc-3', State: 'Open' },
    ];

    const fetchMock = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      const body = JSON.parse(opts.body as string);
      const url = _url as string;

      // bills/getAll — return our 3 open bills
      if (url.includes('bills/getAll')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ Bills: openBills, Cursor: null }),
        });
      }
      // orderItems/getAll — return items for all 3 bills in one shot
      if (url.includes('orderItems/getAll')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            OrderItems: body.BillIds.map((id: string) => ({
              Id: `item-${id}`,
              BillId: id,
              Amount: { Currency: 'EUR', GrossValue: 100 },
              ConsumedUtc: '2020-01-01T00:00:00Z', // old, won't be skipped
            })),
          }),
        });
      }
      // payments/getAll
      if (url.includes('payments/getAll')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ Payments: [] }),
        });
      }
      // payments/addExternal
      if (url.includes('payments/addExternal')) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      // bills/close
      if (url.includes('bills/close')) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    await closeBillsForEnvironment('access-token');

    // Count how many times orderItems/getAll and payments/getAll were called
    const orderItemCalls = fetchMock.mock.calls.filter(([url]) =>
      (url as string).includes('orderItems/getAll')
    );
    const paymentCalls = fetchMock.mock.calls.filter(([url]) =>
      (url as string).includes('payments/getAll')
    );

    // Should be exactly 1 batch call each, not 3 (one per bill)
    expect(orderItemCalls).toHaveLength(1);
    expect(paymentCalls).toHaveLength(1);

    // The batch call should include all 3 bill IDs
    const orderCallBody = JSON.parse(orderItemCalls[0][1].body as string);
    expect(orderCallBody.BillIds).toEqual(['bill-1', 'bill-2', 'bill-3']);
  });
});
```

- [ ] **Step 2: Run to confirm it fails (should show 3 calls instead of 1)**

```bash
npx vitest run lib/bill-service.test.ts --reporter=verbose
```

Expected: FAIL — `orderItemCalls` has length 3.

- [ ] **Step 3: Add `fetchItemsForBills` private helper to `lib/bill-service.ts`**

Insert this function before `closeBillsForEnvironment`:

```typescript
/**
 * Fetch items (order items or payments) for a set of bill IDs in chunked batch requests.
 * Avoids N+1: instead of one API call per bill, makes ceil(N/chunkSize) calls total.
 */
async function fetchItemsForBills<T>(
  accessToken: string,
  billIds: string[],
  endpoint: string,
  responseKey: string,
  logId?: string,
  chunkSize = 200
): Promise<T[]> {
  const allItems: T[] = [];
  for (let i = 0; i < billIds.length; i += chunkSize) {
    const chunk = billIds.slice(i, i + chunkSize);
    const url = `${getMewsApiUrl()}/api/connector/v1/${endpoint}`;
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: getMewsClientToken(),
        AccessToken: accessToken,
        Client: 'Mews Sandbox Manager',
        BillIds: chunk,
        Limitation: { Count: 1000 },
      }),
    };
    const response = logId
      ? await loggedFetch(url, fetchOptions, { unifiedLogId: logId, group: 'bills', endpoint })
      : await fetch(url, fetchOptions);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch ${endpoint}: ${response.status} - ${err.Message || response.statusText}`
      );
    }
    const data = await response.json();
    allItems.push(...(data[responseKey] ?? []));
  }
  return allItems;
}
```

- [ ] **Step 4: Extract `processSingleBill` private helper**

Insert this function after `fetchItemsForBills` and before `closeBillsForEnvironment`. It replaces the `try/catch` block inside the old loop:

```typescript
/**
 * Process a single bill: compute net balance using pre-fetched lookup maps,
 * post payment if needed, then close the bill.
 * Called from the concurrent batch phase — no network calls for data fetching.
 */
async function processSingleBill(
  bill: Bill,
  accessToken: string,
  currency: string,
  ordersByBill: Map<string, OrderItem[]>,
  paymentsByBill: Map<string, PaymentItem[]>,
  logId?: string
): Promise<BillCloseResult> {
  const result: BillCloseResult = {
    billId: bill.Id,
    accountId: bill.AccountId,
    success: false,
  };

  const items = ordersByBill.get(bill.Id) ?? [];

  if (items.length === 0) {
    result.error = 'Skipped: bill has no order items';
    return result;
  }

  if (hasRecentOrFutureItems(items)) {
    result.error = 'Skipped: bill has order items consumed within the past 5 days or in the future';
    return result;
  }

  const paymentItems = paymentsByBill.get(bill.Id) ?? [];
  const { total: orderTotal } = calculateBillTotal(items);
  let existingPaymentTotal = 0;
  for (const payment of paymentItems) {
    if (payment.Amount && typeof payment.Amount.GrossValue === 'number') {
      existingPaymentTotal += payment.Amount.GrossValue;
    }
  }
  const netBalance = orderTotal + existingPaymentTotal;
  result.totalAmount = netBalance;
  result.currency = currency;

  console.log(
    `[BILL-SERVICE] Bill ${bill.Id}: order ${orderTotal}, payments ${existingPaymentTotal}, net ${netBalance} ${currency}`
  );

  if (netBalance !== 0) {
    const { success, error, alreadyClosed } = await addExternalPayment(
      accessToken,
      bill.AccountId,
      netBalance,
      currency,
      bill.Id,
      logId
    );
    if (!success) {
      result.error = `Failed to post payment: ${error}`;
      return result;
    }
    if (alreadyClosed) {
      result.success = true;
      result.paymentPosted = false;
      return result;
    }
    result.paymentPosted = true;
  } else {
    result.paymentPosted = false;
  }

  const { success: closeSuccess, error: closeError } = await closeBill(
    accessToken,
    bill.Id,
    logId
  );

  if (!closeSuccess) {
    result.error = `Failed to close bill: ${closeError}`;
    return result;
  }

  result.success = true;
  return result;
}
```

- [ ] **Step 5: Rewrite `closeBillsForEnvironment` to use batch fetch + concurrent close**

Replace the entire existing `closeBillsForEnvironment` function body (everything inside the exported function) with:

```typescript
export async function closeBillsForEnvironment(
  accessToken: string,
  logId?: string,
  currencyOverride?: string
): Promise<CloseBillsResult> {
  console.log('[BILL-SERVICE] Starting bill closure process');

  // Resolve currency — skip config fetch if caller already has it
  let currency = currencyOverride;
  if (!currency) {
    const config = await fetchTimezoneFromConfiguration(getMewsClientToken(), accessToken, logId);
    currency = config.currency;
  }

  if (!currency) {
    console.error('[BILL-SERVICE] Failed to get currency from configuration');
    return { totalBills: 0, successCount: 0, failureCount: 0, details: [] };
  }

  console.log(`[BILL-SERVICE] Using currency: ${currency}`);

  const { bills, error: fetchError } = await getBills(accessToken, 'Open', logId);
  if (fetchError) {
    console.error('[BILL-SERVICE] Failed to fetch bills:', fetchError);
    return { totalBills: 0, successCount: 0, failureCount: 0, details: [] };
  }

  const openBills = bills.filter((bill) => !bill.State || bill.State === 'Open');
  if (openBills.length !== bills.length) {
    console.log(`[BILL-SERVICE] Filtered out ${bills.length - openBills.length} non-open bills`);
  }
  console.log(`[BILL-SERVICE] Found ${openBills.length} open bills to close`);

  if (openBills.length === 0) {
    return { totalBills: 0, successCount: 0, failureCount: 0, details: [] };
  }

  const billIds = openBills.map((b) => b.Id);

  // Phase 1: Batch-fetch all order items and payment items in parallel (2 calls total)
  const [allOrderItems, allRawPayments] = await Promise.all([
    fetchItemsForBills<OrderItem>(accessToken, billIds, 'orderItems/getAll', 'OrderItems', logId),
    fetchItemsForBills<PaymentItem>(accessToken, billIds, 'payments/getAll', 'Payments', logId),
  ]);

  // Build lookup maps so processSingleBill needs zero network calls for data
  const ordersByBill = new Map<string, OrderItem[]>();
  for (const item of allOrderItems) {
    const list = ordersByBill.get(item.BillId) ?? [];
    list.push(item);
    ordersByBill.set(item.BillId, list);
  }

  const paymentsByBill = new Map<string, PaymentItem[]>();
  for (const p of allRawPayments.filter((p) => !p.State || p.State === 'Charged')) {
    const list = paymentsByBill.get(p.BillId) ?? [];
    list.push(p);
    paymentsByBill.set(p.BillId, list);
  }

  // Phase 2: Close bills with bounded concurrency (payment + close per bill)
  const CLOSE_CONCURRENCY = 10;
  const results: BillCloseResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < openBills.length; i += CLOSE_CONCURRENCY) {
    const chunk = openBills.slice(i, i + CLOSE_CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map((bill) =>
        processSingleBill(bill, accessToken, currency!, ordersByBill, paymentsByBill, logId)
      )
    );
    for (const r of chunkResults) {
      results.push(r);
      if (r.success) successCount++;
      else failureCount++;
    }
  }

  console.log(
    `[BILL-SERVICE] Bill closure complete: ${successCount} succeeded, ${failureCount} failed`
  );

  return { totalBills: openBills.length, successCount, failureCount, details: results };
}
```

- [ ] **Step 6: Delete the now-unused `getOrderItems` and `getPaymentItems` exported functions**

Remove the exported functions `getOrderItems` (lines ~110–157) and `getPaymentItems` (lines ~162–213) from `lib/bill-service.ts` — they are fully replaced by `fetchItemsForBills`. Verify no other file imports them first:

```bash
grep -r "getOrderItems\|getPaymentItems" /Users/charlie.delamare/projects/mews-free-trial/.claude/worktrees/eager-antonelli --include="*.ts" --include="*.tsx"
```

Expected: only `lib/bill-service.ts` and `lib/bill-service.test.ts` reference them. If any test imports them directly, update the test to use `closeBillsForEnvironment` end-to-end instead.

- [ ] **Step 7: Run the test to confirm N+1 fix passes**

```bash
npx vitest run lib/bill-service.test.ts --reporter=verbose
```

Expected: both tests PASS. `orderItemCalls` has length 1.

- [ ] **Step 8: Run full test suite**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 9: Build to catch type errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 10: Commit**

```bash
git add lib/bill-service.ts lib/bill-service.test.ts
git commit -m "perf(bill-service): batch-fetch order/payment items to eliminate N+1 API calls

Before: 3-4 sequential API calls per bill (getOrderItems + getPaymentItems + addPayment + close)
After: 2 batch calls for all bills in Phase 1, then concurrent close in Phase 2

500 open bills: ~1500 API calls → ~12 calls"
```

---

## Task 3: Pass `currency` from reset-service to skip redundant config fetch

**Files:**
- Modify: `lib/reset-service.ts` — pass `config.currency` to `closeBillsForEnvironment`
- Modify: `lib/bill-service.test.ts` — add test for currency skip

**Context:** `closeBillsForEnvironment` calls `fetchTimezoneFromConfiguration` to get the currency. During a full reset, Step 1 already fetched this. Passing the known currency eliminates the duplicate network hop.

- [ ] **Step 1: Add test verifying config fetch is skipped when currency is provided**

Add this `it` block inside `describe('closeBillsForEnvironment', ...)` in `lib/bill-service.test.ts`:

```typescript
  it('skips fetchTimezoneFromConfiguration when currencyOverride is provided', async () => {
    const { fetchTimezoneFromConfiguration } = await import('./timezone-service');
    const configSpy = vi.mocked(fetchTimezoneFromConfiguration);

    const fetchMock = vi.fn().mockImplementation((_url: string) => {
      const url = _url as string;
      if (url.includes('bills/getAll')) {
        return Promise.resolve({ ok: true, json: async () => ({ Bills: [], Cursor: null }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await closeBillsForEnvironment('access-token', undefined, 'USD');

    // Config should NOT have been called — currency was already provided
    expect(configSpy).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npx vitest run lib/bill-service.test.ts --reporter=verbose
```

Expected: FAIL — `configSpy` is called once despite `currencyOverride` being provided (because the old code always calls it).

> This test should already pass after Task 2 since we added `currencyOverride` logic. If it passes, move on.

- [ ] **Step 3: Update `reset-service.ts` call site to pass `config.currency`**

In `lib/reset-service.ts`, find the Step 7 call to `closeBillsForEnvironment` (around line 621):

```typescript
// Before:
const billsResult = await closeBillsForEnvironment(accessToken, log.id);

// After:
const billsResult = await closeBillsForEnvironment(accessToken, log.id, config.currency);
```

`config` is the `TimezoneConfig` returned in Step 1 — it already has the `currency` field.

- [ ] **Step 4: Run full test suite**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/reset-service.ts lib/bill-service.test.ts
git commit -m "perf(reset-service): pass pre-fetched currency to closeBillsForEnvironment

Eliminates one redundant configuration/get API call per reset cycle."
```

---

## Task 4: Parallelize reservation fetches in reset Steps 3 & 4

**Files:**
- Modify: `lib/reset-service.ts` — merge Steps 3 and 4 into a single parallel fetch phase

**Context:** Steps 3 (Confirmed/Optional) and 4 (Started) each loop over every service and call `getAllReservationsWithPagination` serially. These queries are independent — they can run in parallel per service, halving the reservation-fetch wall-clock time.

- [ ] **Step 1: Add a timing test for parallel fetch to `lib/bill-service.test.ts`**

Create `lib/reset-service.test.ts` (new file):

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

vi.mock('./prisma', () => ({
  prisma: {
    unifiedLog: {
      create: vi.fn().mockResolvedValue({ id: 'log-1' }),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('./unified-logger', () => ({
  createResetLog: vi.fn().mockResolvedValue({ id: 'log-1' }),
  updateUnifiedLog: vi.fn().mockResolvedValue({}),
  updateEnvironmentCustomerStats: vi.fn().mockResolvedValue({}),
}));

vi.mock('./mews-data-service', () => ({
  fetchAllMewsData: vi.fn().mockResolvedValue([
    {
      serviceId: 'svc-1',
      rates: [{ id: 'rate-1', name: 'Rate 1', isPublic: true }],
      resourceCategories: [],
      ageCategories: { adult: 'age-1' },
      vouchersByRate: new Map(),
    },
  ]),
}));

vi.mock('./bill-service', () => ({
  closeBillsForEnvironment: vi.fn().mockResolvedValue({
    totalBills: 0,
    successCount: 0,
    failureCount: 0,
    details: [],
  }),
}));

vi.mock('./reservation-service', () => ({
  createReservationsForEnvironment: vi.fn().mockResolvedValue({
    successCount: 0,
    failureCount: 0,
    customerIds: [],
  }),
}));

vi.mock('./timezone-service', () => ({
  fetchTimezoneFromConfiguration: vi.fn().mockResolvedValue({
    timezone: 'Europe/London',
    currency: 'GBP',
    defaultLanguageCode: 'en-GB',
    nowUtc: new Date().toISOString(),
  }),
}));

vi.mock('@/lib/config', () => ({
  getMewsClientToken: () => 'test-client-token',
  getMewsApiUrl: () => 'https://api.mews-demo.com',
}));

describe('resetEnvironment reservation fetching', () => {
  it('fetches Confirmed/Optional and Started reservations in parallel (not serial)', async () => {
    const callOrder: string[] = [];
    const DELAY = 20; // ms artificial delay per call

    global.fetch = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      const body = JSON.parse(opts.body as string);
      const states: string[] = body.States ?? [];
      const label = states.join('/');
      callOrder.push(`start:${label}`);

      return new Promise((resolve) => {
        setTimeout(() => {
          callOrder.push(`end:${label}`);
          resolve({
            ok: true,
            json: async () => ({ Reservations: [], Cursor: null }),
          } as Response);
        }, DELAY);
      });
    });

    const { resetEnvironment } = await import('./reset-service');
    await resetEnvironment('access-token', 'enterprise-1', 1);

    // If fetches are parallel, the second "start" should appear before the first "end"
    const confirmedStart = callOrder.indexOf('start:Confirmed/Optional');
    const startedStart = callOrder.indexOf('start:Started');
    const confirmedEnd = callOrder.indexOf('end:Confirmed/Optional');

    // startedStart should come BEFORE confirmedEnd (overlap = parallel)
    expect(startedStart).toBeLessThan(confirmedEnd);
    // Both should have started before either ended
    expect(confirmedStart).toBeLessThan(confirmedEnd);
    expect(startedStart).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npx vitest run lib/reset-service.test.ts --reporter=verbose
```

Expected: FAIL — serial execution means `start:Started` appears after `end:Confirmed/Optional`.

- [ ] **Step 3: Refactor Steps 3 & 4 in `lib/reset-service.ts` to run in parallel**

Find the Step 3 and Step 4 blocks (approximately lines 499–578). Replace both blocks — the entire Step 3 loop and Step 4 loop — with this combined implementation:

```typescript
    // ========================================
    // STEPS 3 & 4: Fetch all reservation states in parallel per service
    // ========================================
    console.log(`[RESET-SERVICE] Steps 3–4/9: Fetching Confirmed/Optional and Started reservations in parallel...`);

    const allReservations: Reservation[] = [];
    const missedDepartureReservations: Reservation[] = [];

    const serviceReservationResults = await Promise.all(
      allMewsData.map(async (serviceData) => {
        const [
          { reservations: confirmedOpt, error: confError },
          { reservations: started, error: startedError },
        ] = await Promise.all([
          getAllReservationsWithPagination(
            accessToken,
            serviceData.serviceId,
            ['Confirmed', 'Optional'],
            log.id
          ),
          getAllReservationsWithPagination(
            accessToken,
            serviceData.serviceId,
            ['Started'],
            log.id
          ),
        ]);
        return { serviceId: serviceData.serviceId, confirmedOpt, started, confError, startedError };
      })
    );

    for (const { serviceId, confirmedOpt, started, confError, startedError } of serviceReservationResults) {
      if (confError) details.errors?.push(`Service ${serviceId} (Confirmed/Optional): ${confError}`);
      if (startedError) details.errors?.push(`Service ${serviceId} (Started): ${startedError}`);

      allReservations.push(...confirmedOpt);
      console.log(`[RESET-SERVICE]   Service ${serviceId}: ${confirmedOpt.length} Confirmed/Optional reservations`);

      const missed = started.filter(
        (r) => r.ScheduledEndUtc && r.ScheduledEndUtc < now.toISOString()
      );
      missedDepartureReservations.push(...missed);
      console.log(
        `[RESET-SERVICE]   Service ${serviceId}: ${started.length} Started, ${missed.length} missed departures`
      );
    }

    details.reservationsFetched = allReservations.length;
    details.missedDeparturesFetched = missedDepartureReservations.length;

    await updateUnifiedLog(log.id, { currentStep: 3, operationDetails: details });
    console.log(`[RESET-SERVICE] ✓ Found ${allReservations.length} reservations to cancel, ${missedDepartureReservations.length} missed departures`);

    // Process missed departures (was Step 4 — now follows directly from data above)
    if (missedDepartureReservations.length > 0) {
      const missedIds = missedDepartureReservations.map((r) => r.Id);
      const { successCount: processedCount, failureCount: processFailed } =
        await processReservationsInBatches(accessToken, missedIds, log.id);

      details.missedDeparturesProcessed = processedCount;
      details.missedDeparturesProcessFailed = processFailed;
      if (processFailed > 0) details.errors?.push(`Failed to process ${processFailed} missed departure reservations`);
      console.log(`[RESET-SERVICE] ✓ Processed ${processedCount} missed departures (${processFailed} failed)`);
    } else {
      details.missedDeparturesProcessed = 0;
      details.missedDeparturesProcessFailed = 0;
      console.log(`[RESET-SERVICE] ✓ No missed departures to process`);
    }

    await updateUnifiedLog(log.id, { currentStep: 4, operationDetails: details });
```

Also update `totalSteps` in `createResetLog` — it remains 9 since we kept the same step numbering.

- [ ] **Step 4: Run the test to confirm it passes**

```bash
npx vitest run lib/reset-service.test.ts --reporter=verbose
```

Expected: PASS — `start:Started` appears before `end:Confirmed/Optional`.

- [ ] **Step 5: Run full test suite**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 6: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add lib/reset-service.ts lib/reset-service.test.ts
git commit -m "perf(reset-service): parallelize Steps 3+4 reservation fetches per service

Fetching Confirmed/Optional and Started reservations now runs concurrently per service.
For a property with 5 time windows, this halves reservation-fetch wall-clock time."
```

---

## Task 5: Remove artificial 100 ms sleep in customer service

**Files:**
- Modify: `lib/customer-service.ts`
- Modify: `lib/customer-service.test.ts` — add timing test

**Context:** `processBatch` has a hardcoded 100 ms `setTimeout` between every chunk of 5 customers. With 300 customers that's 59 sleeps × 100 ms = ~6 seconds of pure wait. The rate limiter already enforces the 200 req/30s budget; this sleep is redundant.

- [ ] **Step 1: Add timing test to `lib/customer-service.test.ts`**

Find the existing test file and add this test inside the main describe block:

```typescript
  it('processes all customers without artificial delay (no sleep between chunks)', async () => {
    const twoCustomers = [
      { FirstName: 'A', LastName: 'B', Email: 'a@example.com', Phone: '+1', BirthDate: null, Sex: 'Male', Title: null, NationalityCode: 'US', PreferredLanguageCode: 'en-US', Classifications: [], Notes: null },
      { FirstName: 'C', LastName: 'D', Email: 'c@example.com', Phone: '+1', BirthDate: null, Sex: 'Female', Title: null, NationalityCode: 'US', PreferredLanguageCode: 'en-US', Classifications: [], Notes: null },
    ];
    mockGetSampleCustomers.mockReturnValue(twoCustomers);

    // Patch the mocked fetch (already set up in beforeEach as global.fetch)
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Id: 'cust-xyz' }),
    });
    global.fetch = mockFetch;

    // Also mock the rate limiter so it calls through immediately
    vi.mock('./mews-rate-limiter', () => ({
      fetchWithRateLimit: vi.fn((_url: string, _token: string, opts: RequestInit) =>
        global.fetch(_url, opts)
      ),
      mewsRateLimiter: {
        executeRequest: vi.fn((_token: string, fn: () => Promise<Response>) => fn()),
      },
    }));

    const start = Date.now();
    await createSampleCustomers('access-token', 'enterprise-1', 1);
    const elapsed = Date.now() - start;

    // With the sleep: min 100ms (one inter-chunk pause for 2 customers, 1 chunk done)
    // Without the sleep: should complete in well under 50ms
    expect(elapsed).toBeLessThan(200); // generous ceiling; proves sleep is gone
  });
```

- [ ] **Step 2: Run to verify the test reflects reality (may already pass — record baseline)**

```bash
npx vitest run lib/customer-service.test.ts --reporter=verbose
```

Note the elapsed time shown by the test. If the sleep is still present it will be ≥100 ms.

- [ ] **Step 3: Delete the sleep in `lib/customer-service.ts`**

In `lib/customer-service.ts`, inside `processBatch`, delete lines 238–240:

```typescript
    // DELETE these 3 lines:
    if (i + concurrency < customers.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
```

The chunk loop now looks like:

```typescript
  for (let i = 0; i < customers.length; i += concurrency) {
    const chunk = customers.slice(i, i + concurrency);
    const promises = chunk.map(customer => createSingleCustomer(accessToken, customer, language, logId));
    const settledResults = await Promise.allSettled(promises);
    const chunkResults = settledResults.map((result, index) => {
      if (result.status === 'fulfilled') return result.value;
      return {
        email: chunk[index].Email,
        success: false,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      };
    });
    results.push(...chunkResults);
  }
```

- [ ] **Step 4: Run test suite**

```bash
npm run test
```

Expected: all tests pass, elapsed time for the new test is well under 200 ms.

- [ ] **Step 5: Commit**

```bash
git add lib/customer-service.ts lib/customer-service.test.ts
git commit -m "perf(customer-service): remove artificial 100ms inter-chunk sleep

The rate limiter already enforces the 200 req/30s budget. The sleep added
~6 seconds of pure wait on every 300-customer creation run."
```

---

## Task 6: Fix unbounded `inflightPromises` array in `ApiCallLogBuffer`

**Files:**
- Modify: `lib/api-call-logger.ts`
- Create: `tests/lib/api-call-logger.test.ts`

**Context:** `inflightPromises` accumulates every `createMany` promise and is never pruned until `drain()` is called. During a reset with 300+ API calls, this array grows unboundedly. Replace it with a resolver-notification pattern: `drain()` registers itself for a callback that fires when `inflightCount` drops to zero.

- [ ] **Step 1: Create `tests/lib/api-call-logger.test.ts` with the memory test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    apiCallLog: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

describe('ApiCallLogBuffer drain', () => {
  it('resolves drain() after all in-flight writes complete without holding promise references', async () => {
    // Import the module fresh for each test to get a clean buffer
    vi.resetModules();
    const { loggedFetch } = await import('../../../lib/api-call-logger');
    const { prisma } = await import('../../../lib/prisma');

    const createManySpy = vi.mocked(prisma.apiCallLog.createMany);

    // Simulate 60 logged fetch calls (more than BATCH_SIZE=50, triggers a flush)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const logContext = {
      unifiedLogId: 'log-1',
      group: 'customers' as const,
      endpoint: 'customers/add',
    };

    for (let i = 0; i < 60; i++) {
      // Only log errors; simulate one error call to get buffer entries
    }

    // Simulate one error response to get an entry into the buffer
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      clone: () => ({ text: async () => 'Error' }),
      json: async () => ({}),
    } as unknown as Response);

    await loggedFetch('https://api.mews-demo.com/api/connector/v1/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }, logContext).catch(() => {});

    const { flushApiCallLogs } = await import('../../../lib/api-call-logger');

    // drain() must resolve without hanging
    await expect(flushApiCallLogs()).resolves.toBeUndefined();
    expect(createManySpy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to confirm current behavior (should pass, but validates the test setup)**

```bash
npx vitest run tests/lib/api-call-logger.test.ts --reporter=verbose
```

Expected: PASS (drain already works; this is a regression guard).

- [ ] **Step 3: Refactor `ApiCallLogBuffer` in `lib/api-call-logger.ts`**

Replace the class body — keep the public `add`, `flush`, and `drain` API identical, but eliminate `inflightPromises`:

```typescript
class ApiCallLogBuffer {
  private buffer: ApiCallLogEntry[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private inflightCount = 0;
  private drainResolvers: Array<() => void> = [];
  private droppedEntryCount = 0;

  add(entry: ApiCallLogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length >= BATCH_SIZE) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS);
    }
  }

  flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const entries = this.buffer.splice(0);
    if (entries.length === 0) return;

    if (this.inflightCount >= MAX_INFLIGHT_WRITES) {
      this.droppedEntryCount += entries.length;
      console.warn(
        `[API-CALL-LOG] Dropping ${entries.length} log entries: ` +
          `${this.inflightCount} DB writes in-flight (max ${MAX_INFLIGHT_WRITES})`
      );
      return;
    }

    this.inflightCount++;

    prisma.apiCallLog
      .createMany({
        data: entries.map((e) => ({
          unifiedLogId: e.unifiedLogId,
          endpoint: e.endpoint,
          method: e.method,
          url: e.url,
          group: e.group,
          statusCode: e.statusCode,
          durationMs: e.durationMs,
          success: e.success,
          requestBody: e.requestBody,
          responseBody: e.responseBody,
          errorMessage: e.errorMessage,
          metadata: e.metadata ?? undefined,
        })),
      })
      .catch((err: Error) => {
        console.error(`[API-CALL-LOG] Failed to persist ${entries.length} log entries:`, err.message);
      })
      .finally(() => {
        this.inflightCount--;
        // Notify drain() callers if all writes have settled
        if (this.inflightCount === 0) {
          const resolvers = this.drainResolvers.splice(0);
          for (const resolve of resolvers) resolve();
        }
      });
  }

  async drain(): Promise<void> {
    this.flush();
    if (this.inflightCount > 0) {
      await new Promise<void>((resolve) => this.drainResolvers.push(resolve));
    }
    if (this.droppedEntryCount > 0) {
      console.warn(`[API-CALL-LOG] Total dropped entries during this session: ${this.droppedEntryCount}`);
      this.droppedEntryCount = 0;
    }
  }
}
```

- [ ] **Step 4: Run the test to confirm it still passes**

```bash
npx vitest run tests/lib/api-call-logger.test.ts --reporter=verbose
```

Expected: PASS.

- [ ] **Step 5: Run full test suite**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 6: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add lib/api-call-logger.ts tests/lib/api-call-logger.test.ts
git commit -m "fix(api-call-logger): replace unbounded inflightPromises array with drain-resolver pattern

Previous: inflightPromises grew indefinitely during long operations (300+ API calls).
Now: resolved via a notification callback when inflightCount reaches zero."
```

---

## Self-Review

### Spec coverage check

| Bottleneck from analysis | Task |
|--------------------------|------|
| N+1 in `closeBillsForEnvironment` | Task 2 ✓ |
| Missing cursor pagination in `getBills` | Task 1 ✓ |
| Serial Steps 3 & 4 in reset | Task 4 ✓ |
| Redundant `fetchTimezoneFromConfiguration` | Task 3 ✓ |
| Artificial 100ms sleep in customer service | Task 5 ✓ |
| `inflightPromises` memory leak | Task 6 ✓ |

### Placeholder scan

No TBDs, TODOs, or "similar to Task N" placeholders. All code blocks are complete.

### Type consistency

- `OrderItem.BillId` and `PaymentItem.BillId` verified in `types/reset.ts` — used in lookup maps in Task 2.
- `closeBillsForEnvironment` new signature `(accessToken, logId?, currencyOverride?)` — used correctly in Task 3 call site.
- `config.currency` in `reset-service.ts` is `string | undefined` from `TimezoneConfig` — the `currencyOverride` param is also `string | undefined`, types align.
- `processSingleBill` takes `Map<string, OrderItem[]>` and `Map<string, PaymentItem[]>` — built in Task 2 Phase 1 and passed correctly.
