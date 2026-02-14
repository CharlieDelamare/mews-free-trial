/**
 * Mews Data Fetching Service
 *
 * Fetches services, rates, resource categories, and age categories from Mews API.
 * Data is held in memory only (no database storage).
 */

import { fromZonedTime } from 'date-fns-tz';
import { loggedFetch } from './api-call-logger';

const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews.com';

export interface MewsData {
  serviceId: string;
  rates: Array<{
    id: string;
    name: string;
    isPublic: boolean;
  }>;
  resourceCategories: Array<{
    id: string;
    name: string;
    type: string; // "Room", "Apartment", "Bed", "Dorm"
    resourceCount: number; // Number of resources in this category
  }>;
  ageCategories: {
    adult: string;  // Adult age category ID
    child?: string; // Child age category ID (if exists)
  };
  vouchersByRate: Map<string, string>; // Maps rateId -> voucher code string
}

interface MewsService {
  Id: string;
  Name: string;
  Data: {
    Discriminator: 'Bookable' | 'Additional';
    Value?: {
      StartOffset?: string; // ISO 8601 duration (e.g., "PT14H")
      EndOffset?: string;   // ISO 8601 duration
      TimeUnitPeriod?: string; // e.g., "Day", "Month"
    };
  };
}

interface MewsRate {
  Id: string;
  Name: string;
  Type: string;
  IsPublic: boolean;
  IsActive: boolean;
  IsEnabled: boolean;
}

interface MewsResourceCategory {
  Id: string;
  Names: Record<string, string>; // Localized names object (e.g., { "en-US": "Standard Room" })
  Type: string;
}

interface MewsAgeCategory {
  Id: string;
  Name: string;
  Classification: string;
}

interface MewsVoucher {
  Id: string;
  Name: string;
  IsActive: boolean;
  AssignedRateIds: string[];
}

interface MewsVoucherCode {
  Id: string;
  VoucherId: string;
  Value: string;
  IsActive: boolean;
}

interface MewsVoucherAssignment {
  VoucherId: string;
  RateId: string;
  UpdatedUtc: string;
}

interface MewsResourceCategoryAssignment {
  Id: string;
  ResourceId: string;
  CategoryId: string;
  IsActive: boolean;
  CreatedUtc: string;
  UpdatedUtc: string;
}

interface VouchersGetAllResponse {
  Vouchers: MewsVoucher[] | null;
  VoucherAssignments: MewsVoucherAssignment[] | null;
  VoucherCodes: MewsVoucherCode[] | null;
}

/**
 * Extract a name from a localized Names object
 * Prefers English variants, falls back to first available
 */
function extractName(names: Record<string, string> | undefined): string {
  if (!names || typeof names !== 'object') {
    return 'Unknown';
  }

  // Try common English locale keys first
  const englishKeys = ['en-US', 'en-GB', 'en'];
  for (const key of englishKeys) {
    if (names[key]) {
      return names[key];
    }
  }

  // Fall back to first available name
  const values = Object.values(names);
  return values.length > 0 ? values[0] : 'Unknown';
}

/**
 * Fetch all required Mews data for reservation creation (first bookable service only)
 */
export async function fetchMewsData(
  clientToken: string,
  accessToken: string,
  options?: { logId?: string }
): Promise<MewsData> {
  try {
    const services = await fetchServices(clientToken, accessToken, options?.logId);
    const bookableService = services.find((s: MewsService) => s.Data.Discriminator === 'Bookable');

    if (!bookableService) {
      throw new Error('No bookable service found');
    }

    return await fetchMewsDataForService(clientToken, accessToken, bookableService.Id, options?.logId);
  } catch (error) {
    console.error('[MEWS-DATA] ❌ Failed to fetch Mews data:', error);
    throw new Error(`Mews data fetch failed: ${(error as Error).message}`);
  }
}

/**
 * Fetch Mews data for ALL bookable services in an enterprise.
 * Returns an array of MewsData, one per bookable service.
 */
export async function fetchAllMewsData(
  clientToken: string,
  accessToken: string,
  options?: { logId?: string }
): Promise<MewsData[]> {
  try {
    const services = await fetchServices(clientToken, accessToken, options?.logId);
    const bookableServices = services.filter((s: MewsService) => s.Data.Discriminator === 'Bookable');

    if (bookableServices.length === 0) {
      throw new Error('No bookable services found');
    }

    console.log(`[MEWS-DATA] Found ${bookableServices.length} bookable service(s)`);
    bookableServices.forEach((s, i) => {
      console.log(`[MEWS-DATA]   Service ${i + 1}: ${s.Name} (${s.Id})`);
    });

    const results = await Promise.all(
      bookableServices.map(s => fetchMewsDataForService(clientToken, accessToken, s.Id, options?.logId))
    );

    console.log(`[MEWS-DATA] ✅ Fetched data for ${results.length} bookable service(s)`);
    return results;
  } catch (error) {
    console.error('[MEWS-DATA] ❌ Failed to fetch all Mews data:', error);
    throw new Error(`Mews data fetch (all services) failed: ${(error as Error).message}`);
  }
}

/**
 * Fetch rates, resource categories, age categories, and vouchers for a single service
 */
async function fetchMewsDataForService(
  clientToken: string,
  accessToken: string,
  serviceId: string,
  logId?: string
): Promise<MewsData> {
  // Fetch rates, resource categories, and age categories in parallel
  const [rates, resourceCategories, ageCategories] = await Promise.all([
    fetchRates(clientToken, accessToken, serviceId, logId),
    fetchResourceCategories(clientToken, accessToken, serviceId, logId),
    fetchAgeCategories(clientToken, accessToken, serviceId, logId)
  ]);

  // Fetch resource category assignments (needs category IDs from previous step)
  const categoryIds = resourceCategories.map((rc: MewsResourceCategory) => rc.Id);
  const assignments = await fetchResourceCategoryAssignments(clientToken, accessToken, categoryIds, logId);

  // Map rates (all active/enabled rates, no name requirements)
  const rateMap = mapRates(rates);

  // Fetch voucher assignments and voucher codes
  console.log(`[MEWS-DATA] Fetching voucher assignments for service ${serviceId}...`);
  const voucherAssignments = await fetchVoucherAssignments(clientToken, accessToken, serviceId, logId);
  console.log(`[MEWS-DATA] Found ${voucherAssignments.length} voucher assignments`);

  let vouchersByRate = new Map<string, string>();
  if (voucherAssignments.length > 0) {
    const voucherIds = Array.from(
      new Set(voucherAssignments.map((assignment: MewsVoucherAssignment) => assignment.VoucherId))
    );
    console.log(`[MEWS-DATA] Found ${voucherIds.length} unique voucher(s) with rate assignments`);

    const voucherCodes = await fetchVoucherCodes(clientToken, accessToken, voucherIds, logId);
    console.log(`[MEWS-DATA] Found ${voucherCodes.length} voucher codes`);

    vouchersByRate = mapVoucherCodesToRates(voucherAssignments, voucherCodes);
    console.log(`[MEWS-DATA] Mapped ${vouchersByRate.size} rate(s) to voucher codes`);
  } else {
    console.log('[MEWS-DATA] No voucher assignments found, proceeding without voucher codes');
  }

  // Count resources per category using assignments
  console.log('[MEWS-DATA] Counting resources per category from assignments...');
  console.log(`[MEWS-DATA] Total assignments: ${assignments.length}`);

  const activeAssignments = assignments.filter((a: MewsResourceCategoryAssignment) => a.IsActive);
  console.log(`[MEWS-DATA] Active assignments: ${activeAssignments.length}`);

  const resourceCountsPerCategory = new Map<string, number>();
  for (const assignment of activeAssignments) {
    const count = resourceCountsPerCategory.get(assignment.CategoryId) || 0;
    resourceCountsPerCategory.set(assignment.CategoryId, count + 1);
  }

  console.log('[MEWS-DATA] Resource counts map:', Object.fromEntries(resourceCountsPerCategory));

  // Map resource categories with resource counts
  console.log('[MEWS-DATA] Mapping resource categories...');
  console.log('[MEWS-DATA] Input categories:', resourceCategories.map((rc: any) => ({
    Id: rc.Id,
    Names: rc.Names,
    Type: rc.Type,
    allFields: Object.keys(rc)
  })));

  const resourceCategoryList = resourceCategories.map((rc: MewsResourceCategory) => ({
    id: rc.Id,
    name: extractName(rc.Names),
    type: rc.Type,
    resourceCount: resourceCountsPerCategory.get(rc.Id) || 0
  }));

  console.log('[MEWS-DATA] Resource counts per category:');
  resourceCategoryList.forEach(rc => {
    console.log(`[MEWS-DATA]   - ${rc.name} (${rc.type}): ${rc.resourceCount} resources`);
  });

  // Find adult and child age categories
  const adultCategory = ageCategories.find((ac: MewsAgeCategory) => ac.Classification === 'Adult');
  const childCategory = ageCategories.find((ac: MewsAgeCategory) => ac.Classification === 'Child');

  if (!adultCategory) {
    throw new Error('No adult age category found');
  }

  console.log('[MEWS-DATA] ✅ Mews data fetch complete');
  console.log(`[MEWS-DATA] - Service: ${serviceId}`);
  console.log(`[MEWS-DATA] - Rates: ${rateMap.length}`);
  console.log(`[MEWS-DATA] - Resource categories: ${resourceCategoryList.length}`);
  console.log(`[MEWS-DATA] - Total resource assignments: ${activeAssignments.length}`);
  console.log(`[MEWS-DATA] - Age categories: Adult=${adultCategory.Id}, Child=${childCategory?.Id || 'N/A'}`);
  console.log(`[MEWS-DATA] - Voucher mappings: ${vouchersByRate.size} rate(s) with voucher codes`);
  console.log('[MEWS-DATA] ✅ Fetch complete:', {
    serviceId,
    rates: rateMap.length,
    resourceCategories: resourceCategoryList.length,
    voucherMappings: vouchersByRate.size
  });

  return {
    serviceId,
    rates: rateMap,
    resourceCategories: resourceCategoryList,
    ageCategories: {
      adult: adultCategory.Id,
      child: childCategory?.Id
    },
    vouchersByRate
  };
}

/**
 * Fetch services from Mews API
 */
async function fetchServices(clientToken: string, accessToken: string, logId?: string): Promise<MewsService[]> {
  const url = `${MEWS_API_URL}/api/connector/v1/services/getAll`;
  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: clientToken,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      ServiceType: 'Bookable' // Filter for bookable services only
    })
  };

  const response = logId
    ? await loggedFetch(url, fetchOptions, { unifiedLogId: logId, group: 'setup' })
    : await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Services fetch failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.Services || [];
}

/**
 * Fetch rates from Mews API
 */
async function fetchRates(clientToken: string, accessToken: string, serviceId: string, logId?: string): Promise<MewsRate[]> {
  const url = `${MEWS_API_URL}/api/connector/v1/rates/getAll`;
  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: clientToken,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      ServiceIds: [serviceId]
    })
  };

  const response = logId
    ? await loggedFetch(url, fetchOptions, { unifiedLogId: logId, group: 'setup' })
    : await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Rates fetch failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.Rates || [];
}

/**
 * Fetch resource categories from Mews API
 */
async function fetchResourceCategories(
  clientToken: string,
  accessToken: string,
  serviceId: string,
  logId?: string
): Promise<MewsResourceCategory[]> {
  console.log('[MEWS-DATA] Fetching resource categories...');

  const url = `${MEWS_API_URL}/api/connector/v1/resourceCategories/getAll`;
  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: clientToken,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      ServiceIds: [serviceId]
    })
  };

  const response = logId
    ? await loggedFetch(url, fetchOptions, { unifiedLogId: logId, group: 'setup' })
    : await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resource categories fetch failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const categories = data.ResourceCategories || [];

  console.log('[MEWS-DATA] Raw resource categories response:');
  console.log('[MEWS-DATA] Categories count:', categories.length);
  if (categories.length > 0) {
    console.log('[MEWS-DATA] First category sample:', JSON.stringify(categories[0], null, 2));
    console.log('[MEWS-DATA] All category fields:', Object.keys(categories[0]));
    console.log('[MEWS-DATA] Names field structure:', JSON.stringify(categories[0].Names, null, 2));
  }

  return categories;
}

/**
 * Fetch age categories from Mews API
 */
async function fetchAgeCategories(
  clientToken: string,
  accessToken: string,
  serviceId: string,
  logId?: string
): Promise<MewsAgeCategory[]> {
  const url = `${MEWS_API_URL}/api/connector/v1/ageCategories/getAll`;
  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: clientToken,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      ServiceIds: [serviceId]
    })
  };

  const response = logId
    ? await loggedFetch(url, fetchOptions, { unifiedLogId: logId, group: 'setup' })
    : await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Age categories fetch failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.AgeCategories || [];
}

/**
 * Fetch resource category assignments from Mews API
 * This tells us how many resources are assigned to each category
 */
async function fetchResourceCategoryAssignments(
  clientToken: string,
  accessToken: string,
  resourceCategoryIds: string[],
  logId?: string
): Promise<MewsResourceCategoryAssignment[]> {
  console.log('[MEWS-DATA] Fetching resource category assignments...');
  console.log(`[MEWS-DATA] Requesting assignments for ${resourceCategoryIds.length} categories`);

  const url = `${MEWS_API_URL}/api/connector/v1/resourceCategoryAssignments/getAll`;
  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: clientToken,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      ResourceCategoryIds: resourceCategoryIds,
      Limitation: {
        Count: 1000
      }
    })
  };

  const response = logId
    ? await loggedFetch(url, fetchOptions, { unifiedLogId: logId, group: 'setup' })
    : await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resource category assignments fetch failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const assignments = data.ResourceCategoryAssignments || [];
  console.log(`[MEWS-DATA] Found ${assignments.length} resource category assignments`);

  if (assignments.length > 0) {
    console.log('[MEWS-DATA] First assignment sample:', JSON.stringify(assignments[0], null, 2));
  }

  return assignments;
}

/**
 * Map rates from API response, filtering to only active and enabled rates
 */
function mapRates(rates: MewsRate[]): MewsData['rates'] {
  // Filter to only active and enabled rates
  const activeRates = rates.filter((r: MewsRate) => r.IsActive && r.IsEnabled);

  if (activeRates.length === 0) {
    console.error(`[MEWS-DATA] No active/enabled rates found`);
    console.error(`[MEWS-DATA] All rates: ${rates.map((r: MewsRate) => `${r.Name} (Active=${r.IsActive}, Enabled=${r.IsEnabled})`).join(', ')}`);
    throw new Error('No active/enabled rates found from Mews API');
  }

  const mapped = activeRates.map((r: MewsRate) => ({
    id: r.Id,
    name: r.Name,
    isPublic: r.IsPublic
  }));

  // Log filtered out rates
  const inactiveCount = rates.length - activeRates.length;
  if (inactiveCount > 0) {
    console.log(`[MEWS-DATA] Filtered out ${inactiveCount} inactive/disabled rate(s)`);
  }

  console.log(`[MEWS-DATA] Mapped ${mapped.length} active rate(s):`);
  mapped.forEach(r => {
    console.log(`[MEWS-DATA]   - ${r.name} (${r.isPublic ? 'Public' : 'Private'}): ${r.id}`);
  });

  return mapped;
}

/**
 * Fetch voucher assignments from Mews API
 * Returns VoucherAssignments which directly map VoucherId to RateId
 */
async function fetchVoucherAssignments(clientToken: string, accessToken: string, serviceId: string, logId?: string): Promise<MewsVoucherAssignment[]> {
  const endpoint = `${MEWS_API_URL}/api/connector/v1/vouchers/getAll`;
  const payload = {
    ClientToken: clientToken,
    AccessToken: accessToken,
    Client: 'Free Trial Generator',
    ServiceIds: [serviceId],
    Extent: {
      VoucherAssignments: true
    }
  };

  console.log('[MEWS-DATA] Fetching voucher assignments...');
  console.log('[MEWS-DATA] Endpoint:', endpoint);
  console.log('[MEWS-DATA] Payload:', JSON.stringify({
    ...payload,
    ClientToken: '***REDACTED***',
    AccessToken: '***REDACTED***'
  }, null, 2));

  try {
    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };

    const response = logId
      ? await loggedFetch(endpoint, fetchOptions, { unifiedLogId: logId, group: 'setup' })
      : await fetch(endpoint, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[MEWS-DATA] Voucher assignments fetch failed: ${response.status} - ${errorText}`);
      return [];
    }

    const data: VouchersGetAllResponse = await response.json();

    // Log response structure for debugging
    console.log('[MEWS-DATA] Vouchers response structure:', {
      hasVouchers: data.Vouchers !== null,
      hasAssignments: data.VoucherAssignments !== null,
      assignmentsCount: data.VoucherAssignments?.length || 0
    });

    // Return VoucherAssignments (the new structure we need)
    return data.VoucherAssignments || [];

  } catch (error) {
    console.error('[MEWS-DATA] Error fetching voucher assignments:', error);
    return [];
  }
}

/**
 * Fetch voucher codes from Mews API
 */
async function fetchVoucherCodes(
  clientToken: string,
  accessToken: string,
  voucherIds: string[],
  logId?: string
): Promise<MewsVoucherCode[]> {
  const url = `${MEWS_API_URL}/api/connector/v1/voucherCodes/getAll`;
  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: clientToken,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      VoucherIds: voucherIds,
      Limitation: {
        Count: 1000
      }
    })
  };

  const response = logId
    ? await loggedFetch(url, fetchOptions, { unifiedLogId: logId, group: 'setup' })
    : await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[MEWS-DATA] Voucher codes fetch failed: ${response.status} - ${errorText}`);
    // Don't throw - continue without voucher codes
    return [];
  }

  const data = await response.json();
  return data.VoucherCodes || [];
}

/**
 * Map voucher codes to rates using VoucherAssignments
 * @param assignments - VoucherAssignment array mapping VoucherId to RateId
 * @param voucherCodes - VoucherCode array with code values
 * @returns Map of rateId -> voucherCode string
 */
function mapVoucherCodesToRates(assignments: MewsVoucherAssignment[], voucherCodes: MewsVoucherCode[]): Map<string, string> {
  const rateToCodeMap = new Map<string, string>();

  // Filter active voucher codes only
  const activeVoucherCodes = voucherCodes.filter((vc: MewsVoucherCode) => vc.IsActive);

  console.log(`[MEWS-DATA] Processing ${activeVoucherCodes.length} active voucher codes with ${assignments.length} assignments`);

  // For each active voucher code, find its rate assignments
  for (const voucherCode of activeVoucherCodes) {
    // Find all assignments for this voucher
    const voucherAssignments = assignments.filter(
      (assignment: MewsVoucherAssignment) => assignment.VoucherId === voucherCode.VoucherId
    );

    if (voucherAssignments.length === 0) {
      console.warn(`[MEWS-DATA] ⚠️  Voucher code ${voucherCode.Value} (ID: ${voucherCode.VoucherId}) has no rate assignments`);
      continue;
    }

    // Map each assigned rate to this voucher code
    // Note: If multiple codes exist for the same rate, first one wins
    for (const assignment of voucherAssignments) {
      if (!rateToCodeMap.has(assignment.RateId)) {
        rateToCodeMap.set(assignment.RateId, voucherCode.Value);
        console.log(`[MEWS-DATA] ✓ Mapped rate ${assignment.RateId} to voucher code: "${voucherCode.Value}"`);
      } else {
        console.log(`[MEWS-DATA] Rate ${assignment.RateId} already has voucher code "${rateToCodeMap.get(assignment.RateId)}", skipping "${voucherCode.Value}"`);
      }
    }
  }

  if (rateToCodeMap.size === 0) {
    console.log('[MEWS-DATA] No voucher code mappings created (no active codes with assignments)');
  }

  return rateToCodeMap;
}

/**
 * Parse ISO 8601 duration to hours and minutes
 * Format: P0M0DT15H0M0S -> { hours: 15, minutes: 0 }
 */
function parseISO8601Duration(duration: string): { hours: number; minutes: number } {
  // Parse "P0M0DT15H0M0S" → { hours: 15, minutes: 0 }
  const match = duration.match(/T(\d+)H(\d+)M/);
  if (!match) return { hours: 0, minutes: 0 };

  return {
    hours: parseInt(match[1], 10),
    minutes: parseInt(match[2], 10)
  };
}

/**
 * Update the "Best Price" rate price to 90 for all resource categories
 * Uses midnight in the property's local timezone, converted to UTC
 */
export async function updateBestPriceRate(
  clientToken: string,
  accessToken: string,
  bestPriceRateId: string,
  timezone: string,
  logId?: string
): Promise<boolean> {
  const endpoint = `${MEWS_API_URL}/api/connector/v1/rates/updatePrice`;

  // Calculate date range: today to 100 days from now
  // Use midnight in property's local timezone, converted to UTC
  const todayUtc = new Date();
  const year = todayUtc.getUTCFullYear();
  const month = String(todayUtc.getUTCMonth() + 1).padStart(2, '0');
  const day = String(todayUtc.getUTCDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Create end date (100 days from now)
  const endDateUtc = new Date(todayUtc);
  endDateUtc.setUTCDate(endDateUtc.getUTCDate() + 100);
  const endYear = endDateUtc.getUTCFullYear();
  const endMonth = String(endDateUtc.getUTCMonth() + 1).padStart(2, '0');
  const endDay = String(endDateUtc.getUTCDate()).padStart(2, '0');
  const endDateStr = `${endYear}-${endMonth}-${endDay}`;

  // Create midnight times in property's local timezone, then convert to UTC
  // fromZonedTime interprets the date string as being in the specified timezone
  const firstTimeUnitUtc = fromZonedTime(`${todayStr} 00:00:00`, timezone).toISOString();
  const lastTimeUnitUtc = fromZonedTime(`${endDateStr} 00:00:00`, timezone).toISOString();

  console.log('[RATE-UPDATE] ========== Rate Update Request Details ==========');
  console.log('[RATE-UPDATE] Property timezone:', timezone);
  console.log('[RATE-UPDATE] Today (local date string):', todayStr);
  console.log('[RATE-UPDATE] End date (local date string):', endDateStr);
  console.log('[RATE-UPDATE] First time unit (UTC ISO):', firstTimeUnitUtc);
  console.log('[RATE-UPDATE] Last time unit (UTC ISO):', lastTimeUnitUtc);
  console.log('[RATE-UPDATE] Rate ID:', bestPriceRateId);

  const payload = {
    ClientToken: clientToken,
    AccessToken: accessToken,
    Client: 'Free Trial Generator',
    RateId: bestPriceRateId,
    PriceUpdates: [
      {
        FirstTimeUnitStartUtc: firstTimeUnitUtc,
        LastTimeUnitStartUtc: lastTimeUnitUtc,
        Value: 90
      }
    ]
  };

  console.log('[RATE-UPDATE] ========== Sending Request ==========');
  console.log('[RATE-UPDATE] Endpoint:', endpoint);
  console.log('[RATE-UPDATE] Full payload:', JSON.stringify({
    ...payload,
    ClientToken: '***REDACTED***',
    AccessToken: '***REDACTED***'
  }, null, 2));

  try {
    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };

    const response = logId
      ? await loggedFetch(endpoint, fetchOptions, { unifiedLogId: logId, group: 'setup' })
      : await fetch(endpoint, fetchOptions);

    console.log('[RATE-UPDATE] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[RATE-UPDATE] ❌ Rate price update failed');
      console.error('[RATE-UPDATE] HTTP Status:', response.status, response.statusText);
      console.error('[RATE-UPDATE] Error response:', errorText);

      // Try to parse error as JSON for better logging
      try {
        const errorJson = JSON.parse(errorText);
        console.error('[RATE-UPDATE] Error details:', JSON.stringify(errorJson, null, 2));
      } catch {
        // Not JSON, already logged as text
      }

      return false;
    }

    const responseData = await response.json();
    console.log('[RATE-UPDATE] ✅ Best Price rate updated successfully');
    console.log('[RATE-UPDATE] Response data:', JSON.stringify(responseData, null, 2));
    return true;
  } catch (error) {
    console.error('[RATE-UPDATE] ❌ Rate price update error:', error);
    console.error('[RATE-UPDATE] Error message:', (error as Error).message);
    console.error('[RATE-UPDATE] Error stack:', (error as Error).stack);
    return false;
  }
}
