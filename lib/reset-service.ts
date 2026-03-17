/**
 * Reset Service
 * Orchestrates the complete reset flow for trial sandboxes
 */

import { prisma } from './prisma';
import { fetchAllMewsData } from './mews-data-service';
import { createReservationsForEnvironment } from './reservation-service';
import { closeBillsForEnvironment } from './bill-service';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { startOfDay, addDays, subDays, addMonths, subMonths } from 'date-fns';
import { createResetLog, updateUnifiedLog } from './unified-logger';
import { fetchTimezoneFromConfiguration } from './timezone-service';
import { loggedFetch } from './api-call-logger';
import type { ResetResult, ResetOperationDetails, ResetStep } from '@/types/reset';
import { getMewsClientToken, getMewsApiUrl } from '@/lib/config';

interface Reservation {
  Id: string;
  [key: string]: any;
}


/**
 * Get all reservations with pagination support.
 *
 * Fetches reservations across multiple 3-month windows (Mews API limit) from
 * `lookbackDate` (default: 1 year ago) through 3 months from now, so that
 * Confirmed/Optional reservations with past start dates and Started reservations
 * with past departure dates are not missed.
 */
async function getAllReservationsWithPagination(
  accessToken: string,
  serviceId: string,
  states: string[],
  logId?: string,
  lookbackDate?: Date
): Promise<{ reservations: Reservation[]; error?: string }> {
  const allReservations: Reservation[] = [];
  const seenIds = new Set<string>();

  // Default: look back 1 year to catch stale confirmed/started reservations
  const windowStart = lookbackDate ?? subMonths(new Date(), 12);
  const windowEnd = addMonths(new Date(), 3);

  // Chunk into 3-month windows (Mews API max per ScheduledStartUtc filter)
  const windows: Array<{ start: Date; end: Date }> = [];
  let chunkStart = windowStart;
  while (chunkStart < windowEnd) {
    const chunkEnd = addMonths(chunkStart, 3);
    windows.push({ start: chunkStart, end: chunkEnd < windowEnd ? chunkEnd : windowEnd });
    chunkStart = chunkEnd;
  }

  console.log(`[RESET-SERVICE] Fetching reservations across ${windows.length} window(s) from ${windowStart.toISOString()} to ${windowEnd.toISOString()}`);

  try {
    for (let w = 0; w < windows.length; w++) {
      const { start, end } = windows[w];
      let cursor: string | null = null;
      let pageCount = 0;

      do {
        pageCount++;
        console.log(`[RESET-SERVICE] Window ${w + 1}/${windows.length}, page ${pageCount} (${start.toISOString().slice(0, 10)} – ${end.toISOString().slice(0, 10)})...`);

        const url = `${getMewsApiUrl()}/api/connector/v1/reservations/getAll/2023-06-06`;
        const fetchOptions: RequestInit = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ClientToken: getMewsClientToken(),
            AccessToken: accessToken,
            Client: 'Mews Sandbox Manager',
            ServiceIds: [serviceId],
            States: states,
            ScheduledStartUtc: {
              StartUtc: start.toISOString(),
              EndUtc: end.toISOString()
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
        const pageReservations: Reservation[] = data.Reservations || [];

        // Deduplicate by ID (windows may overlap at boundaries)
        let newCount = 0;
        for (const r of pageReservations) {
          if (!seenIds.has(r.Id)) {
            seenIds.add(r.Id);
            allReservations.push(r);
            newCount++;
          }
        }

        console.log(`[RESET-SERVICE] Window ${w + 1}, page ${pageCount}: ${pageReservations.length} fetched, ${newCount} new`);

        cursor = data.Cursor || null;
      } while (cursor !== null);
    }

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
      const url = `${getMewsApiUrl()}/api/connector/v1/reservations/cancel`;
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientToken: getMewsClientToken(),
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
 * Process (check out) reservations in batches (max 1000 per request)
 */
async function processReservationsInBatches(
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
      `[RESET-SERVICE] Processing (checkout) batch ${batchNumber}/${totalBatches} (${batch.length} reservations)...`
    );

    try {
      const url = `${getMewsApiUrl()}/api/connector/v1/reservations/process`;
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientToken: getMewsClientToken(),
          AccessToken: accessToken,
          Client: 'Mews Sandbox Manager',
          ReservationIds: batch
        })
      };

      const response = logId
        ? await loggedFetch(url, fetchOptions, {
            unifiedLogId: logId,
            group: 'state_transitions',
            endpoint: 'reservations/process',
            metadata: { batchNumber, totalBatches, batchSize: batch.length }
          })
        : await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          `[RESET-SERVICE] Process batch ${batchNumber} failed: ${errorData.Message || response.statusText}`
        );
        failureCount += batch.length;
        continue;
      }

      successCount += batch.length;
      console.log(`[RESET-SERVICE] ✓ Process batch ${batchNumber} checked out successfully`);
    } catch (error) {
      console.error(`[RESET-SERVICE] Error processing batch ${batchNumber}:`, error);
      failureCount += batch.length;
    }
  }

  return { successCount, failureCount };
}

interface Resource {
  Id: string;
  [key: string]: any;
}

/**
 * Fetch all resources (rooms/spaces) for the enterprise
 */
async function fetchAllResources(
  accessToken: string,
  logId?: string
): Promise<{ resources: Resource[]; error?: string }> {
  const allResources: Resource[] = [];
  let cursor: string | null = null;
  let pageCount = 0;

  try {
    do {
      pageCount++;
      console.log(`[RESET-SERVICE] Fetching resources page ${pageCount}...`);

      const url = `${getMewsApiUrl()}/api/connector/v1/resources/getAll`;
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientToken: getMewsClientToken(),
          AccessToken: accessToken,
          Client: 'Mews Sandbox Manager',
          Extent: { Resources: true },
          Limitation: {
            Count: 1000,
            ...(cursor && { Cursor: cursor })
          }
        })
      };

      const response: Response = logId
        ? await loggedFetch(url, fetchOptions, {
            unifiedLogId: logId,
            group: 'rooms',
            endpoint: 'resources/getAll'
          })
        : await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch resources: ${response.status} - ${errorData.Message || response.statusText}`
        );
      }

      const data = await response.json();
      const pageResources = data.Resources || [];
      allResources.push(...pageResources);

      console.log(`[RESET-SERVICE] Resources page ${pageCount}: ${pageResources.length} resources`);

      cursor = data.Cursor || null;
    } while (cursor !== null);

    console.log(`[RESET-SERVICE] Total resources fetched: ${allResources.length}`);
    return { resources: allResources };
  } catch (error) {
    console.error('[RESET-SERVICE] Error fetching resources:', error);
    return {
      resources: allResources,
      error: error instanceof Error ? error.message : 'Unknown error fetching resources'
    };
  }
}

/**
 * Update all rooms to "Inspected" state in batches (max 1000 per request)
 */
async function updateRoomsToInspectedInBatches(
  accessToken: string,
  resourceIds: string[],
  logId?: string
): Promise<{ successCount: number; failureCount: number }> {
  if (resourceIds.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  let successCount = 0;
  let failureCount = 0;
  const batchSize = 1000;

  for (let i = 0; i < resourceIds.length; i += batchSize) {
    const batch = resourceIds.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(resourceIds.length / batchSize);

    console.log(
      `[RESET-SERVICE] Updating room status batch ${batchNumber}/${totalBatches} (${batch.length} rooms)...`
    );

    try {
      const url = `${getMewsApiUrl()}/api/connector/v1/resources/update`;
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientToken: getMewsClientToken(),
          AccessToken: accessToken,
          Client: 'Mews Sandbox Manager',
          ResourceUpdates: batch.map(resourceId => ({
            ResourceId: resourceId,
            State: { Value: 'Inspected' }
          }))
        })
      };

      const response = logId
        ? await loggedFetch(url, fetchOptions, {
            unifiedLogId: logId,
            group: 'rooms',
            endpoint: 'resources/update',
            metadata: { batchNumber, totalBatches, batchSize: batch.length }
          })
        : await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          `[RESET-SERVICE] Room update batch ${batchNumber} failed: ${errorData.Message || response.statusText}`
        );
        failureCount += batch.length;
        continue;
      }

      successCount += batch.length;
      console.log(`[RESET-SERVICE] ✓ Room update batch ${batchNumber} set to Inspected`);
    } catch (error) {
      console.error(`[RESET-SERVICE] Error updating room batch ${batchNumber}:`, error);
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
 * 4. Process Missed Departures (checkout Started reservations with past departure)
 * 5. Cancel Reservations
 * 6. Get Open Bills
 * 7. Close Bills (with payments)
 * 8. Create New Reservations (7-day window)
 * 9. Update All Rooms to Inspected
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
    totalSteps: 9
  });

  try {
    // ========================================
    // STEP 1: Get Configuration & Timezone
    // ========================================
    console.log(`[RESET-SERVICE] Step 1/9: Fetching configuration and timezone...`);
    const config = await fetchTimezoneFromConfiguration(getMewsClientToken(), accessToken, log.id);
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
    console.log(`[RESET-SERVICE] Step 2/9: Fetching ALL bookable services...`);
    const allMewsData = await fetchAllMewsData(getMewsClientToken(), accessToken, { logId: log.id });

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
    console.log(`[RESET-SERVICE] Step 3/9: Fetching reservations for ${allMewsData.length} service(s)...`);
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
    // STEP 4: Process Missed Departures
    // ========================================
    console.log(`[RESET-SERVICE] Step 4/9: Processing missed departures (Started reservations with past departure)...`);

    const now = new Date();
    const missedDepartureReservations: Reservation[] = [];

    for (const serviceData of allMewsData) {
      // Fetch Started reservations — use a wide start window to catch historical check-ins
      const { reservations: startedReservations } = await getAllReservationsWithPagination(
        accessToken,
        serviceData.serviceId,
        ['Started'],
        log.id
      );

      // Filter client-side: only those whose scheduled departure is in the past
      const missedForService = startedReservations.filter(
        r => r.ScheduledEndUtc && r.ScheduledEndUtc < now.toISOString()
      );

      missedDepartureReservations.push(...missedForService);
      console.log(
        `[RESET-SERVICE]   Service ${serviceData.serviceId}: ${startedReservations.length} started, ${missedForService.length} missed departures`
      );
    }

    details.missedDeparturesFetched = missedDepartureReservations.length;

    if (missedDepartureReservations.length > 0) {
      const missedIds = missedDepartureReservations.map(r => r.Id);
      const { successCount: processedCount, failureCount: processFailed } =
        await processReservationsInBatches(accessToken, missedIds, log.id);

      details.missedDeparturesProcessed = processedCount;
      details.missedDeparturesProcessFailed = processFailed;

      if (processFailed > 0) {
        details.errors?.push(`Failed to process ${processFailed} missed departure reservations`);
      }

      console.log(
        `[RESET-SERVICE] ✓ Processed ${processedCount} missed departures (${processFailed} failed)`
      );
    } else {
      details.missedDeparturesProcessed = 0;
      details.missedDeparturesProcessFailed = 0;
      console.log(`[RESET-SERVICE] ✓ No missed departures to process`);
    }

    await updateUnifiedLog(log.id, { currentStep: 4, operationDetails: details });

    // ========================================
    // STEP 5: Cancel Reservations (all services)
    // ========================================
    console.log(`[RESET-SERVICE] Step 5/9: Canceling ${allReservations.length} reservations...`);

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

    await updateUnifiedLog(log.id, { currentStep: 5, operationDetails: details });

    // ========================================
    // STEP 6: Get Open Bills (implicit in Step 7)
    // ========================================
    console.log(`[RESET-SERVICE] Step 6/9: Preparing to close bills...`);

    await updateUnifiedLog(log.id, { currentStep: 6, operationDetails: details });

    // ========================================
    // STEP 7: Close Bills
    // ========================================
    console.log(`[RESET-SERVICE] Step 7/9: Closing bills...`);
    const billsResult = await closeBillsForEnvironment(accessToken, log.id);

    details.billsFetched = billsResult.totalBills;
    details.billsClosed = billsResult.successCount;
    details.billsCloseFailed = billsResult.failureCount;

    if (billsResult.failureCount > 0) {
      details.errors?.push(`Failed to close ${billsResult.failureCount} bills`);
    }

    await updateUnifiedLog(log.id, { currentStep: 7, operationDetails: details });

    console.log(
      `[RESET-SERVICE] ✓ Closed ${billsResult.successCount} bills (${billsResult.failureCount} failed)`
    );

    // ========================================
    // STEP 8: Create New Reservations (all services, 7-day window)
    // ========================================
    console.log(`[RESET-SERVICE] Step 8/9: Creating reservations for ${allMewsData.length} service(s) (7-day window)...`);

    // Calculate date range: today to +7 days in enterprise timezone
    const timezone = config.timezone;
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

    await updateUnifiedLog(log.id, { currentStep: 8, operationDetails: details });

    console.log(
      `[RESET-SERVICE] ✓ Created ${totalReservationsCreated} reservations across ${allMewsData.length} service(s) (${totalReservationsFailed} failed)`
    );

    // ========================================
    // STEP 9: Update All Rooms to Inspected
    // ========================================
    console.log(`[RESET-SERVICE] Step 9/9: Updating all rooms to Inspected state...`);

    const { resources, error: resourcesError } = await fetchAllResources(accessToken, log.id);

    if (resourcesError) {
      details.errors?.push(`Failed to fetch resources: ${resourcesError}`);
      details.roomsUpdated = 0;
      details.roomsUpdateFailed = 0;
      console.warn(`[RESET-SERVICE] Warning: Could not fetch resources - ${resourcesError}`);
    } else if (resources.length > 0) {
      const resourceIds = resources.map(r => r.Id);
      const { successCount: roomsUpdated, failureCount: roomsUpdateFailed } =
        await updateRoomsToInspectedInBatches(accessToken, resourceIds, log.id);

      details.roomsUpdated = roomsUpdated;
      details.roomsUpdateFailed = roomsUpdateFailed;

      if (roomsUpdateFailed > 0) {
        details.errors?.push(`Failed to update ${roomsUpdateFailed} rooms to Inspected`);
      }

      console.log(
        `[RESET-SERVICE] ✓ Updated ${roomsUpdated} rooms to Inspected (${roomsUpdateFailed} failed)`
      );
    } else {
      details.roomsUpdated = 0;
      details.roomsUpdateFailed = 0;
      console.log(`[RESET-SERVICE] ✓ No rooms to update`);
    }

    await updateUnifiedLog(log.id, { currentStep: 9, operationDetails: details });

    // ========================================
    // COMPLETE
    // ========================================
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    await updateUnifiedLog(log.id, {
      status: 'completed',
      completedAt: new Date(),
      currentStep: 9,
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
