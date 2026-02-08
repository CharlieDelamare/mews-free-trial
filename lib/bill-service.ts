/**
 * Bill Service
 * Handles all bill-related operations for environment reset
 */

import type { Bill, OrderItem, BillCloseResult, CloseBillsResult } from '@/types/reset';
import { fetchTimezoneFromConfiguration } from './timezone-service';

// Hardcoded Mews client token for demo environment
const MEWS_CLIENT_TOKEN = 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';
const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews-demo.com';

/**
 * Fetch bills from Mews API
 */
export async function getBills(
  accessToken: string,
  states?: string[]
): Promise<{ bills: Bill[]; error?: string }> {
  try {
    const response = await fetch(`${MEWS_API_URL}/api/connector/v1/bills/getAll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: MEWS_CLIENT_TOKEN,
        AccessToken: accessToken,
        Client: 'Mews Sandbox Manager',
        ...(states && { States: states }),
        Limitation: { Count: 1000 }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch bills: ${response.status} - ${errorData.Message || response.statusText}`
      );
    }

    const data = await response.json();
    return { bills: data.Bills || [] };
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
  billIds: string[]
): Promise<{ items: OrderItem[]; error?: string }> {
  if (billIds.length === 0) {
    return { items: [] };
  }

  try {
    const response = await fetch(`${MEWS_API_URL}/api/connector/v1/orderItems/getAll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: MEWS_CLIENT_TOKEN,
        AccessToken: accessToken,
        Client: 'Mews Sandbox Manager',
        BillIds: billIds,
        Limitation: { Count: 1000 }
      })
    });

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
 * Add external payment to an account
 */
export async function addExternalPayment(
  accessToken: string,
  accountId: string,
  amount: number,
  currency: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      ClientToken: MEWS_CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      AccountId: accountId,
      Amount: {
        Currency: currency,
        GrossValue: amount
      },
      Type: 'Cash'
    };

    console.log('[BILL-SERVICE] Adding payment with payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${MEWS_API_URL}/api/connector/v1/payments/addExternal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to add payment: ${response.status} - ${errorData.Message || response.statusText}`
      );
    }

    return { success: true };
  } catch (error) {
    console.error('[BILL-SERVICE] Error adding payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error adding payment'
    };
  }
}

/**
 * Close a bill
 */
export async function closeBill(
  accessToken: string,
  billId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      ClientToken: MEWS_CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      BillId: billId,
      Type: 'Receipt'
    };

    console.log('[BILL-SERVICE] Closing bill with payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${MEWS_API_URL}/api/connector/v1/bills/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to close bill: ${response.status} - ${errorData.Message || response.statusText}`
      );
    }

    return { success: true };
  } catch (error) {
    console.error('[BILL-SERVICE] Error closing bill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error closing bill'
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
 *    b. Calculate total
 *    c. If total != 0: Post payment to account (positive or negative)
 *    d. Close bill (always, even if total = 0)
 */
export async function closeBillsForEnvironment(
  accessToken: string
): Promise<CloseBillsResult> {
  console.log('[BILL-SERVICE] Starting bill closure process');

  // Fetch configuration to get currency
  const config = await fetchTimezoneFromConfiguration(MEWS_CLIENT_TOKEN, accessToken);
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
  const { bills, error: fetchError } = await getBills(accessToken, ['Open']);

  if (fetchError) {
    console.error('[BILL-SERVICE] Failed to fetch bills:', fetchError);
    return {
      totalBills: 0,
      successCount: 0,
      failureCount: 0,
      details: []
    };
  }

  console.log(`[BILL-SERVICE] Found ${bills.length} open bills to close`);

  const results: BillCloseResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Process each bill
  for (const bill of bills) {
    const result: BillCloseResult = {
      billId: bill.Id,
      accountId: bill.AccountId,
      success: false
    };

    try {
      // Step 1: Get order items for this bill
      const { items, error: itemsError } = await getOrderItems(accessToken, [bill.Id]);

      if (itemsError) {
        result.error = `Failed to get order items: ${itemsError}`;
        results.push(result);
        failureCount++;
        continue;
      }

      // Step 2: Calculate total
      const { total } = calculateBillTotal(items);
      result.totalAmount = total;
      result.currency = currency;

      console.log(`[BILL-SERVICE] Bill ${bill.Id}: Total ${total} ${currency}`);

      // Step 3: Post payment if needed (total != 0)
      if (total !== 0) {
        const { success: paymentSuccess, error: paymentError } = await addExternalPayment(
          accessToken,
          bill.AccountId,
          total,
          currency
        );

        if (!paymentSuccess) {
          result.error = `Failed to post payment: ${paymentError}`;
          results.push(result);
          failureCount++;
          continue;
        }

        result.paymentPosted = true;
        console.log(`[BILL-SERVICE] Posted payment for account ${bill.AccountId}: ${total} ${currency}`);
      } else {
        console.log(`[BILL-SERVICE] Skipping payment for bill ${bill.Id} (zero balance)`);
        result.paymentPosted = false;
      }

      // Step 4: Close bill (always, even if total = 0)
      const { success: closeSuccess, error: closeError } = await closeBill(
        accessToken,
        bill.Id
      );

      if (!closeSuccess) {
        result.error = `Failed to close bill: ${closeError}`;
        results.push(result);
        failureCount++;
        continue;
      }

      result.success = true;
      successCount++;
      console.log(`[BILL-SERVICE] ✓ Successfully closed bill ${bill.Id}`);
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
    totalBills: bills.length,
    successCount,
    failureCount,
    details: results
  };
}
