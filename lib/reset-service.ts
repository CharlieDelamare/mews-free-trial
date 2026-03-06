/**
 * Reset Service
 * Orchestrates the complete reset flow for trial sandboxes
 */

import { prisma } from './prisma';
import { fetchAllMewsData } from './mews-data-service';
import { createReservationsForEnvironment } from './reservation-service';
import { closeBillsForEnvironment } from './bill-service';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { startOfDay, addDays, subDays } from 'date-fns';
import { createResetLog, updateUnifiedLog } from './unified-logger';
import { fetchTimezoneFromConfiguration } from './timezone-service';
import { loggedFetch } from './api-call-logger';
import type { ResetResult, ResetOperationDetails, ResetStep } from '@/types/reset';

// Hardcoded Mews client token for demo environment
const MEWS_CLIENT_TOKEN = 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';
const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews-demo.com';

interface Reservation {
  Id: string;
  [key: string]: any;
}


/**
 * Get all reservations with pagination support
 */
async function getAllReservationsWithPagination(
  accessToken: string,
  serviceId: string,
  states: string[],
  logId?: string
): Promise<{ reservations: Reservation[]; error?: string }> {
  const allReservations: Reservation[] = [];
  let cursor: string | null = null;
  let pageCount = 0;

  try {
    do {
      pageCount++;
      console.log(`[RESET-SERVICE] Fetching reservations page ${pageCount}...`);

      // Include reservations starting up to 7 days ago (plus all future ones)
      const sevenDaysAgo = subDays(new Date(), 7);

      const url = `${MEWS_API_URL}/api/connector/v1/reservations/getAll/2023-06-06`;
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientToken: MEWS_CLIENT_TOKEN,
          AccessToken: accessToken,
          Client: 'Mews Sandbox Manager',
          ServiceIds: [serviceId],
          States: states,
          ScheduledStartUtc: {
            StartUtc: sevenDaysAgo.toISOString()
          },
          Limitation: {
            Count: 1000,
            ...(cursor && { Cursor: cursor })
          }
        })
      };

      const response: Response = logId
        ? await loggedFetch(url, fetchOptions, {
            unifiedLogId: logId,
            group: 'reservations',
            endpoint: 'reservations/getAll/2023-06-06'
          })
        : await fetch(url, fetchOptions);

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
  reservationIds: string[],
  logId?: string
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
      const url = `${MEWS_API_URL}/api/connector/v1/reservations/cancel`;
      const fetchOptions: RequestInit = {
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
      };

      const response = logId
        ? await loggedFetch(url, fetchOptions, {
            unifiedLogId: logId,
            group: 'reservations',
            endpoint: 'reservations/cancel',
            metadata: { batchNumber, totalBatches, batchSize: batch.length }
          })
        : await fetch(url, fetchOptions);

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
  accessTokenId: number,
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
    // STEP 1: Get Configuration & Timezone
    // ========================================
    console.log(`[RESET-SERVICE] Step 1/7: Fetching configuration and timezone...`);
    const config = await fetchTimezoneFromConfiguration(MEWS_CLIENT_TOKEN, accessToken, log.id);
    const languageCode = config.defaultLanguageCode;

    if (config.error) {
      console.warn(`[RESET-SERVICE] Timezone fetch warning: ${config.error}, using fallback`);
    }

    details.configuration = {
      timezone: config.timezone,
      nowUtc: config.nowUtc || new Date().toISOString()
    };

    // Store timezone in UnifiedLog.timezone column for reservation service
    await updateUnifiedLog(log.id, {
      currentStep: 1,
      timezone: config.timezone,  // Store in column, not just operationDetails
      operationDetails: details
    });

    console.log(`[RESET-SERVICE] ✓ Configuration fetched (timezone: ${config.timezone})`);

    // ========================================
    // STEP 2: Get ALL Services
    // ========================================
    console.log(`[RESET-SERVICE] Step 2/7: Fetching ALL bookable services...`);
    const allMewsData = await fetchAllMewsData(MEWS_CLIENT_TOKEN, accessToken, { logId: log.id });

    if (allMewsData.length === 0) {
      throw new Error('No bookable services found');
    }

    details.services = {
      serviceId: allMewsData[0].serviceId,
      serviceName: 'Accommodation',
      serviceCount: allMewsData.length,
      serviceIds: allMewsData.map(d => d.serviceId)
    };

    await updateUnifiedLog(log.id, { currentStep: 2, operationDetails: details });

    console.log(`[RESET-SERVICE] ✓ Found ${allMewsData.length} bookable service(s):`);
    allMewsData.forEach((d, i) => {
      console.log(`[RESET-SERVICE]   Service ${i + 1}: ${d.serviceId} (${d.resourceCategories.length} categories, ${d.rates.length} rates)`);
    });

    // ========================================
    // STEP 3: Get Reservations (all services)
    // ========================================
    console.log(`[RESET-SERVICE] Step 3/7: Fetching reservations for ${allMewsData.length} service(s)...`);
    const allReservations: Reservation[] = [];

    for (const serviceData of allMewsData) {
      const { reservations: serviceReservations, error: serviceError } =
        await getAllReservationsWithPagination(
          accessToken,
          serviceData.serviceId,
          ['Confirmed', 'Optional'], // NOT 'Started'
          log.id
        );

      if (serviceError) {
        details.errors?.push(`Service ${serviceData.serviceId}: ${serviceError}`);
      }

      allReservations.push(...serviceReservations);
      console.log(`[RESET-SERVICE]   Service ${serviceData.serviceId}: ${serviceReservations.length} reservations`);
    }

    details.reservationsFetched = allReservations.length;

    await updateUnifiedLog(log.id, { currentStep: 3, operationDetails: details });

    console.log(`[RESET-SERVICE] ✓ Found ${allReservations.length} total reservations to cancel across ${allMewsData.length} service(s)`);

    // ========================================
    // STEP 4: Cancel Reservations (all services)
    // ========================================
    console.log(`[RESET-SERVICE] Step 4/7: Canceling ${allReservations.length} reservations...`);

    if (allReservations.length > 0) {
      const reservationIds = allReservations.map(r => r.Id);
      const { successCount, failureCount } = await cancelReservationsInBatches(
        accessToken,
        reservationIds,
        log.id
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
    const billsResult = await closeBillsForEnvironment(accessToken, log.id);

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
    // STEP 7: Create New Reservations (all services, 7-day window)
    // ========================================
    console.log(`[RESET-SERVICE] Step 7/7: Creating reservations for ${allMewsData.length} service(s) (7-day window)...`);

    // Calculate date range: today to +7 days in enterprise timezone
    const timezone = config.timezone;
    const now = new Date();
    const todayLocal = startOfDay(toZonedTime(now, timezone));
    const todayUtc = fromZonedTime(todayLocal, timezone);
    const endDateLocal = addDays(todayLocal, 7);
    const endDateUtc = fromZonedTime(endDateLocal, timezone);

    console.log(`[RESET-SERVICE] Date range: ${todayUtc.toISOString()} to ${endDateUtc.toISOString()}`);

    let sharedCustomerIds: string[] | undefined;
    let totalReservationsCreated = 0;
    let totalReservationsFailed = 0;

    for (let i = 0; i < allMewsData.length; i++) {
      const serviceData = allMewsData[i];
      console.log(`[RESET-SERVICE] Creating reservations for service ${i + 1}/${allMewsData.length}: ${serviceData.serviceId}`);

      try {
        const reservationResult = await createReservationsForEnvironment(
          accessToken,
          enterpriseId,
          accessTokenId,
          {
            dateRange: {
              start: todayUtc,
              end: endDateUtc
            },
            languageCode,
            logId: log.id,
            mewsData: serviceData,
            customerIds: sharedCustomerIds,
          }
        );

        totalReservationsCreated += reservationResult.successCount;
        totalReservationsFailed += reservationResult.failureCount;

        // After first service call, capture customer IDs for reuse
        if (!sharedCustomerIds && reservationResult.customerIds && reservationResult.customerIds.length > 0) {
          sharedCustomerIds = reservationResult.customerIds;
          console.log(`[RESET-SERVICE] Captured ${sharedCustomerIds.length} customer IDs for reuse across services`);
        }

        console.log(`[RESET-SERVICE]   Service ${serviceData.serviceId}: ${reservationResult.successCount} created, ${reservationResult.failureCount} failed`);
      } catch (error) {
        console.error(`[RESET-SERVICE] Service ${serviceData.serviceId} reservation creation failed:`, error);
        details.errors?.push(`Service ${serviceData.serviceId}: ${(error as Error).message}`);
      }
    }

    details.reservationsCreated = totalReservationsCreated;
    details.reservationsCreateFailed = totalReservationsFailed;

    if (totalReservationsFailed > 0) {
      details.errors?.push(`Failed to create ${totalReservationsFailed} reservations across all services`);
    }

    await updateUnifiedLog(log.id, { currentStep: 7, operationDetails: details });

    console.log(
      `[RESET-SERVICE] ✓ Created ${totalReservationsCreated} reservations across ${allMewsData.length} service(s) (${totalReservationsFailed} failed)`
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
