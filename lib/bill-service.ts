/**
 * Bill Service
 * Handles all bill-related operations for environment reset
 */

import type { Bill, OrderItem, PaymentItem, BillCloseResult, CloseBillsResult } from '@/types/reset';
import { fetchTimezoneFromConfiguration } from './timezone-service';
import { loggedFetch } from './api-call-logger';

// Hardcoded Mews client token for demo environment
const MEWS_CLIENT_TOKEN = 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';
const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews-demo.com';

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
  states?: string[],
  logId?: string
): Promise<{ bills: Bill[]; error?: string }> {
  try {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const WINDOW_DAYS = 90;
    const allBills = new Map<string, Bill>();
    const url = `${MEWS_API_URL}/api/connector/v1/bills/getAll`;
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

      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientToken: MEWS_CLIENT_TOKEN,
          AccessToken: accessToken,
          Client: 'Mews Sandbox Manager',
          UpdatedUtc: {
            StartUtc: windowStart.toISOString(),
            EndUtc: windowEnd.toISOString()
          },
          ...(states && { States: states }),
          Limitation: { Count: 1000 }
        })
      };

      try {
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
        } else {
          const data = await response.json();
          const bills: Bill[] = data.Bills || [];
          for (const bill of bills) {
            allBills.set(bill.Id, bill);
          }
          console.log(`[BILL-SERVICE] Window ${windowCount}: found ${bills.length} bills (${allBills.size} unique total)`);
        }
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
 * Get order items for specific bills
 */
export async function getOrderItems(
  accessToken: string,
  billIds: string[],
  logId?: string
): Promise<{ items: OrderItem[]; error?: string }> {
  if (billIds.length === 0) {
    return { items: [] };
  }

  try {
    const url = `${MEWS_API_URL}/api/connector/v1/orderItems/getAll`;
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: MEWS_CLIENT_TOKEN,
        AccessToken: accessToken,
        Client: 'Mews Sandbox Manager',
        BillIds: billIds,
        Limitation: { Count: 1000 }
      })
    };

    const response = logId
      ? await loggedFetch(url, fetchOptions, {
          unifiedLogId: logId,
          group: 'bills',
          endpoint: 'orderItems/getAll',
        })
      : await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch order items: ${response.status} - ${errorData.Message || response.statusText}`
      );
    }

    const data = await response.json();
    return { items: data.OrderItems || [] };
  } catch (error) {
    console.error('[BILL-SERVICE] Error fetching order items:', error);
    return {
      items: [],
      error: error instanceof Error ? error.message : 'Unknown error fetching order items'
    };
  }
}

/**
 * Get existing payment items for specific bills
 */
export async function getPaymentItems(
  accessToken: string,
  billIds: string[],
  logId?: string
): Promise<{ items: PaymentItem[]; error?: string }> {
  if (billIds.length === 0) {
    return { items: [] };
  }

  try {
    const url = `${MEWS_API_URL}/api/connector/v1/payments/getAll`;
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: MEWS_CLIENT_TOKEN,
        AccessToken: accessToken,
        Client: 'Mews Sandbox Manager',
        BillIds: billIds,
        Limitation: { Count: 1000 }
      })
    };

    const response = logId
      ? await loggedFetch(url, fetchOptions, {
          unifiedLogId: logId,
          group: 'bills',
          endpoint: 'payments/getAll',
        })
      : await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch payment items: ${response.status} - ${errorData.Message || response.statusText}`
      );
    }

    const data = await response.json();
    const payments: PaymentItem[] = data.Payments || [];
    // Only include charged (settled) payments, not canceled/failed ones
    const activePayments = payments.filter(
      (p: PaymentItem) => !p.State || p.State === 'Charged'
    );
    return { items: activePayments };
  } catch (error) {
    console.error('[BILL-SERVICE] Error fetching payment items:', error);
    return {
      items: [],
      error: error instanceof Error ? error.message : 'Unknown error fetching payment items'
    };
  }
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
      ClientToken: MEWS_CLIENT_TOKEN,
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

    const url = `${MEWS_API_URL}/api/connector/v1/payments/addExternal`;
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
      ClientToken: MEWS_CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      BillId: billId,
      Type: 'Receipt'
    };

    console.log('[BILL-SERVICE] Closing bill with payload:', JSON.stringify(payload, null, 2));

    const url = `${MEWS_API_URL}/api/connector/v1/bills/close`;
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
 * 1. Fetch configuration to get currency
 * 2. Fetch all open bills
 * 3. For each bill:
 *    a. Get order items
 *    b. Skip if bill has no order items (empty bill)
 *    c. Skip if any order item was consumed within the past 5 days or in the future
 *    d. Get existing payment items
 *    e. Calculate net balance (order items + existing payments)
 *    f. If net balance != 0: Post payment to account
 *    g. Close bill (always, even if net balance = 0)
 */
export async function closeBillsForEnvironment(
  accessToken: string,
  logId?: string
): Promise<CloseBillsResult> {
  console.log('[BILL-SERVICE] Starting bill closure process');

  // Fetch configuration to get currency
  const config = await fetchTimezoneFromConfiguration(MEWS_CLIENT_TOKEN, accessToken, logId);
  const currency = config.currency;

  if (!currency) {
    console.error('[BILL-SERVICE] Failed to get currency from configuration');
    return {
      totalBills: 0,
      successCount: 0,
      failureCount: 0,
      details: []
    };
  }

  console.log(`[BILL-SERVICE] Using currency: ${currency}`);

  // Fetch all open bills
  const { bills, error: fetchError } = await getBills(accessToken, ['Open'], logId);

  if (fetchError) {
    console.error('[BILL-SERVICE] Failed to fetch bills:', fetchError);
    return {
      totalBills: 0,
      successCount: 0,
      failureCount: 0,
      details: []
    };
  }

  // Defensive filter: only process bills that are actually Open
  const openBills = bills.filter(bill => !bill.State || bill.State === 'Open');
  if (openBills.length !== bills.length) {
    console.log(`[BILL-SERVICE] Filtered out ${bills.length - openBills.length} non-open bills from results`);
  }

  console.log(`[BILL-SERVICE] Found ${openBills.length} open bills to close`);

  const results: BillCloseResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Process each bill
  for (const bill of openBills) {
    const result: BillCloseResult = {
      billId: bill.Id,
      accountId: bill.AccountId,
      success: false
    };

    try {
      // Step 1: Get order items for this bill
      const { items, error: itemsError } = await getOrderItems(accessToken, [bill.Id], logId);

      if (itemsError) {
        result.error = `Failed to get order items: ${itemsError}`;
        results.push(result);
        failureCount++;
        continue;
      }

      // Step 2: Skip bills with no order items (empty bills)
      if (items.length === 0) {
        result.error = 'Skipped: bill has no order items';
        results.push(result);
        console.log(`[BILL-SERVICE] Skipping bill ${bill.Id}: no order items`);
        continue;
      }

      // Step 3: Skip bills with recently consumed or future order items
      if (hasRecentOrFutureItems(items)) {
        result.error = 'Skipped: bill has order items consumed within the past 5 days or in the future';
        results.push(result);
        console.log(`[BILL-SERVICE] Skipping bill ${bill.Id}: has recent or future consumed items`);
        continue;
      }

      // Step 4: Get existing payment items for this bill
      const { items: paymentItems, error: paymentsError } = await getPaymentItems(accessToken, [bill.Id], logId);

      if (paymentsError) {
        result.error = `Failed to get payment items: ${paymentsError}`;
        results.push(result);
        failureCount++;
        continue;
      }

      // Step 5: Calculate net balance (order items + existing payments)
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

      console.log(`[BILL-SERVICE] Bill ${bill.Id}: Order items ${orderTotal}, existing payments ${existingPaymentTotal}, net balance ${netBalance} ${currency}`);

      // Step 6: Post payment if needed (net balance != 0)
      if (netBalance !== 0) {
        const { success: paymentSuccess, error: paymentError, alreadyClosed: paymentBillClosed } = await addExternalPayment(
          accessToken,
          bill.AccountId,
          netBalance,
          currency,
          bill.Id,
          logId
        );

        if (!paymentSuccess) {
          result.error = `Failed to post payment: ${paymentError}`;
          results.push(result);
          failureCount++;
          continue;
        }

        // If the bill was already closed, skip the close step entirely
        if (paymentBillClosed) {
          result.success = true;
          result.paymentPosted = false;
          successCount++;
          results.push(result);
          console.log(`[BILL-SERVICE] ✓ Bill ${bill.Id} was already closed (detected during payment)`);
          continue;
        }

        result.paymentPosted = true;
        console.log(`[BILL-SERVICE] Posted payment for account ${bill.AccountId}: ${netBalance} ${currency}`);
      } else {
        console.log(`[BILL-SERVICE] Skipping payment for bill ${bill.Id} (zero balance)`);
        result.paymentPosted = false;
      }

      // Step 6: Close bill (always, even if net balance = 0)
      const { success: closeSuccess, error: closeError, alreadyClosed } = await closeBill(
      // Step 7: Close bill (always, even if net balance = 0)
      const { success: closeSuccess, error: closeError } = await closeBill(
        accessToken,
        bill.Id,
        logId
      );

      if (!closeSuccess) {
        result.error = `Failed to close bill: ${closeError}`;
        results.push(result);
        failureCount++;
        continue;
      }

      result.success = true;
      successCount++;
      if (alreadyClosed) {
        console.log(`[BILL-SERVICE] ✓ Bill ${bill.Id} was already closed`);
      } else {
        console.log(`[BILL-SERVICE] ✓ Successfully closed bill ${bill.Id}`);
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error processing bill';
      failureCount++;
      console.error(`[BILL-SERVICE] Error processing bill ${bill.Id}:`, error);
    }

    results.push(result);
  }

  console.log(
    `[BILL-SERVICE] Bill closure complete: ${successCount} succeeded, ${failureCount} failed`
  );

  return {
    totalBills: openBills.length,
    successCount,
    failureCount,
    details: results
  };
}
