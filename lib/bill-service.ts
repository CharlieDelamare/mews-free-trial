/**
 * Bill Service
 * Handles all bill-related operations for environment reset
 */

import type { Bill, OrderItem, PaymentItem, BillCloseResult, CloseBillsResult } from '@/types/reset';
import { fetchTimezoneFromConfiguration } from './timezone-service';
import { loggedFetch } from './api-call-logger';
import { getMewsClientToken, getMewsApiUrl } from '@/lib/config';

/**
 * Check if a Mews API error indicates that the bill is already closed.
 * Mews returns "Invalid BillId." when attempting to close or post payment to
 * a bill that is no longer open.
 */
function isAlreadyClosedError(errorMessage: string): boolean {
  return errorMessage.includes('Invalid BillId');
}

/**
 * Fetch bills from Mews API across the past year using multiple 90-day windows.
 * The Mews API limits UpdatedUtc ranges to ~90 days per request, so we make
 * sequential requests and deduplicate by bill ID.
 */
export async function getBills(
  accessToken: string,
  state?: string,
  logId?: string
): Promise<{ bills: Bill[]; error?: string }> {
  try {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const WINDOW_DAYS = 90;
    const allBills = new Map<string, Bill>();
    const url = `${getMewsApiUrl()}/api/connector/v1/bills/getAll`;
    let windowCount = 0;

    let windowEnd = now;
    while (windowEnd > oneYearAgo) {
      const windowStart = new Date(windowEnd);
      windowStart.setDate(windowStart.getDate() - WINDOW_DAYS);
      if (windowStart < oneYearAgo) windowStart.setTime(oneYearAgo.getTime());

      windowCount++;
      console.log(
        `[BILL-SERVICE] Fetching bills window ${windowCount}: ${windowStart.toISOString()} to ${windowEnd.toISOString()}`
      );

      try {
        let cursor: string | null = null;
        do {
          const body: Record<string, unknown> = {
            ClientToken: getMewsClientToken(),
            AccessToken: accessToken,
            Client: 'Mews Sandbox Manager',
            UpdatedUtc: { StartUtc: windowStart.toISOString(), EndUtc: windowEnd.toISOString() },
            ...(state && { State: state }),
            Limitation: { Count: 1000, ...(cursor && { Cursor: cursor }) },
          };
          const fetchOptions: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          };
          const response = logId
            ? await loggedFetch(url, fetchOptions, { unifiedLogId: logId, group: 'bills', endpoint: 'bills/getAll' })
            : await fetch(url, fetchOptions);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.warn(`[BILL-SERVICE] Window ${windowCount} failed: ${response.status} - ${errorData.Message || response.statusText}`);
            break; // abandon remaining pages for this window; outer loop continues to next window
          }
          const data = await response.json();
          const bills: Bill[] = data.Bills || [];
          for (const bill of bills) {
            allBills.set(bill.Id, bill);
          }
          cursor = data.Cursor ?? null;
          console.log(`[BILL-SERVICE] Window ${windowCount}: ${bills.length} bills (${allBills.size} total)`);
        } while (cursor !== null);
      } catch (windowError) {
        console.warn(`[BILL-SERVICE] Window ${windowCount} error:`, windowError);
      }

      windowEnd = windowStart;
    }

    console.log(`[BILL-SERVICE] Fetched ${allBills.size} unique bills across ${windowCount} windows`);
    return { bills: Array.from(allBills.values()) };
  } catch (error) {
    console.error('[BILL-SERVICE] Error fetching bills:', error);
    return {
      bills: [],
      error: error instanceof Error ? error.message : 'Unknown error fetching bills'
    };
  }
}

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
      throw new Error(`Failed to fetch ${endpoint}: ${response.status} - ${err.Message || response.statusText}`);
    }
    const data = await response.json();
    allItems.push(...(data[responseKey] ?? []));
  }
  return allItems;
}

/**
 * Process a single bill using pre-fetched lookup maps — no network calls for data fetching.
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

/**
 * Calculate bill total from order items and extract currency
 */
export function calculateBillTotal(orderItems: OrderItem[]): {
  total: number;
  currency: string | null;
} {
  if (orderItems.length === 0) {
    return { total: 0, currency: null };
  }

  let total = 0;
  let currency: string | null = null;

  for (const item of orderItems) {
    if (item.Amount && typeof item.Amount.GrossValue === 'number') {
      total += item.Amount.GrossValue;

      // Extract currency from first item
      if (!currency && item.Amount.Currency) {
        currency = item.Amount.Currency;
      }
    }
  }

  return { total, currency };
}

/**
 * Check if any order item has a ConsumedUtc within the past 5 days or in the future.
 * Bills with such items should be skipped during closure.
 */
function hasRecentOrFutureItems(orderItems: OrderItem[]): boolean {
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  for (const item of orderItems) {
    if (item.ConsumedUtc) {
      const consumed = new Date(item.ConsumedUtc);
      if (consumed >= fiveDaysAgo) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Add external payment to an account
 */
export async function addExternalPayment(
  accessToken: string,
  accountId: string,
  amount: number,
  currency: string,
  billId?: string,
  logId?: string
): Promise<{ success: boolean; error?: string; alreadyClosed?: boolean }> {
  try {
    const payload = {
      ClientToken: getMewsClientToken(),
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      AccountId: accountId,
      ...(billId && { BillId: billId }),
      Amount: {
        Currency: currency,
        GrossValue: amount
      },
      Type: 'Cash'
    };

    console.log('[BILL-SERVICE] Adding payment with payload:', JSON.stringify(payload, null, 2));

    const url = `${getMewsApiUrl()}/api/connector/v1/payments/addExternal`;
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };

    const response = logId
      ? await loggedFetch(url, fetchOptions, {
          unifiedLogId: logId,
          group: 'bills',
          endpoint: 'payments/addExternal',
        })
      : await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.Message || response.statusText || '';

      // Mews returns "Invalid BillId." when the bill is already closed
      if (billId && isAlreadyClosedError(errorMessage)) {
        console.log(`[BILL-SERVICE] Bill ${billId} is already closed, skipping payment`);
        return { success: true, alreadyClosed: true };
      }

      throw new Error(
        `Failed to add payment: ${response.status} - ${errorMessage}`
      );
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error adding payment';

    // Also catch already-closed errors that propagated as exceptions
    if (billId && isAlreadyClosedError(errorMessage)) {
      console.log(`[BILL-SERVICE] Bill ${billId} is already closed, skipping payment`);
      return { success: true, alreadyClosed: true };
    }

    console.error('[BILL-SERVICE] Error adding payment:', error);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Close a bill
 */
export async function closeBill(
  accessToken: string,
  billId: string,
  logId?: string
): Promise<{ success: boolean; error?: string; alreadyClosed?: boolean }> {
  try {
    const payload = {
      ClientToken: getMewsClientToken(),
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      BillId: billId,
      Type: 'Receipt'
    };

    console.log('[BILL-SERVICE] Closing bill with payload:', JSON.stringify(payload, null, 2));

    const url = `${getMewsApiUrl()}/api/connector/v1/bills/close`;
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };

    const response = logId
      ? await loggedFetch(url, fetchOptions, {
          unifiedLogId: logId,
          group: 'bills',
          endpoint: 'bills/close',
        })
      : await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.Message || response.statusText || '';

      // Mews returns "Invalid BillId." when the bill is already closed
      if (isAlreadyClosedError(errorMessage)) {
        console.log(`[BILL-SERVICE] Bill ${billId} is already closed, treating as success`);
        return { success: true, alreadyClosed: true };
      }

      throw new Error(
        `Failed to close bill: ${response.status} - ${errorMessage}`
      );
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error closing bill';

    // Also catch already-closed errors that propagated as exceptions
    if (isAlreadyClosedError(errorMessage)) {
      console.log(`[BILL-SERVICE] Bill ${billId} is already closed, treating as success`);
      return { success: true, alreadyClosed: true };
    }

    console.error('[BILL-SERVICE] Error closing bill:', error);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Main orchestrator: Close all open bills for an environment
 *
 * Process:
 * 1. Fetch configuration to get currency (skipped if currencyOverride is provided)
 * 2. Fetch all open bills
 * 3. Phase 1: Batch-fetch all order items and payment items in parallel (2 calls total)
 * 4. Phase 2: Close bills with bounded concurrency (payment + close per bill)
 */
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

  console.log(`[BILL-SERVICE] Bill closure complete: ${successCount} succeeded, ${failureCount} failed`);

  return { totalBills: openBills.length, successCount, failureCount, details: results };
}
