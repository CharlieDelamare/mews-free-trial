/**
 * Reservation Service - Creates realistic reservations in Mews trial sandboxes
 *
 * This service orchestrates the creation of customers and reservations with proper
 * states (Confirmed, Started, Processed) and realistic distributions.
 */

import { prisma } from './prisma';
import { fetchMewsData, MewsData } from './mews-data-service';
import { getSampleCustomers, SampleCustomer } from './sample-customers';
import { updateEnvironmentReservationStats, updateEnvironmentCustomerStats, createDemoFillerLog, updateUnifiedLog } from './unified-logger';
import { fromZonedTime } from 'date-fns-tz';
import { addDays, set, isSameDay, startOfDay } from 'date-fns';
import { fetchWithRateLimit } from './mews-rate-limiter';
import { fetchWithRateLimitAndLog } from './api-call-logger';
import { log, logError } from './force-log';
import { resolveLanguage, type SupportedLanguage } from './translations/language-utils';
import { translateNote } from './translations/customer-notes';

const MEWS_CLIENT_TOKEN = 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';
const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews-demo.com';
const CUSTOMER_CONCURRENCY = 5; // Process 5 customers at a time

export interface ReservationCreationResult {
  totalReservations: number;
  totalCustomers: number;
  successCount: number;
  failureCount: number;
  durationSeconds: number;
  customerIds?: string[];
}

interface EnvironmentData {
  roomCount: number;
  dormCount: number;
  apartmentCount: number;
  bedCount: number;
  durationDays: number;
  timezone: string;
  propertyType: 'hotel' | 'hostel' | 'apartments';
  createdAt: Date;
}

interface ReservationData {
  customerId?: string;      // Assigned during interleaved creation or from pre-provided IDs
  customerIndex: number;    // Index into customer profiles array (for repeat guest rotation)
  resourceCategoryId: string;
  rateId: string;
  checkInUtc: Date;
  checkOutUtc: Date;
  adultCount: number;
  desiredState: 'Confirmed' | 'Started' | 'Processed';
}

interface CategoryTarget {
  categoryId: string;
  categoryName: string;
  resourceCount: number;
  targetReservations: number;
  targetOccupancy: number;
}

/**
 * Fetch timezone from Mews configuration API
 */
async function fetchTimezoneFromMews(accessToken: string, logId?: string): Promise<string> {
  console.log('[RESERVATIONS] Fetching timezone from Mews API...');

  const url = `${MEWS_API_URL}/api/connector/v1/configuration/get`;
  const fetchOpts: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: MEWS_CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager'
    })
  };
  const contextStr = 'configuration/get';

  const response = logId
    ? await fetchWithRateLimitAndLog(url, accessToken, fetchOpts, contextStr, {
        unifiedLogId: logId,
        group: 'setup',
      })
    : await fetchWithRateLimit(url, accessToken, fetchOpts, contextStr);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch timezone from Mews API: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const timezone = data.Enterprise?.TimeZoneIdentifier || 'UTC';

  console.log(`[RESERVATIONS] ✅ Fetched timezone from Mews API: ${timezone}`);
  return timezone;
}

/**
 * Main entry point: Create reservations for an environment
 */
export async function createReservationsForEnvironment(
  accessToken: string,
  enterpriseId: string,
  accessTokenId: number,
  options?: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    reservationCount?: number;
    skipStateTransitions?: boolean;
    operationType?: 'automatic' | 'demo_filler';
    logId?: string; // Unified log ID for updating operationDetails
    languageCode?: string; // Property language for translating customer notes
    mewsData?: MewsData; // Pre-fetched service data (skip internal fetchMewsData)
    customerIds?: string[]; // Pre-created customer IDs (skip dynamic customer creation)
    serviceId?: string; // Specific bookable service ID to use
    deadlineMs?: number; // Absolute timestamp by which work must stop to allow finalization
  }
): Promise<ReservationCreationResult> {
  const startTime = Date.now();
  const logId = options?.logId;
  const operationType = options?.operationType || 'automatic';
  const deadlineMs = options?.deadlineMs;

  log.reservations('Starting reservation creation', {
    enterpriseId,
    accessTokenId,
    options
  });

  // Create log entry (for backwards compatibility)
  const reservationLog = await prisma.reservationCreationLog.create({
    data: {
      enterpriseId,
      accessTokenId,
      totalReservations: 0,
      successCount: 0,
      failureCount: 0,
      status: 'processing',
      reservationResults: [],
      operationType
    }
  });

  // Update unified log if logId provided (for automatic type only)
  if (logId && operationType === 'automatic') {
    try {
      await updateEnvironmentReservationStats(logId, {
        status: 'processing',
        total: 0,
        success: 0,
        failed: 0
      });
    } catch (error) {
      console.error('[RESERVATIONS] Failed to update unified log stats:', error);
    }
  }

  try {
    // Fetch environment data
    const envData = await fetchEnvironmentData(
      enterpriseId,
      accessToken,
      !!options?.dateRange,
      logId
    );

    // Fetch Mews data (or use pre-fetched data if provided)
    const mewsData = options?.mewsData ?? await fetchMewsData(MEWS_CLIENT_TOKEN, accessToken, {
      serviceId: options?.serviceId
    });

    // Step 3: Filter resource categories based on what was actually created
    const filteredCategories = filterResourceCategories(mewsData.resourceCategories);
    console.log(`[RESERVATIONS] Filtered resource categories: ${filteredCategories.length}`);

    if (filteredCategories.length === 0) {
      throw new Error(`No resource categories found for property type: ${envData.propertyType}`);
    }

    // Step 4: Calculate per-category reservation targets for 80% occupancy
    // If custom dateRange provided, calculate duration from it; otherwise use envData
    const effectiveDuration = options?.dateRange
      ? Math.ceil((options.dateRange.end.getTime() - options.dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
      : envData.durationDays;

    const categoryTargets = calculateCategoryTargets(
      filteredCategories,
      effectiveDuration,
      options?.reservationCount,
      !!options?.dateRange
    );
    const totalReservations = categoryTargets.reduce((sum, ct) => sum + ct.targetReservations, 0);

    console.log(`[RESERVATIONS] Per-category targets ${options?.reservationCount ? `for ${options.reservationCount} reservations` : 'for 80% occupancy'}:`);
    categoryTargets.forEach(ct => {
      console.log(`[RESERVATIONS]   - ${ct.categoryName}: ${ct.resourceCount} units → ${ct.targetReservations} reservations${ct.targetOccupancy > 0 ? ` (${ct.targetOccupancy}% target)` : ''}`);
    });
    console.log(`[RESERVATIONS] Total target reservations: ${totalReservations}`);

    console.log(`[RESERVATIONS] Setup:`, {
      propertyType: envData.propertyType,
      duration: `${effectiveDuration} days`,
      targetReservations: totalReservations,
      ...(options?.dateRange && { customDateRange: true })
    });

    // Update log with total
    await prisma.reservationCreationLog.update({
      where: { id: reservationLog.id },
      data: { totalReservations }
    });

    // Step 6: Determine customer strategy and generate reservation templates
    const language = resolveLanguage(options?.languageCode);
    let customerIds: string[];
    let createdReservations: any[];
    let failures: any[];

    if (options?.customerIds && options.customerIds.length > 0) {
      // Path A: Pre-provided customer IDs — assign directly to reservation templates
      customerIds = options.customerIds;
      log.reservations('Using pre-provided customers', {
        count: customerIds.length,
        serviceId: mewsData.serviceId
      });

      const reservations = generateReservationData(
        categoryTargets,
        customerIds.length,
        mewsData.rates,
        envData,
        mewsData.ageCategories.adult,
        options?.dateRange,
        mewsData.vouchersByRate
      );

      // Assign customer IDs using the customerIndex from templates
      for (const reservation of reservations) {
        reservation.customerId = customerIds[reservation.customerIndex];
      }

      const groups = groupReservationsForAPI(reservations);
      const result = await createReservationGroups(
        groups,
        mewsData.serviceId,
        accessToken,
        mewsData.ageCategories.adult,
        mewsData.vouchersByRate,
        logId
      );
      createdReservations = result.createdReservations;
      failures = result.failures;
    } else {
      // Path B: Dynamic interleaved customer + reservation creation
      const uniqueCustomerCount = calculateUniqueCustomerCount(totalReservations);
      const customerProfiles = getSampleCustomers(uniqueCustomerCount);

      log.reservations('Dynamic customer+reservation creation', {
        totalReservations,
        uniqueCustomers: uniqueCustomerCount,
        ratio: `${(totalReservations / uniqueCustomerCount).toFixed(1)} reservations per customer`
      });

      // Create customer creation log
      const customerLog = await prisma.customerCreationLog.create({
        data: {
          enterpriseId,
          accessTokenId,
          totalCustomers: uniqueCustomerCount,
          successCount: 0,
          failureCount: 0,
          status: 'processing',
          customerResults: []
        }
      });

      // Update unified log customer stats to 'processing'
      if (logId) {
        try {
          await updateEnvironmentCustomerStats(logId, {
            status: 'processing',
            total: uniqueCustomerCount,
            success: 0,
            failed: 0
          });
        } catch (error) {
          console.error('[CUSTOMERS] Failed to update unified log customer stats:', error);
        }
      }

      // Generate reservation templates (no customer IDs yet)
      const reservations = generateReservationData(
        categoryTargets,
        uniqueCustomerCount,
        mewsData.rates,
        envData,
        mewsData.ageCategories.adult,
        options?.dateRange,
        mewsData.vouchersByRate
      );

      const groups = groupReservationsForAPI(reservations);

      // Interleaved: create customers JIT as reservation groups are processed
      const result = await createReservationGroupsWithCustomers(
        groups,
        customerProfiles,
        mewsData.serviceId,
        accessToken,
        mewsData.ageCategories.adult,
        mewsData.vouchersByRate,
        language,
        logId
      );
      createdReservations = result.createdReservations;
      failures = result.failures;
      customerIds = Array.from(result.customerPool.values());

      // Validate that we created at least some customers
      if (customerIds.length === 0) {
        throw new Error('Failed to create any customers. Cannot proceed with reservation creation.');
      }

      // Update customer creation log
      const customerFailureCount = uniqueCustomerCount - result.customerPool.size;
      await prisma.customerCreationLog.update({
        where: { id: customerLog.id },
        data: {
          successCount: result.customerPool.size,
          failureCount: customerFailureCount,
          completedAt: new Date(),
          status: 'completed'
        }
      });

      // Update unified log customer stats to 'completed'
      if (logId) {
        try {
          await updateEnvironmentCustomerStats(logId, {
            status: 'completed',
            total: uniqueCustomerCount,
            success: result.customerPool.size,
            failed: customerFailureCount
          });
        } catch (error) {
          console.error('[CUSTOMERS] Failed to update unified log customer stats:', error);
        }
      }

      log.reservations('Interleaved creation complete', {
        customersCreated: result.customerPool.size,
        reservationsCreated: createdReservations.length,
        reservationsFailed: failures.length
      });
    }

    // Fetch reservation details to get assigned resource IDs
    const reservationIds = createdReservations.map(r => r.id);
    let reservationDetails: Array<{ Id: string; AssignedResourceId?: string; StartUtc?: string }> = [];
    let inspectedRoomIds = new Set<string>();

    // Skip state transitions if requested (leaves all reservations in Confirmed state)
    if (!options?.skipStateTransitions) {
      if (reservationIds.length > 0) {
        reservationDetails = await fetchReservationDetails(reservationIds, accessToken, logId);

        // Prepare resources for check-in (set to Inspected state)
        const prepResult = await prepareResourcesForCheckIn(reservationDetails, accessToken, logId);
        inspectedRoomIds = prepResult.inspectedRoomIds;
      }

      // Apply state transitions with parallelism across rooms, passing tracked inspections
      await applyStateTransitionsSequentially(createdReservations, reservationDetails, accessToken, inspectedRoomIds, logId, deadlineMs);
    } else {
      console.log(`[RESERVATIONS] Skipping state transitions - all reservations will remain in Confirmed state`);
    }

    // Log results
    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    log.reservations('Reservation creation complete', {
      created: createdReservations.length,
      failed: failures.length,
      customers: customerIds.length,
      duration: `${durationSeconds}s`
    });

    await prisma.reservationCreationLog.update({
      where: { id: reservationLog.id },
      data: {
        successCount: createdReservations.length,
        failureCount: failures.length,
        completedAt: new Date(),
        status: 'completed',
        reservationResults: [...createdReservations, ...failures]
      }
    });

    // Update unified log if logId provided (for automatic type only)
    if (logId && operationType === 'automatic') {
      try {
        // Calculate state distribution from results
        const byState: Record<string, number> = {};
        for (const r of createdReservations) {
          const state = r.desiredState || 'Confirmed';
          byState[state] = (byState[state] || 0) + 1;
        }

        // Format failures for logging (only include essential info)
        const formattedFailures = failures.map((f: any) => ({
          error: f.error,
          skipped: f.skipped || false,
          checkInUtc: f.checkInUtc?.toISOString?.() || f.checkInUtc,
          checkOutUtc: f.checkOutUtc?.toISOString?.() || f.checkOutUtc
        }));

        await updateEnvironmentReservationStats(logId, {
          status: 'completed',
          total: createdReservations.length + failures.length,
          success: createdReservations.length,
          failed: failures.length,
          byState,
          failures: formattedFailures
        });
      } catch (error) {
        console.error('[RESERVATIONS] Failed to update unified log stats:', error);
      }
    }

    return {
      totalReservations: createdReservations.length + failures.length,
      totalCustomers: customerIds.length,
      successCount: createdReservations.length,
      failureCount: failures.length,
      durationSeconds: parseFloat(durationSeconds),
      customerIds: !options?.customerIds ? customerIds : undefined
    };

  } catch (error) {
    console.error(`[RESERVATIONS] ❌ Failed:`, error);

    await prisma.reservationCreationLog.update({
      where: { id: reservationLog.id },
      data: {
        status: 'failed',
        errorSummary: (error as Error).message,
        completedAt: new Date()
      }
    });

    // Update unified log if logId provided (for automatic type only)
    if (logId && operationType === 'automatic') {
      try {
        await updateEnvironmentReservationStats(logId, {
          status: 'failed',
          total: 0,
          success: 0,
          failed: 0
        });
      } catch (updateError) {
        console.error('[RESERVATIONS] Failed to update unified log stats:', updateError);
      }
    }

    throw error;
  }
}

/**
 * Fetch environment data from database
 * Tries unified log first, falls back to old environment log for backwards compatibility
 * If no environment log exists but hasDateRange is true, fetches timezone from Mews API
 */
async function fetchEnvironmentData(
  enterpriseId: string,
  accessToken: string,
  hasDateRange: boolean,
  logId?: string
): Promise<EnvironmentData> {
  // Try unified log first
  const unifiedLog = await prisma.unifiedLog.findFirst({
    where: { enterpriseId, logType: 'environment' },
    orderBy: { timestamp: 'desc' }
  });

  if (unifiedLog) {
    if (!unifiedLog.timezone) {
      throw new Error(`Timezone not set for enterprise: ${enterpriseId}`);
    }

    return {
      roomCount: unifiedLog.roomCount || 0,
      dormCount: unifiedLog.dormCount || 0,
      apartmentCount: unifiedLog.apartmentCount || 0,
      bedCount: unifiedLog.bedCount || 0,
      durationDays: unifiedLog.durationDays || 7,
      timezone: unifiedLog.timezone,
      propertyType: unifiedLog.propertyType as 'hotel' | 'hostel' | 'apartments',
      createdAt: unifiedLog.timestamp
    };
  }

  // Fallback to old environment log for backwards compatibility
  const envLog = await prisma.environmentLog.findFirst({
    where: { enterpriseId },
    orderBy: { timestamp: 'desc' }
  });

  if (envLog) {
    if (!envLog.timezone) {
      throw new Error(`Timezone not set for enterprise: ${enterpriseId}`);
    }

    return {
      roomCount: envLog.roomCount || 0,
      dormCount: envLog.dormCount || 0,
      apartmentCount: envLog.apartmentCount || 0,
      bedCount: envLog.bedCount || 0,
      durationDays: envLog.durationDays || 7,
      timezone: envLog.timezone,
      propertyType: envLog.propertyType as 'hotel' | 'hostel' | 'apartments',
      createdAt: envLog.timestamp
    };
  }

  // No environment log found
  if (hasDateRange) {
    // When dateRange is provided, we only need timezone (duration/createdAt not used)
    console.log(`[RESERVATIONS] No environment log found for enterprise ${enterpriseId}, but dateRange provided - fetching timezone from Mews API`);

    const timezone = await fetchTimezoneFromMews(accessToken, logId);

    // Return minimal EnvironmentData with fetched timezone
    // Other fields are dummy values since they won't be used when dateRange is provided
    return {
      roomCount: 0,
      dormCount: 0,
      apartmentCount: 0,
      bedCount: 0,
      durationDays: 30, // Dummy value - not used when dateRange provided
      timezone,
      propertyType: 'hotel', // Dummy value - only used for logging
      createdAt: new Date() // Dummy value - not used when dateRange provided
    };
  }

  // No environment log and no dateRange - this is an error
  throw new Error(`Environment log not found for enterprise: ${enterpriseId}`);
}

/**
 * Filter resource categories - exclude Dorm type, allow all others
 */
function filterResourceCategories(
  categories: MewsData['resourceCategories']
): MewsData['resourceCategories'] {
  // Exclude Dorm type, allow all others
  const excludedTypes = ['Dorm'];

  const filtered = categories.filter(c => !excludedTypes.includes(c.type));

  // Log what we're including
  console.log(`[RESERVATIONS] Filtered resource categories (excluding ${excludedTypes.join(', ')}):`)
  filtered.forEach(cat => {
    console.log(`[RESERVATIONS]   ✓ Including ${cat.name} (${cat.type}): ${cat.resourceCount} units`);
  });

  return filtered;
}

/**
 * Calculate per-category reservation targets for 80% occupancy or custom count
 *
 * @param categories - Resource categories to calculate for
 * @param durationDays - Number of days to calculate across
 * @param customReservationCount - Optional: Use exact count instead of 80% occupancy
 * @param hasCustomDateRange - Optional: If true, use exact durationDays without adding past days (for reset/fill flows)
 * @returns Array of category targets with reservation counts
 */
function calculateCategoryTargets(
  categories: MewsData['resourceCategories'],
  durationDays: number,
  customReservationCount?: number,
  hasCustomDateRange?: boolean
): CategoryTarget[] {
  // If custom count provided, distribute proportionally using Largest Remainder Method
  // This ensures the sum exactly equals the requested count (no over-allocation)
  if (customReservationCount) {
    const totalResources = categories.reduce((sum, c) => sum + c.resourceCount, 0);

    // Step 1: Calculate exact shares and floor values for each category
    const allocations = categories.map(category => {
      const proportion = category.resourceCount / totalResources;
      const exactShare = proportion * customReservationCount;
      const floorValue = Math.floor(exactShare);
      const remainder = exactShare - floorValue;

      return {
        category,
        floorValue,
        remainder
      };
    });

    // Step 2: Calculate how many remaining slots need to be distributed
    const assignedSoFar = allocations.reduce((sum, a) => sum + a.floorValue, 0);
    let remainingSlots = customReservationCount - assignedSoFar;

    // Step 3: Sort by remainder (descending) to prioritize fair distribution
    allocations.sort((a, b) => b.remainder - a.remainder);

    // Step 4: Distribute remaining slots to categories with largest remainders
    for (let i = 0; i < allocations.length && remainingSlots > 0; i++) {
      allocations[i].floorValue++;
      remainingSlots--;
    }

    // Step 5: Build final result
    return allocations.map(allocation => ({
      categoryId: allocation.category.id,
      categoryName: allocation.category.name,
      resourceCount: allocation.category.resourceCount,
      targetReservations: allocation.floorValue,
      targetOccupancy: 0 // Not applicable for custom count
    }));
  }

  // Otherwise, use existing 80% occupancy calculation
  // For automatic flow: add 2 past days for history (e.g., 30 → 32 days)
  // For reset/fill with dateRange: use exact duration (e.g., 7 → 7 days)
  const totalDays = hasCustomDateRange ? durationDays : durationDays + 2;
  const averageStayLength = 2.1; // From stay distribution: 50%*1 + 30%*2 + 15%*3 + 5%*4 = 1.75
  const targetOccupancy = 0.8; // 80% occupancy

  return categories.map(category => {
    const resourceCount = category.resourceCount;
    const totalRoomNights = resourceCount * totalDays;
    const targetOccupiedNights = totalRoomNights * targetOccupancy;
    const targetReservations = Math.ceil(targetOccupiedNights / averageStayLength);

    return {
      categoryId: category.id,
      categoryName: category.name,
      resourceCount,
      targetReservations,
      targetOccupancy: Math.round(targetOccupancy * 100)
    };
  });
}

/**
 * Calculate how many unique customers to create for a given reservation count.
 * Uses a repeat-guest ratio to keep customer creation proportional.
 * Real properties have repeat guests, so 1 customer per reservation is wasteful.
 */
function calculateUniqueCustomerCount(totalReservations: number): number {
  const ratio = 2.0; // ~2 reservations per unique customer
  const raw = Math.ceil(totalReservations / ratio);
  return Math.max(10, Math.min(raw, 150));
}

/**
 * Get existing customer by email address
 */
async function getCustomerByEmail(email: string, accessToken: string, logId?: string): Promise<string | null> {
  try {
    const url = `${MEWS_API_URL}/api/connector/v1/customers/getAll`;
    const fetchOpts: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: MEWS_CLIENT_TOKEN,
        AccessToken: accessToken,
        Client: 'Mews Sandbox Manager',
        Emails: [email],
        Extent: {
          Customers: true,
          Documents: false,
          Addresses: false
        }
      })
    };
    const contextStr = 'customers/getAll';

    const response = logId
      ? await fetchWithRateLimitAndLog(url, accessToken, fetchOpts, contextStr, {
          unifiedLogId: logId,
          group: 'customers',
        })
      : await fetchWithRateLimit(url, accessToken, fetchOpts, contextStr);

    if (!response.ok) {
      console.warn(`[CUSTOMERS] Failed to fetch existing customer ${email}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.Customers && data.Customers.length > 0) {
      const customerId = data.Customers[0].Id;
      console.log(`[CUSTOMERS] ✓ Found existing customer ${email}: ${customerId}`);
      return customerId;
    }

    return null;
  } catch (error) {
    console.warn(`[CUSTOMERS] Error fetching existing customer ${email}:`, error);
    return null;
  }
}

/**
 * Create a single customer
 */
async function createSingleCustomer(customer: SampleCustomer, accessToken: string, language: SupportedLanguage = 'en', logId?: string): Promise<string> {
  const requestBody = {
    ClientToken: MEWS_CLIENT_TOKEN,
    AccessToken: accessToken,
    Client: 'Free Trial Generator',
    FirstName: customer.FirstName,
    LastName: customer.LastName,
    Email: customer.Email,
    Phone: customer.Phone,
    BirthDate: customer.BirthDate,
    NationalityCode: customer.NationalityCode,
    Sex: customer.Sex,
    Title: customer.Title,
    Classifications: customer.Classifications,
    Notes: customer.Notes ? translateNote(customer.Notes, language) : undefined
  };

  const url = `${MEWS_API_URL}/api/connector/v1/customers/add`;
  const fetchOpts: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  };
  const contextStr = 'customers/add';

  const response = logId
    ? await fetchWithRateLimitAndLog(url, accessToken, fetchOpts, contextStr, {
        unifiedLogId: logId,
        group: 'customers',
        metadata: { customerEmail: customer.Email },
      })
    : await fetchWithRateLimit(url, accessToken, fetchOpts, contextStr);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Check if customer already exists (400 error with specific message)
    if (response.status === 400 &&
        errorData.Message &&
        errorData.Message.toLowerCase().includes('customer with the specified email already exists')) {
      console.log(`[CUSTOMERS] ℹ Customer ${customer.Email} already exists, fetching existing ID...`);

      // Try to fetch existing customer ID
      const existingCustomerId = await getCustomerByEmail(customer.Email, accessToken, logId);

      if (existingCustomerId) {
        return existingCustomerId;
      }

      // If we couldn't fetch the existing customer, still throw error
      console.error(`[CUSTOMERS] ❌ Customer exists but couldn't fetch ID for ${customer.Email}`);
    }

    // Log all other errors
    console.error(`[CUSTOMERS] Customer API error for ${customer.Email}:`, {
      status: response.status,
      statusText: response.statusText,
      errorData: errorData
    });
    throw new Error(`Customer API failed: ${response.status} - ${errorData.Message || errorData.error || JSON.stringify(errorData)}`);
  }

  const data = await response.json();

  if (!data.Id || typeof data.Id !== 'string' || data.Id.trim() === '') {
    console.error(`[CUSTOMERS] ❌ Invalid customer ID in response for ${customer.Email}:`, {
      responseData: data,
      receivedId: data.Id,
      idType: typeof data.Id
    });
    throw new Error(`Customer API returned invalid ID: ${data.Id}`);
  }

  // Log request and response together
  log.customers(`Created customer ${customer.Email} (reservation flow)`, {
    request: requestBody,
    response: data
  });

  return data.Id;
}

/**
 * Generate reservation data in memory with per-category targets
 */
function generateReservationData(
  categoryTargets: CategoryTarget[],
  uniqueCustomerCount: number,
  rates: MewsData['rates'],
  envData: EnvironmentData,
  adultAgeCategoryId: string,
  dateRange?: { start: Date; end: Date },
  vouchersByRate?: Map<string, string>
): ReservationData[] {
  const totalReservations = categoryTargets.reduce((sum, ct) => sum + ct.targetReservations, 0);
  console.log(`[RESERVATIONS] Generating ${totalReservations} reservation templates across ${categoryTargets.length} categories...`);

  const reservations: ReservationData[] = [];

  // Use custom date range if provided, otherwise use default logic
  const startDate = dateRange?.start || addDays(envData.createdAt, -2);
  const endDate = dateRange?.end || addDays(envData.createdAt, envData.durationDays);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const today = startOfDay(new Date());
  const stateTracker = new ReservationStateTracker();

  // Compute usable rates: public rates + private rates that have a voucher
  const usableRates = rates.filter(rate => {
    if (rate.isPublic) return true;
    if (vouchersByRate?.has(rate.id)) return true;
    console.log(`[RESERVATIONS] Excluding private rate "${rate.name}" (no voucher available)`);
    return false;
  });

  if (usableRates.length === 0) {
    throw new Error('No usable rates available. All rates are private with no voucher codes.');
  }

  // Split rates into public and private pools for weighted distribution
  const publicRates = usableRates.filter(r => r.isPublic);
  const privateRates = usableRates.filter(r => !r.isPublic);
  const hasPublicRates = publicRates.length > 0;
  const hasPrivateRates = privateRates.length > 0;

  console.log(`[RESERVATIONS] Using ${usableRates.length}/${rates.length} rates for reservation distribution:`);
  console.log(`[RESERVATIONS]   Public rates: ${publicRates.length}, Private rates: ${privateRates.length}`);
  if (hasPrivateRates) {
    console.log(`[RESERVATIONS]   Private rates will be used for ~20% of reservations`);
  }
  usableRates.forEach(r => {
    console.log(`[RESERVATIONS]   - ${r.name} (${r.isPublic ? 'Public' : 'Private'})`);
  });

  let globalIndex = 0;
  let privateRateIndex = 0;
  let publicRateIndex = 0;

  // Generate reservations per category to meet each category's target
  for (const target of categoryTargets) {
    console.log(`[RESERVATIONS] Generating ${target.targetReservations} reservations for category: ${target.categoryName}`);

    for (let i = 0; i < target.targetReservations; i++) {
      // Assign customer index (rotate through unique customers for repeat guests)
      const customerIndex = globalIndex % uniqueCustomerCount;

      // Determine stay length based on per-category distribution
      const stayLength = getStayLength(i, target.targetReservations);

      // Spread check-in dates across time window
      const dayOffset = globalIndex % totalDays;
      const checkInDate = addDays(startDate, dayOffset);
      const checkOutDate = addDays(checkInDate, stayLength);

      // Convert to UTC with proper times
      const checkInUtc = fromZonedTime(
        set(checkInDate, { hours: 15, minutes: 0, seconds: 0, milliseconds: 0 }),
        envData.timezone
      );
      const checkOutUtc = fromZonedTime(
        set(checkOutDate, { hours: 11, minutes: 0, seconds: 0, milliseconds: 0 }),
        envData.timezone
      );

      // Assign rate: use private rates for ~20% of reservations (every 5th), public for the rest
      // If only private rates exist (no public), use all private rates
      // If only public rates exist (no private), use all public rates
      let rateId: string;
      if (!hasPublicRates) {
        // All rates are private — use them all via round-robin
        rateId = privateRates[globalIndex % privateRates.length].id;
      } else if (hasPrivateRates && globalIndex % 5 === 0) {
        // Use a private rate (~20% of reservations)
        rateId = privateRates[privateRateIndex % privateRates.length].id;
        privateRateIndex++;
      } else {
        // Use a public rate (~80% of reservations)
        rateId = publicRates[publicRateIndex % publicRates.length].id;
        publicRateIndex++;
      }

      // Determine desired state using tracker to enforce limits
      const desiredState = stateTracker.determineState(checkInDate, checkOutDate, today);

      reservations.push({
        customerIndex,
        resourceCategoryId: target.categoryId,
        rateId,
        checkInUtc,
        checkOutUtc,
        adultCount: 2, // Default to 2 adults
        desiredState
      });

      globalIndex++;
    }
  }

  // Log state distribution stats
  const stateStats = stateTracker.getStats();
  console.log(`[RESERVATIONS] State limits applied: ${stateStats.uncheckedYesterdayArrivals} unchecked yesterday arrivals, ${stateStats.uncheckedTodayDepartures} unchecked today departures`);

  // Shuffle reservations to avoid clustering by stay length
  const shuffled = shuffleArray(reservations);

  console.log(`[RESERVATIONS] Generated and shuffled ${shuffled.length} total reservations`);
  return shuffled;
}

/**
 * Simple seeded random number generator (Linear Congruential Generator)
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Shuffle array using Fisher-Yates algorithm with seeded RNG for deterministic results
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  const random = seededRandom(42); // Fixed seed for consistent ordering

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get stay length based on distribution
 */
function getStayLength(index: number, total: number): number {
  const ratio = index / total;
  if (ratio < 0.50) return 1; // 50%
  if (ratio < 0.80) return 2; // 30%
  if (ratio < 0.95) return 3; // 15%
  return 4; // 5%
}


/**
 * Configuration for reservation state limits
 */
interface StateTrackingConfig {
  maxUncheckedYesterdayArrivals: number;
  maxUncheckedTodayDepartures: number;
}

/**
 * Tracks reservation state assignments and enforces limits
 * to create realistic distributions:
 * - Only 1-2 unchecked arrivals from yesterday (must be 2+ night stays)
 * - Only 1-2 unchecked departures for today
 * - All arrivals from 2+ days ago must be checked in
 */
class ReservationStateTracker {
  private uncheckedYesterdayArrivals = 0;
  private uncheckedTodayDepartures = 0;

  constructor(
    private config: StateTrackingConfig = {
      maxUncheckedYesterdayArrivals: 2,
      maxUncheckedTodayDepartures: 3
    }
  ) {}

  /**
   * Determine reservation state with enforced limits
   */
  determineState(
    checkInDate: Date,
    checkOutDate: Date,
    today: Date
  ): 'Confirmed' | 'Started' | 'Processed' {
    const yesterday = addDays(startOfDay(today), -1);
    const checkInDay = startOfDay(checkInDate);

    // Case 1: Checkout before today -> always Processed (past stay)
    if (checkOutDate < today) {
      return 'Processed';
    }

    // Case 2: Checkout is today -> ensure 2-3 departures remain Started (ready for checkout)
    if (isSameDay(checkOutDate, today)) {
      // Deterministic logic to ensure we get 2-3 Started departures:
      // - If we have < 2: always make it Started (ensure minimum of 2)
      // - If we have == 2: 50% chance to make it Started (sometimes get 3)
      // - If we have >= 3: always make it Processed (cap at 3)
      if (this.uncheckedTodayDepartures < 2) {
        this.uncheckedTodayDepartures++;
        return 'Started'; // Still checked in, ready for checkout
      } else if (
        this.uncheckedTodayDepartures < this.config.maxUncheckedTodayDepartures &&
        Math.random() < 0.5
      ) {
        this.uncheckedTodayDepartures++;
        return 'Started'; // Still checked in, ready for checkout
      }
      return 'Processed'; // Already checked out
    }

    // Case 3: Check-in before yesterday (2+ days ago) -> MUST be checked in
    if (checkInDay < yesterday) {
      return 'Started'; // Past arrivals must be checked in
    }

    // Case 4: Check-in was yesterday -> limit unchecked arrivals to max 2
    // Only allow unchecked for stays of 2+ nights (1-night stay leaving today would definitely have checked in)
    if (isSameDay(checkInDate, yesterday)) {
      const stayLength = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (
        stayLength >= 2 &&
        this.uncheckedYesterdayArrivals < this.config.maxUncheckedYesterdayArrivals &&
        Math.random() < 0.25
      ) {
        this.uncheckedYesterdayArrivals++;
        return 'Confirmed'; // Late arrival, not yet checked in
      }
      return 'Started'; // Checked in yesterday
    }

    // Case 5: Check-in is today -> some early check-ins
    if (isSameDay(checkInDate, today)) {
      return Math.random() < 0.2 ? 'Started' : 'Confirmed';
    }

    // Case 6: Future check-in -> always Confirmed
    return 'Confirmed';
  }

  /**
   * Get statistics for logging
   */
  getStats(): {
    uncheckedYesterdayArrivals: number;
    uncheckedTodayDepartures: number;
  } {
    return {
      uncheckedYesterdayArrivals: this.uncheckedYesterdayArrivals,
      uncheckedTodayDepartures: this.uncheckedTodayDepartures
    };
  }
}

/**
 * Group reservations for API calls (2-4 per group)
 */
function groupReservationsForAPI(reservations: ReservationData[]): ReservationData[][] {
  const grouped = new Map<string, ReservationData[]>();

  // Group by check-in/check-out dates
  for (const reservation of reservations) {
    const key = `${reservation.checkInUtc.toISOString()}-${reservation.checkOutUtc.toISOString()}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(reservation);
  }

  // Split large groups into batches of 2-4
  const groups: ReservationData[][] = [];
  for (const [, reservationList] of Array.from(grouped.entries())) {
    for (let i = 0; i < reservationList.length; i += 4) {
      const batch = reservationList.slice(i, Math.min(i + 4, reservationList.length));
      groups.push(batch);
    }
  }

  return groups;
}

/**
 * Send a single reservation group to the Mews API
 */
async function sendReservationGroup(
  group: ReservationData[],
  groupIndex: number,
  serviceId: string,
  accessToken: string,
  adultAgeCategoryId: string,
  vouchersByRate: Map<string, string>,
  logId?: string
): Promise<{ created: any[]; failed: any[] }> {
  const created: any[] = [];
  const failed: any[] = [];

  const url = `${MEWS_API_URL}/api/connector/v1/reservations/add`;
  const fetchOpts: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: MEWS_CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      ServiceId: serviceId,
      Reservations: group.map(r => {
        const reservation: any = {
          State: 'Confirmed',
          StartUtc: r.checkInUtc.toISOString(),
          EndUtc: r.checkOutUtc.toISOString(),
          CustomerId: r.customerId,
          RequestedCategoryId: r.resourceCategoryId,
          RateId: r.rateId,
          PersonCounts: [{
            AgeCategoryId: adultAgeCategoryId,
            Count: r.adultCount
          }]
        };

        // Add voucher code if available for this rate
        const voucherCode = vouchersByRate.get(r.rateId);
        if (voucherCode) {
          reservation.VoucherCode = voucherCode;
        }

        return reservation;
      })
    })
  };
  const contextStr = 'reservations/add';

  const response = logId
    ? await fetchWithRateLimitAndLog(url, accessToken, fetchOpts, contextStr, {
        unifiedLogId: logId,
        group: 'reservations',
      })
    : await fetchWithRateLimit(url, accessToken, fetchOpts, contextStr);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle "no availability" errors gracefully - this is expected and not a critical failure
    if (response.status === 403 &&
        errorData.Message &&
        errorData.Message.toLowerCase().includes('no availability')) {
      console.log(`[RESERVATIONS] ℹ️ Group ${groupIndex} skipped: No availability for selected dates (expected for some date ranges)`);
      console.log(`[RESERVATIONS] ℹ️ Continuing with remaining groups...`);
      group.forEach(r => {
        failed.push({
          ...r,
          error: 'No availability for selected dates',
          skipped: true
        });
      });
      return { created, failed };
    }

    // For other errors, log and throw
    console.error(`[RESERVATIONS] Reservation API error for group ${groupIndex}:`, {
      status: response.status,
      statusText: response.statusText,
      groupSize: group.length,
      errorData: errorData
    });
    throw new Error(`Reservation API failed: ${response.status} - ${errorData.Message || errorData.error || JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const reservationIds = data.Reservations?.map((r: any) => r.Reservation?.Id) || [];

  // Validate and store reservations with desired states for later state transitions
  for (let j = 0; j < reservationIds.length; j++) {
    const id = reservationIds[j];
    if (id && typeof id === 'string' && id.trim() !== '') {
      created.push({
        id: id,
        desiredState: group[j].desiredState
      });
    } else {
      console.warn(`[RESERVATIONS] ⚠️ Invalid reservation ID at index ${j} in group ${groupIndex}: ${id}`);
      failed.push({ ...group[j], error: 'Invalid reservation ID returned from API' });
    }
  }

  // If we got fewer IDs than expected, mark the missing ones as failures
  if (reservationIds.length < group.length) {
    console.warn(`[RESERVATIONS] ⚠️ Expected ${group.length} reservations but only got ${reservationIds.length} IDs`);
    for (let j = reservationIds.length; j < group.length; j++) {
      failed.push({ ...group[j], error: 'No reservation ID returned from API' });
    }
  }

  return { created, failed };
}

/**
 * Create reservation groups via API (for pre-provided customer IDs path)
 */
async function createReservationGroups(
  groups: ReservationData[][],
  serviceId: string,
  accessToken: string,
  adultAgeCategoryId: string,
  vouchersByRate: Map<string, string>,
  logId?: string
): Promise<{ createdReservations: any[]; failures: any[] }> {
  const createdReservations: any[] = [];
  const failures: any[] = [];

  for (let i = 0; i < groups.length; i++) {
    try {
      const result = await sendReservationGroup(groups[i], i, serviceId, accessToken, adultAgeCategoryId, vouchersByRate, logId);
      createdReservations.push(...result.created);
      failures.push(...result.failed);
    } catch (error) {
      console.error(`[RESERVATIONS] Group ${i} failed:`, error);
      failures.push(...groups[i].map(r => ({ ...r, error: (error as Error).message })));
    }
  }

  return { createdReservations, failures };
}

/**
 * Create reservation groups with interleaved JIT customer creation.
 * For each group, creates any needed customers before sending reservations.
 */
async function createReservationGroupsWithCustomers(
  groups: ReservationData[][],
  customerProfiles: SampleCustomer[],
  serviceId: string,
  accessToken: string,
  adultAgeCategoryId: string,
  vouchersByRate: Map<string, string>,
  language: SupportedLanguage,
  logId?: string
): Promise<{ createdReservations: any[]; failures: any[]; customerPool: Map<number, string> }> {
  const customerPool = new Map<number, string>(); // customerIndex → Mews customer ID
  const createdReservations: any[] = [];
  const failures: any[] = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];

    // Step 1: Create any new customers needed for this group
    for (const reservation of group) {
      if (!customerPool.has(reservation.customerIndex)) {
        try {
          const profile = customerProfiles[reservation.customerIndex];
          const customerId = await createSingleCustomer(profile, accessToken, language, logId);
          customerPool.set(reservation.customerIndex, customerId);
        } catch (error) {
          console.error(`[CUSTOMERS] Failed to create customer for index ${reservation.customerIndex}:`, error);
        }
      }
    }

    // Step 2: Assign customer IDs and filter out reservations with failed customers
    const validGroup: ReservationData[] = [];
    for (const reservation of group) {
      const customerId = customerPool.get(reservation.customerIndex);
      if (customerId) {
        reservation.customerId = customerId;
        validGroup.push(reservation);
      } else {
        failures.push({ ...reservation, error: 'Customer creation failed' });
      }
    }

    if (validGroup.length === 0) continue;

    // Step 3: Send reservation group to API
    try {
      const result = await sendReservationGroup(validGroup, i, serviceId, accessToken, adultAgeCategoryId, vouchersByRate, logId);
      createdReservations.push(...result.created);
      failures.push(...result.failed);
    } catch (error) {
      console.error(`[RESERVATIONS] Group ${i} failed:`, error);
      failures.push(...validGroup.map(r => ({ ...r, error: (error as Error).message })));
    }
  }

  return { createdReservations, failures, customerPool };
}

/**
 * Fetch reservation details including assigned resources and start times
 */
async function fetchReservationDetails(
  reservationIds: string[],
  accessToken: string,
  logId?: string
): Promise<Array<{ Id: string; AssignedResourceId?: string; StartUtc?: string }>> {
  const allReservations: Array<{ Id: string; AssignedResourceId?: string; StartUtc?: string }> = [];

  // Batch requests if more than 1000 IDs (unlikely but handle it)
  for (let i = 0; i < reservationIds.length; i += 1000) {
    const batch = reservationIds.slice(i, Math.min(i + 1000, reservationIds.length));

    try {
      const url = `${MEWS_API_URL}/api/connector/v1/reservations/getAll/2023-06-06`;
      const fetchOpts: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientToken: MEWS_CLIENT_TOKEN,
          AccessToken: accessToken,
          Client: 'Mews Sandbox Manager',
          ReservationIds: batch,
          Limitation: { Count: 1000 }
        })
      };
      const contextStr = 'reservations/getAll';

      const response = logId
        ? await fetchWithRateLimitAndLog(url, accessToken, fetchOpts, contextStr, {
            unifiedLogId: logId,
            group: 'reservations',
          })
        : await fetchWithRateLimit(url, accessToken, fetchOpts, contextStr);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[RESOURCE_PREP] ❌ Failed to fetch reservation details: ${response.status} - ${errorText}`);
        continue; // Skip this batch, continue with next
      }

      const data = await response.json();
      const reservations = data.Reservations || [];
      allReservations.push(...reservations);

      console.log(`[RESOURCE_PREP] Fetched ${reservations.length} reservation details`);

    } catch (error) {
      console.error('[RESOURCE_PREP] ❌ Error fetching reservation details:', error);
      // Continue with what we have
    }
  }

  return allReservations;
}

/**
 * Update resource states to "Inspected"
 */
async function updateResourceStates(
  resourceIds: string[],
  accessToken: string,
  logId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `${MEWS_API_URL}/api/connector/v1/resources/update`;
    const fetchOpts: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: MEWS_CLIENT_TOKEN,
        AccessToken: accessToken,
        Client: 'Mews Sandbox Manager',
        ResourceUpdates: resourceIds.map(resourceId => ({
          ResourceId: resourceId,
          State: {
            Value: 'Inspected'
          },
          StateReason: {
            Value: 'Room inspection completed'
          }
        }))
      })
    };
    const contextStr = 'resources/update';

    const response = logId
      ? await fetchWithRateLimitAndLog(url, accessToken, fetchOpts, contextStr, {
          unifiedLogId: logId,
          group: 'state_transitions',
        })
      : await fetchWithRateLimit(url, accessToken, fetchOpts, contextStr);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      };
    }

    // API returns empty object on success
    await response.json();
    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Prepare resources for check-in by setting them to "Inspected" state
 */
async function prepareResourcesForCheckIn(
  reservations: Array<{ Id: string; AssignedResourceId?: string }>,
  accessToken: string,
  logId?: string
): Promise<{ successCount: number; failureCount: number; inspectedRoomIds: Set<string> }> {
  console.log(`[RESOURCE_PREP] Preparing resources for ${reservations.length} reservations...`);

  const inspectedRoomIds = new Set<string>();

  if (reservations.length === 0) {
    console.warn('[RESOURCE_PREP] ⚠️ No reservations provided, skipping resource preparation');
    return { successCount: 0, failureCount: 0, inspectedRoomIds };
  }

  // Extract unique resource IDs
  const resourceIds = Array.from(
    new Set(
      reservations
        .filter(r => r.AssignedResourceId)
        .map(r => r.AssignedResourceId!)
    )
  );

  console.log(`[RESOURCE_PREP] Found ${resourceIds.length} unique resources to prepare`);

  if (resourceIds.length === 0) {
    console.log('[RESOURCE_PREP] No resources assigned yet, skipping preparation');
    return { successCount: 0, failureCount: 0, inspectedRoomIds };
  }

  // Step 3: Batch update resources (max 1000 per call)
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < resourceIds.length; i += 1000) {
    const batch = resourceIds.slice(i, Math.min(i + 1000, resourceIds.length));
    const batchNum = Math.floor(i / 1000) + 1;
    const totalBatches = Math.ceil(resourceIds.length / 1000);

    console.log(`[RESOURCE_PREP] Updating batch ${batchNum}/${totalBatches} (${batch.length} resources)...`);

    try {
      const result = await updateResourceStates(batch, accessToken, logId);
      if (result.success) {
        // Track successfully inspected rooms
        batch.forEach(roomId => inspectedRoomIds.add(roomId));
        successCount += batch.length;
        console.log(`[RESOURCE_PREP] ✅ Batch ${batchNum}/${totalBatches} updated successfully`);
      } else {
        failureCount += batch.length;
        console.error(`[RESOURCE_PREP] ❌ Batch ${batchNum}/${totalBatches} failed: ${result.error}`);
      }
    } catch (error) {
      failureCount += batch.length;
      console.error(`[RESOURCE_PREP] ❌ Batch ${batchNum}/${totalBatches} error:`, error);
    }
  }

  console.log(`[RESOURCE_PREP] ✅ Resource preparation complete: ${successCount} succeeded, ${failureCount} failed`);
  console.log(`[RESOURCE_PREP] Successfully inspected ${inspectedRoomIds.size} unique rooms`);

  // Don't throw - just log and continue
  if (failureCount > 0) {
    console.warn(`[RESOURCE_PREP] ⚠️ ${failureCount} resource(s) failed to update, but continuing...`);
  }

  return { successCount, failureCount, inspectedRoomIds };
}

/**
 * Process state transitions for a single room's reservations (sequential within room).
 * Rooms are independent, so this function can be called in parallel for different rooms.
 */
async function processRoomStateTransitions(
  roomId: string,
  roomReservations: Array<{ id: string; desiredState: string; assignedResourceId: string; startUtc: string }>,
  accessToken: string,
  inspectedRooms: Set<string>,
  logId?: string,
  deadlineMs?: number
): Promise<{ success: number; failure: number; skipped: number }> {
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;
  const roomName = roomId === 'unassigned' ? 'unassigned reservations' : `room ${roomId}`;

  for (let i = 0; i < roomReservations.length; i++) {
    // Deadline check: stop early if approaching Vercel timeout
    if (deadlineMs && Date.now() > deadlineMs) {
      skippedCount = roomReservations.length - i;
      console.warn(`[RESERVATIONS] Deadline reached in ${roomName}. Skipping remaining ${skippedCount} reservations.`);
      break;
    }

    const res = roomReservations[i];
    const prevRes = i > 0 ? roomReservations[i - 1] : null;

    try {
      // If previous reservation was processed (checked out), re-inspect the room before starting next
      if (prevRes && prevRes.desiredState === 'Processed' && res.assignedResourceId !== 'unassigned') {
        const inspectResult = await updateResourceStates([res.assignedResourceId], accessToken, logId);
        if (inspectResult.success) {
          inspectedRooms.add(res.assignedResourceId);
        } else {
          console.warn(`[RESERVATIONS] Failed to re-inspect room ${res.assignedResourceId}: ${inspectResult.error}`);
        }
      }

      // Ensure room is inspected before FIRST check-in in this room
      if ((res.desiredState === 'Started' || res.desiredState === 'Processed') &&
          res.assignedResourceId !== 'unassigned' &&
          !inspectedRooms.has(res.assignedResourceId)) {
        const inspectResult = await updateResourceStates([res.assignedResourceId], accessToken, logId);
        if (inspectResult.success) {
          inspectedRooms.add(res.assignedResourceId);
        } else {
          console.warn(`[RESERVATIONS] Failed to inspect room ${res.assignedResourceId}: ${inspectResult.error}`);
          // Don't add to set - let retry logic handle it
        }
      }

      // Apply state transitions
      if (res.desiredState === 'Started') {
        await callStateTransitionAPI('start', res.id, accessToken, res.assignedResourceId, inspectedRooms, logId);
        successCount++;
      } else if (res.desiredState === 'Processed') {
        await callStateTransitionAPI('start', res.id, accessToken, res.assignedResourceId, inspectedRooms, logId);
        await callStateTransitionAPI('process', res.id, accessToken, undefined, undefined, logId);
        successCount++;
      }
      // Confirmed state doesn't need transitions
    } catch (error) {
      console.error(`[RESERVATIONS] Failed to transition reservation ${res.id} in ${roomName}:`, (error as Error).message);
      failureCount++;
    }
  }

  return { success: successCount, failure: failureCount, skipped: skippedCount };
}

/** Concurrency limit for parallel room processing */
const ROOM_CONCURRENCY = 5;

/**
 * Apply state transitions with parallelism across rooms.
 * Rooms are processed in parallel (up to ROOM_CONCURRENCY at a time) since they are independent.
 * Within each room, reservations are processed sequentially in chronological order
 * (required for correctness: must check out before re-inspecting, must inspect before next check-in).
 */
async function applyStateTransitionsSequentially(
  reservations: Array<{ id: string; desiredState: string }>,
  reservationDetails: Array<{ Id: string; AssignedResourceId?: string; StartUtc?: string }>,
  accessToken: string,
  initialInspectedRooms?: Set<string>,
  logId?: string,
  deadlineMs?: number
): Promise<void> {
  // Initialize with rooms that were successfully inspected in bulk preparation
  const inspectedRooms = new Set<string>(initialInspectedRooms || []);
  console.log(`[RESERVATIONS] Starting with ${inspectedRooms.size} pre-inspected rooms`);

  // Filter out invalid IDs
  const validReservations = reservations.filter(r => r.id && typeof r.id === 'string' && r.id.trim() !== '');

  const invalidCount = reservations.length - validReservations.length;
  if (invalidCount > 0) {
    console.warn(`[RESERVATIONS] Filtered out ${invalidCount} invalid reservation ID(s)`);
  }

  // Create a map for quick lookup of reservation details
  const detailsMap = new Map(reservationDetails.map(d => [d.Id, d]));

  // Enrich reservations with assignment and timing data
  const enrichedReservations = validReservations
    .map(r => {
      const details = detailsMap.get(r.id);
      return {
        id: r.id,
        desiredState: r.desiredState,
        assignedResourceId: details?.AssignedResourceId || 'unassigned',
        startUtc: details?.StartUtc || ''
      };
    });

  // Group by assigned resource (room)
  const byRoom = new Map<string, typeof enrichedReservations>();
  for (const res of enrichedReservations) {
    if (!byRoom.has(res.assignedResourceId)) {
      byRoom.set(res.assignedResourceId, []);
    }
    byRoom.get(res.assignedResourceId)!.push(res);
  }

  // Sort each room's reservations chronologically
  for (const [roomId, roomReservations] of Array.from(byRoom.entries())) {
    roomReservations.sort((a: typeof enrichedReservations[0], b: typeof enrichedReservations[0]) =>
      a.startUtc.localeCompare(b.startUtc)
    );
  }

  console.log(`[RESERVATIONS] Applying state transitions across ${byRoom.size} rooms (${ROOM_CONCURRENCY} rooms in parallel)...`);

  let totalSuccess = 0;
  let totalFailure = 0;
  let totalSkipped = 0;

  // Process rooms in parallel with controlled concurrency
  const roomEntries = Array.from(byRoom.entries());

  for (let i = 0; i < roomEntries.length; i += ROOM_CONCURRENCY) {
    // Deadline check before starting next chunk of rooms
    if (deadlineMs && Date.now() > deadlineMs) {
      const remainingRooms = roomEntries.length - i;
      const remainingReservations = roomEntries.slice(i).reduce((sum, [, res]) => sum + res.length, 0);
      console.warn(`[RESERVATIONS] Deadline reached. Skipping ${remainingRooms} rooms (${remainingReservations} reservations).`);
      totalSkipped += remainingReservations;
      break;
    }

    const chunk = roomEntries.slice(i, i + ROOM_CONCURRENCY);

    const results = await Promise.allSettled(
      chunk.map(([roomId, roomReservations]) =>
        processRoomStateTransitions(roomId, roomReservations, accessToken, inspectedRooms, logId, deadlineMs)
      )
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        totalSuccess += result.value.success;
        totalFailure += result.value.failure;
        totalSkipped += result.value.skipped;
      } else {
        console.error('[RESERVATIONS] Room processing failed:', result.reason);
      }
    }
  }

  console.log(`[RESERVATIONS] State transitions complete: ${totalSuccess} succeeded, ${totalFailure} failed${totalSkipped > 0 ? `, ${totalSkipped} skipped (deadline)` : ''}`);

  if (totalFailure > 0) {
    console.warn(`[RESERVATIONS] ${totalFailure} state transition(s) failed, but continuing...`);
  }
  if (totalSkipped > 0) {
    console.warn(`[RESERVATIONS] ${totalSkipped} reservation(s) skipped due to deadline. These remain in Confirmed state.`);
  }
}

/**
 * Call state transition API with detailed logging
 * Note: Both start and process APIs accept only a single reservation ID at a time
 */
async function callStateTransitionAPI(
  action: 'start' | 'process',
  reservationId: string,
  accessToken: string,
  assignedResourceId?: string,
  inspectedRooms?: Set<string>,
  logId?: string
): Promise<void> {
  const endpoint = action === 'start' ? 'reservations/start' : 'reservations/process';
  const url = `${MEWS_API_URL}/api/connector/v1/${endpoint}`;

  // Prepare payload - use singular ReservationId
  const payload: any = {
    ClientToken: MEWS_CLIENT_TOKEN,
    AccessToken: accessToken,
    Client: 'Free Trial Generator',
    ReservationId: reservationId
  };

  // Add required fields for process action
  if (action === 'process') {
    payload.CloseBills = false;
    payload.AllowOpenBalance = true;
    payload.Notes = 'Reservation processed via Mews Sandbox Manager';
  }

  console.log(`[RESERVATIONS] ${action} reservation ${reservationId}`);

  const fetchOpts: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };
  const contextStr = `reservations/${action}`;

  const response = logId
    ? await fetchWithRateLimitAndLog(url, accessToken, fetchOpts, contextStr, {
        unifiedLogId: logId,
        group: 'state_transitions',
      })
    : await fetchWithRateLimit(url, accessToken, fetchOpts, contextStr);

  if (!response.ok) {
    // Capture the full error response body
    const errorText = await response.text();
    let errorDetails = errorText;

    // Try to parse as JSON for structured error info
    try {
      const errorJson = JSON.parse(errorText);
      errorDetails = JSON.stringify(errorJson, null, 2);
    } catch {
      // Keep as plain text if not JSON
    }

    // Retry logic for room state errors (uninspected, blocked, dirty)
    if (action === 'start' &&
        response.status === 403 &&
        (errorText.toLowerCase().includes('not available for check-in') ||
         errorText.toLowerCase().includes('blocked')) &&
        assignedResourceId &&
        assignedResourceId !== 'unassigned' &&
        inspectedRooms) {

      const errorType = errorText.toLowerCase().includes('blocked') ? 'blocked/occupied' : 'uninspected/Dirty';
      console.log(`[RESERVATIONS] ⚠️ Check-in failed for reservation ${reservationId} in room ${assignedResourceId}`);
      console.log(`[RESERVATIONS] ⚠️ Room may be ${errorType}. Attempting inspection to resolve...`);

      // Attempt to inspect the room
      const inspectResult = await updateResourceStates([assignedResourceId], accessToken, logId);

      if (inspectResult.success) {
        inspectedRooms.add(assignedResourceId);
        console.log(`[RESERVATIONS] ✅ Room ${assignedResourceId} inspected. Retrying check-in...`);

        // Retry the start transition
        const retryFetchOpts: RequestInit = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        };
        const retryContextStr = `reservations/${action}-retry`;

        const retryResponse = logId
          ? await fetchWithRateLimitAndLog(url, accessToken, retryFetchOpts, retryContextStr, {
              unifiedLogId: logId,
              group: 'state_transitions',
            })
          : await fetchWithRateLimit(url, accessToken, retryFetchOpts, retryContextStr);

        if (retryResponse.ok) {
          await retryResponse.text(); // consume response body
          console.log(`[RESERVATIONS] ${action} OK after inspection: ${reservationId}`);
          return; // Success!
        } else {
          const retryError = await retryResponse.text();

          // Check if it's a blocked error first (overlapping reservation - expected scenario)
          if (retryError.toLowerCase().includes('blocked')) {
            console.warn(`[RESERVATIONS] ⚠️ Room ${assignedResourceId} remains blocked - likely has an overlapping reservation`);
            console.warn(`[RESERVATIONS] ⚠️ Skipping check-in for reservation ${reservationId} to avoid conflict`);
            console.log(`[RESERVATIONS] ℹ️ Reservation ${reservationId} will remain in Confirmed state`);
            return; // Gracefully skip this check-in without throwing error
          }

          // For other errors, log and throw
          console.error(`[RESERVATIONS] ❌ Retry failed after inspection`);
          console.error(`[RESERVATIONS] Retry Error:`, retryError);
          throw new Error(`Failed to ${action} reservation after inspection: ${retryResponse.status} - ${retryError}`);
        }
      } else {
        console.error(`[RESERVATIONS] ❌ Failed to inspect room ${assignedResourceId}: ${inspectResult.error}`);
        // Fall through to original error handling
      }
    }

    console.error(`[RESERVATIONS] ❌ ${action} transition FAILED`);
    console.error(`[RESERVATIONS] HTTP Status: ${response.status} ${response.statusText}`);
    console.error(`[RESERVATIONS] Reservation ID: ${reservationId}`);
    console.error(`[RESERVATIONS] Error Response:`, errorDetails);

    throw new Error(`Failed to ${action} reservation: ${response.status} - ${errorText}`);
  }

  // Consume response body to free resources
  await response.text();
  console.log(`[RESERVATIONS] ${action} OK: ${reservationId}`);
}
