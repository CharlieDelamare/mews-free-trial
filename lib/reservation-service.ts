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
    // Step 1: Fetch environment data
    const envData = await fetchEnvironmentData(enterpriseId);
    console.log(`[RESERVATIONS] Environment: ${envData.propertyType}, Duration: ${envData.durationDays} days`);

    // Step 2: Fetch Mews data
    const mewsData = await fetchMewsData(MEWS_CLIENT_TOKEN, accessToken);

    // Step 3: Filter resource categories by property type
    const filteredCategories = filterResourceCategories(mewsData.resourceCategories, envData.propertyType);
    console.log(`[RESERVATIONS] Filtered resource categories: ${filteredCategories.length}`);

    if (filteredCategories.length === 0) {
      throw new Error(`No resource categories found for property type: ${envData.propertyType}`);
    }

    // Step 4: Calculate bookable units
    const bookableUnits = calculateBookableUnits(envData);
    console.log(`[RESERVATIONS] Bookable units: ${bookableUnits}`);

    // Step 5: Calculate total reservations needed
    const totalReservations = calculateTotalReservations(bookableUnits, envData.durationDays);
    console.log(`[RESERVATIONS] Target reservations: ${totalReservations}`);

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

    // Step 7: Generate reservation data
    const reservations = generateReservationData(
      totalReservations,
      customerIds,
      filteredCategories,
      mewsData.rates,
      envData,
      mewsData.ageCategories.adult
    );

    // Step 8: Group reservations for API calls
    const groups = groupReservationsForAPI(reservations);
    console.log(`[RESERVATIONS] Created ${groups.length} reservation groups`);

    // Step 9: Create reservations via API
    const { createdReservations, failures } = await createReservationGroups(
      groups,
      mewsData.serviceId,
      accessToken,
      mewsData.ageCategories.adult,
      mewsData.vouchersByRate
    );

    // Step 10: Apply state transitions
    await applyStateTransitions(createdReservations, accessToken);

    // Step 11: Log results
    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    console.log(`[RESERVATIONS] ✅ Complete in ${durationSeconds}s`);
    console.log(`[RESERVATIONS] Created: ${createdReservations.length}, Failed: ${failures.length}, Customers: ${customerIds.length}`);

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
 * Filter resource categories by property type
 */
function filterResourceCategories(
  categories: MewsData['resourceCategories'],
  propertyType: string
): MewsData['resourceCategories'] {
  const typeMap: Record<string, string> = {
    'hotel': 'Room',
    'apartments': 'Apartment',
    'hostel': 'Bed' // Note: NOT "Dorm" - beds are bookable units
  };

  const targetType = typeMap[propertyType];
  if (!targetType) {
    throw new Error(`Unknown property type: ${propertyType}`);
  }

  return categories.filter(c => c.type === targetType);
}

/**
 * Calculate bookable units based on property type
 */
function calculateBookableUnits(envData: EnvironmentData): number {
  switch (envData.propertyType) {
    case 'hotel':
      return envData.roomCount;
    case 'hostel':
      return envData.roomCount + (envData.dormCount * envData.bedCount);
    case 'apartments':
      return envData.apartmentCount;
    default:
      throw new Error(`Unknown property type: ${envData.propertyType}`);
  }
}

/**
 * Calculate total reservations for 80% occupancy
 */
function calculateTotalReservations(bookableUnits: number, durationDays: number): number {
  const totalDays = durationDays + 2; // Include 2 past days
  const totalRoomNights = bookableUnits * totalDays;
  const targetOccupiedNights = totalRoomNights * 0.8;
  const averageStayLength = 2.1; // From stay distribution: 50%*1 + 30%*2 + 15%*3 + 5%*4 = 1.75

  return Math.floor(targetOccupiedNights / averageStayLength);
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
  console.log(`[RESERVATIONS] Creating ${count} customers on-demand...`);

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
        } else {
          console.error(`[RESERVATIONS] Customer ${i + idx} failed:`, result.status === 'rejected' ? result.reason : 'Unknown');
        }
      });

      // Log progress
      if ((i + batch.length) % 50 === 0 || i + batch.length >= customers.length) {
        console.log(`[RESERVATIONS] Customer progress: ${Math.min(i + batch.length, customers.length)}/${customers.length}`);
      }
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

    console.log(`[RESERVATIONS] ✅ Created ${customerIds.length}/${count} customers`);
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
 * Generate reservation data in memory
 */
function generateReservationData(
  totalReservations: number,
  customerIds: string[],
  categories: MewsData['resourceCategories'],
  rates: MewsData['rates'],
  envData: EnvironmentData,
  adultAgeCategoryId: string
): ReservationData[] {
  console.log(`[RESERVATIONS] Generating ${totalReservations} reservation templates...`);

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

  for (let i = 0; i < totalReservations; i++) {
    // Assign customer
    const customerId = customerIds[i % customerIds.length];

    // Determine stay length based on distribution
    const stayLength = getStayLength(i, totalReservations);

    // Spread check-in dates across time window
    const dayOffset = -2 + (i % totalDays);
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

    // Assign resource category (rotate evenly)
    const resourceCategoryId = categories[i % categories.length].id;

    // Assign rate based on distribution
    const rateId = getRateIdByDistribution(i, totalReservations, rates, rateDistribution);

    // Determine desired state
    const desiredState = determineReservationState(checkInDate, checkOutDate, today);

    reservations.push({
      customerId,
      resourceCategoryId,
      rateId,
      checkInUtc,
      checkOutUtc,
      adultCount: 2, // Default to 2 adults
      desiredState
    });
  }

  return reservations;
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
  console.log(`[RESERVATIONS] Creating ${groups.length} reservation groups...`);

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
              console.log(`[RESERVATIONS] Using voucher code "${voucherCode}" for rate ${r.rateId}`);
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
      const reservationIds = data.Reservations?.map((r: any) => r.Id) || [];

      // Identify reservations that need immediate start (check-in in the past)
      const needsImmediateStart: string[] = [];
      const now = new Date();

      // Store with desired states
      for (let j = 0; j < reservationIds.length; j++) {
        const reservation = group[j];

        // If check-in is in the past, start immediately
        if (reservation.checkInUtc < now) {
          needsImmediateStart.push(reservationIds[j]);
        }

        createdReservations.push({
          id: reservationIds[j],
          desiredState: group[j].desiredState
        });
      }

      // Start past-dated reservations immediately (fire-and-forget)
      if (needsImmediateStart.length > 0) {
        console.log(`[RESERVATIONS] Starting ${needsImmediateStart.length} past-dated reservation(s) immediately...`);
        callStateTransitionAPI('start', needsImmediateStart, accessToken).catch(err => {
          console.error('[RESERVATIONS] ⚠️  Failed to start past reservations (fire-and-forget)');
          console.error('[RESERVATIONS] Error details:', err.message);
          console.error('[RESERVATIONS] Affected reservation IDs:', needsImmediateStart.join(', '));
        });
      }

    } catch (error) {
      console.error(`[RESERVATIONS] Group ${i} failed:`, error);
      failures.push(...group.map(r => ({ ...r, error: (error as Error).message })));
    }

    // Log progress
    if ((i + 1) % 50 === 0 || i + 1 === groups.length) {
      console.log(`[RESERVATIONS] Progress: ${i + 1}/${groups.length} groups`);
    }
  }

  return { createdReservations, failures };
}

/**
 * Apply state transitions (Start and Process)
 */
async function applyStateTransitions(
  reservations: Array<{ id: string; desiredState: string }>,
  accessToken: string
): Promise<void> {
  const startedIds = reservations.filter(r => r.desiredState === 'Started').map(r => r.id);
  const processedIds = reservations.filter(r => r.desiredState === 'Processed').map(r => r.id);

  console.log(`[RESERVATIONS] Applying state transitions: ${startedIds.length} Started, ${processedIds.length} Processed`);

  try {
    // Start reservations
    if (startedIds.length > 0) {
      await callStateTransitionAPI('start', startedIds, accessToken);
    }

    // Process reservations (must start first, then process)
    if (processedIds.length > 0) {
      await callStateTransitionAPI('start', processedIds, accessToken);
      await callStateTransitionAPI('process', processedIds, accessToken);
    }

    console.log(`[RESERVATIONS] ✅ State transitions completed successfully`);
  } catch (error) {
    console.error(`[RESERVATIONS] ❌ State transition error:`, error);
    throw error; // Re-throw to be caught by caller
  }
}

/**
 * Call state transition API
 */
async function callStateTransitionAPI(
  action: 'start' | 'process',
  reservationIds: string[],
  accessToken: string
): Promise<void> {
  const endpoint = action === 'start' ? 'reservations/start' : 'reservations/process';

  console.log(`[RESERVATIONS] Calling ${action} API for ${reservationIds.length} reservation(s)`);

  const response = await fetch(`${MEWS_API_URL}/api/connector/v1/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: MEWS_CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Free Trial Generator',
      ReservationIds: reservationIds
    })
  });

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
    console.error(`[RESERVATIONS] Reservation IDs: ${reservationIds.join(', ')}`);
    console.error(`[RESERVATIONS] Error Response:`, errorDetails);

    throw new Error(`Failed to ${action} reservations: ${response.status} - ${errorText}`);
  }

  console.log(`[RESERVATIONS] ✅ Successfully ${action === 'start' ? 'started' : 'processed'} ${reservationIds.length} reservation(s)`);
}
