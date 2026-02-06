/**
 * Reset Service
 * Orchestrates the complete reset flow for trial sandboxes
 */

import { prisma } from './prisma';
import { fetchMewsData } from './mews-data-service';
import { createReservationsForEnvironment } from './reservation-service';
import { closeBillsForEnvironment } from './bill-service';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { startOfDay, addDays } from 'date-fns';
import { createResetLog, updateUnifiedLog } from './unified-logger';
import type { ResetResult, ResetOperationDetails, ResetStep } from '@/types/reset';

// Hardcoded Mews client token for demo environment
const MEWS_CLIENT_TOKEN = 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';
const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews-demo.com';

interface Reservation {
  Id: string;
  [key: string]: any;
}

/**
 * Fetch configuration from Mews API (timezone only)
 */
async function getConfiguration(accessToken: string): Promise<{
  timezone: string;
  nowUtc: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${MEWS_API_URL}/api/connector/v1/configuration/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: MEWS_CLIENT_TOKEN,
        AccessToken: accessToken,
        Client: 'Mews Free Trial App'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch configuration: ${response.status} - ${errorData.Message || response.statusText}`
      );
    }

    const data = await response.json();
    return {
      timezone: data.Enterprise?.TimeZoneIdentifier || 'UTC',
      nowUtc: data.NowUtc || new Date().toISOString()
    };
  } catch (error) {
    console.error('[RESET-SERVICE] Error fetching configuration:', error);
    return {
      timezone: 'UTC',
      nowUtc: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error fetching configuration'
    };
  }
}

/**
 * Get all reservations with pagination support
 */
async function getAllReservationsWithPagination(
  accessToken: string,
  serviceId: string,
  states: string[]
): Promise<{ reservations: Reservation[]; error?: string }> {
  const allReservations: Reservation[] = [];
  let cursor: string | null = null;
  let pageCount = 0;

  try {
    do {
      pageCount++;
      console.log(`[RESET-SERVICE] Fetching reservations page ${pageCount}...`);

      const response: Response = await fetch(
        `${MEWS_API_URL}/api/connector/v1/reservations/getAll/2023-06-06`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ClientToken: MEWS_CLIENT_TOKEN,
            AccessToken: accessToken,
            Client: 'Mews Sandbox Manager',
            ServiceIds: [serviceId],
            States: states,
            Limitation: {
              Count: 1000,
              ...(cursor && { Cursor: cursor })
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch reservations: ${response.status} - ${errorData.Message || response.statusText}`
        );
      }

      const data = await response.json();
      const pageReservations = data.Reservations || [];
      allReservations.push(...pageReservations);

      console.log(`[RESET-SERVICE] Page ${pageCount}: ${pageReservations.length} reservations`);

      cursor = data.Cursor || null;
    } while (cursor !== null);

    console.log(`[RESET-SERVICE] Total reservations fetched: ${allReservations.length}`);
    return { reservations: allReservations };
  } catch (error) {
    console.error('[RESET-SERVICE] Error fetching reservations:', error);
    return {
      reservations: allReservations,
      error: error instanceof Error ? error.message : 'Unknown error fetching reservations'
    };
  }
}

/**
 * Cancel reservations in batches (max 1000 per request)
 */
async function cancelReservationsInBatches(
  accessToken: string,
  reservationIds: string[]
): Promise<{ successCount: number; failureCount: number }> {
  if (reservationIds.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  let successCount = 0;
  let failureCount = 0;
  const batchSize = 1000;

  for (let i = 0; i < reservationIds.length; i += batchSize) {
    const batch = reservationIds.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(reservationIds.length / batchSize);

    console.log(
      `[RESET-SERVICE] Canceling batch ${batchNumber}/${totalBatches} (${batch.length} reservations)...`
    );

    try {
      const response = await fetch(`${MEWS_API_URL}/api/connector/v1/reservations/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientToken: MEWS_CLIENT_TOKEN,
          AccessToken: accessToken,
          Client: 'Mews Sandbox Manager',
          ReservationIds: batch,
          PostCancellationFee: false,
          SendEmail: false,
          Notes: 'Automated demo environment reset'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          `[RESET-SERVICE] Batch ${batchNumber} failed: ${errorData.Message || response.statusText}`
        );
        failureCount += batch.length;
        continue;
      }

      successCount += batch.length;
      console.log(`[RESET-SERVICE] ✓ Batch ${batchNumber} canceled successfully`);
    } catch (error) {
      console.error(`[RESET-SERVICE] Error canceling batch ${batchNumber}:`, error);
      failureCount += batch.length;
    }
  }

  return { successCount, failureCount };
}

/**
 * Main orchestrator: Reset an environment
 *
 * Steps:
 * 1. Get Configuration (timezone)
 * 2. Get Services (find Bookable service)
 * 3. Get Reservations (Confirmed + Optional only)
 * 4. Cancel Reservations
 * 5. Get Open Bills
 * 6. Close Bills (with payments)
 * 7. Create New Reservations (7-day window)
 */
export async function resetEnvironment(
  accessToken: string,
  enterpriseId: string,
  accessTokenId: number
): Promise<ResetResult> {
  const startTime = Date.now();
  const details: ResetOperationDetails = {
    errors: []
  };

  console.log(`[RESET-SERVICE] ======================================`);
  console.log(`[RESET-SERVICE] Starting reset for enterprise: ${enterpriseId}`);
  console.log(`[RESET-SERVICE] ======================================`);

  // Create operation log in UnifiedLog table
  const log = await createResetLog({
    enterpriseId,
    accessTokenId,
    totalSteps: 7
  });

  try {
    // ========================================
    // STEP 1: Get Configuration
    // ========================================
    console.log(`[RESET-SERVICE] Step 1/7: Fetching configuration...`);
    const config = await getConfiguration(accessToken);

    if (config.error) {
      throw new Error(`Configuration fetch failed: ${config.error}`);
    }

    details.configuration = {
      timezone: config.timezone,
      nowUtc: config.nowUtc
    };

    await updateUnifiedLog(log.id, { currentStep: 1, operationDetails: details });

    console.log(`[RESET-SERVICE] ✓ Configuration fetched (timezone: ${config.timezone})`);

    // ========================================
    // STEP 2: Get Services
    // ========================================
    console.log(`[RESET-SERVICE] Step 2/7: Fetching services...`);
    const mewsData = await fetchMewsData(MEWS_CLIENT_TOKEN, accessToken);

    if (!mewsData.serviceId) {
      throw new Error('No bookable service found');
    }

    details.services = {
      serviceId: mewsData.serviceId,
      serviceName: 'Accommodation'
    };

    await updateUnifiedLog(log.id, { currentStep: 2, operationDetails: details });

    console.log(`[RESET-SERVICE] ✓ Services fetched (serviceId: ${mewsData.serviceId})`);

    // ========================================
    // STEP 3: Get Reservations
    // ========================================
    console.log(`[RESET-SERVICE] Step 3/7: Fetching reservations...`);
    const { reservations, error: reservationsError } = await getAllReservationsWithPagination(
      accessToken,
      mewsData.serviceId,
      ['Confirmed', 'Optional'] // NOT 'Started'
    );

    if (reservationsError) {
      details.errors?.push(`Reservations fetch error: ${reservationsError}`);
    }

    details.reservationsFetched = reservations.length;

    await updateUnifiedLog(log.id, { currentStep: 3, operationDetails: details });

    console.log(`[RESET-SERVICE] ✓ Found ${reservations.length} reservations to cancel`);

    // ========================================
    // STEP 4: Cancel Reservations
    // ========================================
    console.log(`[RESET-SERVICE] Step 4/7: Canceling reservations...`);

    if (reservations.length > 0) {
      const reservationIds = reservations.map(r => r.Id);
      const { successCount, failureCount } = await cancelReservationsInBatches(
        accessToken,
        reservationIds
      );

      details.reservationsCanceled = successCount;
      details.reservationsCancelFailed = failureCount;

      if (failureCount > 0) {
        details.errors?.push(`Failed to cancel ${failureCount} reservations`);
      }

      console.log(
        `[RESET-SERVICE] ✓ Canceled ${successCount} reservations (${failureCount} failed)`
      );
    } else {
      details.reservationsCanceled = 0;
      details.reservationsCancelFailed = 0;
      console.log(`[RESET-SERVICE] ✓ No reservations to cancel`);
    }

    await updateUnifiedLog(log.id, { currentStep: 4, operationDetails: details });

    // ========================================
    // STEP 5: Get Open Bills (implicit in Step 6)
    // ========================================
    console.log(`[RESET-SERVICE] Step 5/7: Preparing to close bills...`);

    await updateUnifiedLog(log.id, { currentStep: 5, operationDetails: details });

    // ========================================
    // STEP 6: Close Bills
    // ========================================
    console.log(`[RESET-SERVICE] Step 6/7: Closing bills...`);
    const billsResult = await closeBillsForEnvironment(accessToken);

    details.billsFetched = billsResult.totalBills;
    details.billsClosed = billsResult.successCount;
    details.billsCloseFailed = billsResult.failureCount;

    if (billsResult.failureCount > 0) {
      details.errors?.push(`Failed to close ${billsResult.failureCount} bills`);
    }

    await updateUnifiedLog(log.id, { currentStep: 6, operationDetails: details });

    console.log(
      `[RESET-SERVICE] ✓ Closed ${billsResult.successCount} bills (${billsResult.failureCount} failed)`
    );

    // ========================================
    // STEP 7: Create New Reservations
    // ========================================
    console.log(`[RESET-SERVICE] Step 7/7: Creating new reservations (7-day window)...`);

    // Calculate date range: today to +7 days in enterprise timezone
    const timezone = config.timezone;
    const now = new Date();
    const todayLocal = startOfDay(toZonedTime(now, timezone));
    const todayUtc = fromZonedTime(todayLocal, timezone);
    const endDateLocal = addDays(todayLocal, 7);
    const endDateUtc = fromZonedTime(endDateLocal, timezone);

    console.log(`[RESET-SERVICE] Date range: ${todayUtc.toISOString()} to ${endDateUtc.toISOString()}`);

    // Call reservation service with date range
    const reservationResult = await createReservationsForEnvironment(
      accessToken,
      enterpriseId,
      accessTokenId,
      {
        dateRange: {
          start: todayUtc,
          end: endDateUtc
        }
      }
    );

    details.reservationsCreated = reservationResult.successCount;
    details.reservationsCreateFailed = reservationResult.failureCount;

    if (reservationResult.failureCount > 0) {
      details.errors?.push(`Failed to create ${reservationResult.failureCount} reservations`);
    }

    await updateUnifiedLog(log.id, { currentStep: 7, operationDetails: details });

    console.log(
      `[RESET-SERVICE] ✓ Created ${reservationResult.successCount} reservations (${reservationResult.failureCount} failed)`
    );

    // ========================================
    // COMPLETE
    // ========================================
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    await updateUnifiedLog(log.id, {
      status: 'completed',
      completedAt: new Date(),
      currentStep: 7,
      operationDetails: details
    });

    console.log(`[RESET-SERVICE] ======================================`);
    console.log(`[RESET-SERVICE] ✅ Reset completed in ${durationSeconds}s`);
    console.log(`[RESET-SERVICE] ======================================`);

    return {
      success: true,
      operationId: log.id,
      summary: details,
      durationSeconds
    };
  } catch (error) {
    // Handle failure
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    details.errors?.push(errorMessage);

    await updateUnifiedLog(log.id, {
      status: 'failed',
      completedAt: new Date(),
      errorMessage: errorMessage,
      operationDetails: details
    });

    console.error(`[RESET-SERVICE] ❌ Reset failed:`, error);

    throw error;
  }
}
