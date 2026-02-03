/**
 * Reservation Service - Creates realistic reservations in Mews trial environments
 *
 * This service orchestrates the creation of customers and reservations with proper
 * states (Confirmed, Started, Processed) and realistic distributions.
 */

import { prisma } from './prisma';
import { fetchMewsData, MewsData } from './mews-data-service';
import { getSampleCustomers, SampleCustomer } from './sample-customers';
import { fromZonedTime } from 'date-fns-tz';
import { addDays, set, isSameDay, startOfDay } from 'date-fns';

const MEWS_CLIENT_TOKEN = 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';
const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews-demo.com';
const CUSTOMER_CONCURRENCY = 5; // Process 5 customers at a time

export interface ReservationCreationResult {
  totalReservations: number;
  totalCustomers: number;
  successCount: number;
  failureCount: number;
  durationSeconds: number;
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
  customerId: string;
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
 * Main entry point: Create reservations for an environment
 */
export async function createReservationsForEnvironment(
  accessToken: string,
  enterpriseId: string,
  accessTokenId: number
): Promise<ReservationCreationResult> {
  const startTime = Date.now();

  console.log(`[RESERVATIONS] Starting reservation creation for enterprise ${enterpriseId}`);

  // Create log entry
  const log = await prisma.reservationCreationLog.create({
    data: {
      enterpriseId,
      accessTokenId,
      totalReservations: 0,
      successCount: 0,
      failureCount: 0,
      status: 'processing',
      reservationResults: []
    }
  });

  try {
    // Fetch environment data
    const envData = await fetchEnvironmentData(enterpriseId);

    // Fetch Mews data
    const mewsData = await fetchMewsData(MEWS_CLIENT_TOKEN, accessToken);

    // Step 3: Filter resource categories based on what was actually created
    const filteredCategories = filterResourceCategories(mewsData.resourceCategories, envData);
    console.log(`[RESERVATIONS] Filtered resource categories: ${filteredCategories.length}`);

    if (filteredCategories.length === 0) {
      throw new Error(`No resource categories found for property type: ${envData.propertyType}`);
    }

    // Step 4: Calculate per-category reservation targets for 80% occupancy
    const categoryTargets = calculateCategoryTargets(filteredCategories, envData.durationDays);
    const totalReservations = categoryTargets.reduce((sum, ct) => sum + ct.targetReservations, 0);

    console.log(`[RESERVATIONS] Per-category targets for 80% occupancy:`);
    categoryTargets.forEach(ct => {
      console.log(`[RESERVATIONS]   - ${ct.categoryName}: ${ct.resourceCount} units → ${ct.targetReservations} reservations (${ct.targetOccupancy}% target)`);
    });
    console.log(`[RESERVATIONS] Total target reservations: ${totalReservations}`);

    console.log(`[RESERVATIONS] Setup:`, {
      propertyType: envData.propertyType,
      duration: `${envData.durationDays} days`,
      targetReservations: totalReservations
    });

    // Update log with total
    await prisma.reservationCreationLog.update({
      where: { id: log.id },
      data: { totalReservations }
    });

    // Step 6: Create customers on-demand
    const customerIds = await createCustomersOnDemand(
      accessToken,
      totalReservations,
      enterpriseId,
      accessTokenId
    );

    // Step 7: Generate reservation data with per-category targets
    const reservations = generateReservationData(
      categoryTargets,
      customerIds,
      mewsData.rates,
      envData,
      mewsData.ageCategories.adult
    );

    // Group reservations for API calls
    const groups = groupReservationsForAPI(reservations);

    // Create reservations via API
    const { createdReservations, failures } = await createReservationGroups(
      groups,
      mewsData.serviceId,
      accessToken,
      mewsData.ageCategories.adult,
      mewsData.vouchersByRate
    );

    // Fetch reservation details to get assigned resource IDs
    const reservationIds = createdReservations.map(r => r.id);
    let reservationDetails: Array<{ Id: string; AssignedResourceId?: string; StartUtc?: string }> = [];

    if (reservationIds.length > 0) {
      reservationDetails = await fetchReservationDetails(reservationIds, accessToken);

      // Prepare resources for check-in (set to Inspected state)
      await prepareResourcesForCheckIn(reservationDetails, accessToken);
    }

    // Apply state transitions sequentially per room
    await applyStateTransitionsSequentially(createdReservations, reservationDetails, accessToken);

    // Log results
    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    console.log(`[RESERVATIONS] ✅ Complete:`, {
      created: createdReservations.length,
      failed: failures.length,
      customers: customerIds.length,
      duration: `${durationSeconds}s`
    });

    await prisma.reservationCreationLog.update({
      where: { id: log.id },
      data: {
        successCount: createdReservations.length,
        failureCount: failures.length,
        completedAt: new Date(),
        status: 'completed',
        reservationResults: [...createdReservations, ...failures]
      }
    });

    return {
      totalReservations: createdReservations.length + failures.length,
      totalCustomers: customerIds.length,
      successCount: createdReservations.length,
      failureCount: failures.length,
      durationSeconds: parseFloat(durationSeconds)
    };

  } catch (error) {
    console.error(`[RESERVATIONS] ❌ Failed:`, error);

    await prisma.reservationCreationLog.update({
      where: { id: log.id },
      data: {
        status: 'failed',
        errorSummary: (error as Error).message,
        completedAt: new Date()
      }
    });

    throw error;
  }
}

/**
 * Fetch environment data from database
 */
async function fetchEnvironmentData(enterpriseId: string): Promise<EnvironmentData> {
  const envLog = await prisma.environmentLog.findFirst({
    where: { enterpriseId },
    orderBy: { timestamp: 'desc' }
  });

  if (!envLog) {
    throw new Error(`Environment log not found for enterprise: ${enterpriseId}`);
  }

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

/**
 * Filter resource categories - exclude Dorm type, allow all others
 */
function filterResourceCategories(
  categories: MewsData['resourceCategories'],
  envData: EnvironmentData
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
 * Calculate per-category reservation targets for 80% occupancy
 */
function calculateCategoryTargets(
  categories: MewsData['resourceCategories'],
  durationDays: number
): CategoryTarget[] {
  const totalDays = durationDays + 2; // Include 2 past days
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
 * Create customers on-demand
 */
async function createCustomersOnDemand(
  accessToken: string,
  count: number,
  enterpriseId: string,
  accessTokenId: number
): Promise<string[]> {
  const customers = getSampleCustomers().slice(0, count);
  const customerIds: string[] = [];

  // Create customer creation log
  const log = await prisma.customerCreationLog.create({
    data: {
      enterpriseId,
      accessTokenId,
      totalCustomers: count,
      successCount: 0,
      failureCount: 0,
      status: 'processing',
      customerResults: []
    }
  });

  try {
    // Process in batches
    for (let i = 0; i < customers.length; i += CUSTOMER_CONCURRENCY) {
      const batch = customers.slice(i, i + CUSTOMER_CONCURRENCY);
      const promises = batch.map(customer => createSingleCustomer(customer, accessToken));
      const results = await Promise.allSettled(promises);

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value) {
          customerIds.push(result.value);
        }
      });
    }

    // Update customer log
    await prisma.customerCreationLog.update({
      where: { id: log.id },
      data: {
        successCount: customerIds.length,
        failureCount: count - customerIds.length,
        completedAt: new Date(),
        status: 'completed'
      }
    });

    return customerIds;

  } catch (error) {
    await prisma.customerCreationLog.update({
      where: { id: log.id },
      data: {
        status: 'failed',
        errorSummary: (error as Error).message,
        completedAt: new Date()
      }
    });
    throw error;
  }
}

/**
 * Create a single customer
 */
async function createSingleCustomer(customer: SampleCustomer, accessToken: string): Promise<string> {
  const response = await fetch(`${MEWS_API_URL}/api/connector/v1/customers/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
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
      ...(customer.CompanyIdentifier && { CompanyIdentifier: customer.CompanyIdentifier })
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[RESERVATIONS] Customer API error for ${customer.Email}:`, {
      status: response.status,
      statusText: response.statusText,
      errorData: errorData
    });
    throw new Error(`Customer API failed: ${response.status} - ${errorData.Message || errorData.error || JSON.stringify(errorData)}`);
  }

  const data = await response.json();

  if (!data.Id) {
    console.error(`[RESERVATIONS] No customer ID in response for ${customer.Email}:`, data);
    throw new Error('Customer API returned no ID');
  }

  return data.Id;
}

/**
 * Generate reservation data in memory with per-category targets
 */
function generateReservationData(
  categoryTargets: CategoryTarget[],
  customerIds: string[],
  rates: MewsData['rates'],
  envData: EnvironmentData,
  adultAgeCategoryId: string
): ReservationData[] {
  const totalReservations = categoryTargets.reduce((sum, ct) => sum + ct.targetReservations, 0);
  console.log(`[RESERVATIONS] Generating ${totalReservations} reservation templates across ${categoryTargets.length} categories...`);

  const reservations: ReservationData[] = [];
  const totalDays = envData.durationDays + 2; // -2 to +duration
  const today = startOfDay(new Date());
  const rateDistribution = [
    { rate: 'bestPrice', weight: 0.40 },
    { rate: 'fullyFlexible', weight: 0.25 },
    { rate: 'nonRefundable', weight: 0.20 },
    { rate: 'corporateDeals', weight: 0.10 },
    { rate: 'otaDeals', weight: 0.05 }
  ];

  let globalIndex = 0;

  // Generate reservations per category to meet each category's target
  for (const target of categoryTargets) {
    console.log(`[RESERVATIONS] Generating ${target.targetReservations} reservations for category: ${target.categoryName}`);

    for (let i = 0; i < target.targetReservations; i++) {
      // Assign customer (rotate through available customers)
      const customerId = customerIds[globalIndex % customerIds.length];

      // Determine stay length based on per-category distribution
      const stayLength = getStayLength(i, target.targetReservations);

      // Spread check-in dates across time window
      const dayOffset = -2 + (globalIndex % totalDays);
      const checkInDate = addDays(envData.createdAt, dayOffset);
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

      // Assign rate based on distribution
      const rateId = getRateIdByDistribution(globalIndex, totalReservations, rates, rateDistribution);

      // Determine desired state
      const desiredState = determineReservationState(checkInDate, checkOutDate, today);

      reservations.push({
        customerId,
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
 * Get rate ID based on distribution
 */
function getRateIdByDistribution(
  index: number,
  total: number,
  rates: MewsData['rates'],
  distribution: Array<{ rate: string; weight: number }>
): string {
  const ratio = index / total;
  let cumulative = 0;

  for (const { rate, weight } of distribution) {
    cumulative += weight;
    if (ratio < cumulative) {
      return (rates as any)[rate];
    }
  }

  return rates.bestPrice; // Fallback
}

/**
 * Determine reservation state based on dates
 */
function determineReservationState(
  checkInDate: Date,
  checkOutDate: Date,
  today: Date
): 'Confirmed' | 'Started' | 'Processed' {
  if (checkOutDate < today) {
    return 'Processed'; // 100%
  } else if (isSameDay(checkOutDate, today)) {
    return Math.random() < 0.8 ? 'Processed' : 'Started'; // 80% / 20%
  } else if (isSameDay(checkInDate, today)) {
    return Math.random() < 0.2 ? 'Started' : 'Confirmed'; // 20% / 80%
  } else {
    return 'Confirmed'; // 100%
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
 * Create reservation groups via API
 */
async function createReservationGroups(
  groups: ReservationData[][],
  serviceId: string,
  accessToken: string,
  adultAgeCategoryId: string,
  vouchersByRate: Map<string, string>
): Promise<{ createdReservations: any[]; failures: any[] }> {
  const createdReservations: any[] = [];
  const failures: any[] = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];

    try {
      const response = await fetch(`${MEWS_API_URL}/api/connector/v1/reservations/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientToken: MEWS_CLIENT_TOKEN,
          AccessToken: accessToken,
          Client: 'Free Trial Generator',
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
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[RESERVATIONS] Reservation API error for group ${i}:`, {
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
        // Only add valid reservation IDs
        if (id && typeof id === 'string' && id.trim() !== '') {
          createdReservations.push({
            id: id,
            desiredState: group[j].desiredState
          });
        } else {
          console.warn(`[RESERVATIONS] ⚠️ Invalid reservation ID at index ${j} in group ${i}: ${id}`);
          failures.push({ ...group[j], error: 'Invalid reservation ID returned from API' });
        }
      }

      // If we got fewer IDs than expected, mark the missing ones as failures
      if (reservationIds.length < group.length) {
        console.warn(`[RESERVATIONS] ⚠️ Expected ${group.length} reservations but only got ${reservationIds.length} IDs`);
        for (let j = reservationIds.length; j < group.length; j++) {
          failures.push({ ...group[j], error: 'No reservation ID returned from API' });
        }
      }

    } catch (error) {
      console.error(`[RESERVATIONS] Group ${i} failed:`, error);
      failures.push(...group.map(r => ({ ...r, error: (error as Error).message })));
    }
  }

  return { createdReservations, failures };
}

/**
 * Fetch reservation details including assigned resources and start times
 */
async function fetchReservationDetails(
  reservationIds: string[],
  accessToken: string
): Promise<Array<{ Id: string; AssignedResourceId?: string; StartUtc?: string }>> {
  const allReservations: Array<{ Id: string; AssignedResourceId?: string; StartUtc?: string }> = [];

  // Batch requests if more than 1000 IDs (unlikely but handle it)
  for (let i = 0; i < reservationIds.length; i += 1000) {
    const batch = reservationIds.slice(i, Math.min(i + 1000, reservationIds.length));

    try {
      const response = await fetch(
        `${MEWS_API_URL}/api/connector/v1/reservations/getAll/2023-06-06`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ClientToken: MEWS_CLIENT_TOKEN,
            AccessToken: accessToken,
            Client: 'Free Trial Generator',
            ReservationIds: batch,
            Limitation: { Count: 1000 }
          })
        }
      );

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
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${MEWS_API_URL}/api/connector/v1/resources/update`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientToken: MEWS_CLIENT_TOKEN,
          AccessToken: accessToken,
          Client: 'Free Trial Generator',
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
      }
    );

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
  accessToken: string
): Promise<{ successCount: number; failureCount: number }> {
  console.log(`[RESOURCE_PREP] Preparing resources for ${reservations.length} reservations...`);

  if (reservations.length === 0) {
    console.warn('[RESOURCE_PREP] ⚠️ No reservations provided, skipping resource preparation');
    return { successCount: 0, failureCount: 0 };
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
    return { successCount: 0, failureCount: 0 };
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
      const result = await updateResourceStates(batch, accessToken);
      if (result.success) {
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

  // Don't throw - just log and continue
  if (failureCount > 0) {
    console.warn(`[RESOURCE_PREP] ⚠️ ${failureCount} resource(s) failed to update, but continuing...`);
  }

  return { successCount, failureCount };
}

/**
 * Apply state transitions sequentially per room to ensure proper ordering
 * Reservations in the same room are processed in chronological order
 */
async function applyStateTransitionsSequentially(
  reservations: Array<{ id: string; desiredState: string }>,
  reservationDetails: Array<{ Id: string; AssignedResourceId?: string; StartUtc?: string }>,
  accessToken: string
): Promise<void> {
  // Filter out invalid IDs
  const validReservations = reservations.filter(r => r.id && typeof r.id === 'string' && r.id.trim() !== '');

  const invalidCount = reservations.length - validReservations.length;
  if (invalidCount > 0) {
    console.warn(`[RESERVATIONS] ⚠️ Filtered out ${invalidCount} invalid reservation ID(s)`);
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

  console.log(`[RESERVATIONS] Applying state transitions across ${byRoom.size} rooms/categories...`);

  let successCount = 0;
  let failureCount = 0;

  // Process each room sequentially
  for (const [roomId, roomReservations] of Array.from(byRoom.entries())) {
    const roomName = roomId === 'unassigned' ? 'unassigned reservations' : `room ${roomId}`;
    console.log(`[RESERVATIONS] Processing ${roomReservations.length} reservations for ${roomName}...`);

    // Process reservations in this room one by one (sequential)
    for (let i = 0; i < roomReservations.length; i++) {
      const res = roomReservations[i];
      const prevRes = i > 0 ? roomReservations[i - 1] : null;

      try {
        // If previous reservation was processed (checked out), re-inspect the room before starting next
        if (prevRes && prevRes.desiredState === 'Processed' && res.assignedResourceId !== 'unassigned') {
          console.log(`[RESERVATIONS] Re-inspecting room ${res.assignedResourceId} after checkout before starting next reservation...`);
          const inspectResult = await updateResourceStates([res.assignedResourceId], accessToken);
          if (!inspectResult.success) {
            console.warn(`[RESERVATIONS] ⚠️ Failed to re-inspect room ${res.assignedResourceId}: ${inspectResult.error}`);
          }
        }

        if (res.desiredState === 'Started') {
          await callStateTransitionAPI('start', res.id, accessToken);
          successCount++;
        } else if (res.desiredState === 'Processed') {
          await callStateTransitionAPI('start', res.id, accessToken);
          await callStateTransitionAPI('process', res.id, accessToken);
          successCount++;
        }
        // Confirmed state doesn't need transitions
      } catch (error) {
        console.error(`[RESERVATIONS] ❌ Failed to transition reservation ${res.id} in ${roomName}:`, (error as Error).message);
        failureCount++;
      }
    }
  }

  console.log(`[RESERVATIONS] State transitions complete: ${successCount} succeeded, ${failureCount} failed`);

  // Don't throw error - log failures but continue
  if (failureCount > 0) {
    console.warn(`[RESERVATIONS] ⚠️ ${failureCount} state transition(s) failed, but continuing...`);
  }
}

/**
 * Call state transition API with detailed logging
 * Note: Both start and process APIs accept only a single reservation ID at a time
 */
async function callStateTransitionAPI(
  action: 'start' | 'process',
  reservationId: string,
  accessToken: string
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
  }

  console.log(`[RESERVATIONS] 📤 Calling ${action} API for reservation ${reservationId}`);
  console.log(`[RESERVATIONS] URL: ${url}`);
  console.log(`[RESERVATIONS] Payload:`, JSON.stringify(payload, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log(`[RESERVATIONS] 📥 Response Status: ${response.status} ${response.statusText}`);

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

    console.error(`[RESERVATIONS] ❌ ${action} transition FAILED`);
    console.error(`[RESERVATIONS] HTTP Status: ${response.status} ${response.statusText}`);
    console.error(`[RESERVATIONS] Reservation ID: ${reservationId}`);
    console.error(`[RESERVATIONS] Error Response:`, errorDetails);

    throw new Error(`Failed to ${action} reservation: ${response.status} - ${errorText}`);
  }

  // Log success response
  const responseText = await response.text();
  let responseData = responseText;
  try {
    const responseJson = JSON.parse(responseText);
    responseData = JSON.stringify(responseJson, null, 2);
  } catch {
    // Keep as plain text if not JSON
  }

  console.log(`[RESERVATIONS] ✅ Successfully ${action === 'start' ? 'started' : 'processed'} reservation ${reservationId}`);
  console.log(`[RESERVATIONS] Response Data:`, responseData);
}
