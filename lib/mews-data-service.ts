/**
 * Mews Data Fetching Service
 *
 * Fetches services, rates, resource categories, and age categories from Mews API.
 * Data is held in memory only (no database storage).
 */

const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews.com';

export interface MewsData {
  serviceId: string;
  rates: {
    nonRefundable: string;
    bestPrice: string;
    fullyFlexible: string;
    corporateDeals: string;
    otaDeals: string;
  };
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
    Value?: any;
  };
}

interface MewsRate {
  Id: string;
  Name: string;
  Type: string;
}

interface MewsResourceCategory {
  Id: string;
  Name: string;
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

interface MewsResource {
  Id: string;
  Name: string;
  CategoryId: string;
  State: string;
}

interface VouchersGetAllResponse {
  Vouchers: MewsVoucher[] | null;
  VoucherAssignments: MewsVoucherAssignment[] | null;
  VoucherCodes: MewsVoucherCode[] | null;
}

/**
 * Fetch all required Mews data for reservation creation
 */
export async function fetchMewsData(
  clientToken: string,
  accessToken: string
): Promise<MewsData> {
  try {
    // Fetch services (already filtered by ServiceType: 'Bookable')
    const services = await fetchServices(clientToken, accessToken);
    const bookableService = services.find((s: MewsService) => s.Data.Discriminator === 'Bookable');

    if (!bookableService) {
      throw new Error('No bookable service found');
    }

    const serviceId = bookableService.Id;

    // Step 2: Fetch rates, resource categories, age categories, and resources in parallel
    const [rates, resourceCategories, ageCategories, resources] = await Promise.all([
      fetchRates(clientToken, accessToken, serviceId),
      fetchResourceCategories(clientToken, accessToken, serviceId),
      fetchAgeCategories(clientToken, accessToken, serviceId),
      fetchResources(clientToken, accessToken, serviceId)
    ]);

    // Map rates by hardcoded names
    const rateMap = mapRatesByName(rates);

    // Fetch voucher assignments and voucher codes
    console.log('[MEWS-DATA] Fetching voucher assignments and voucher codes...');
    const voucherAssignments = await fetchVoucherAssignments(clientToken, accessToken, serviceId);
    console.log(`[MEWS-DATA] Found ${voucherAssignments.length} voucher assignments`);

    let vouchersByRate = new Map<string, string>();
    if (voucherAssignments.length > 0) {
      // Extract unique voucher IDs from assignments
      const voucherIds = Array.from(
        new Set(voucherAssignments.map((assignment: MewsVoucherAssignment) => assignment.VoucherId))
      );
      console.log(`[MEWS-DATA] Found ${voucherIds.length} unique voucher(s) with rate assignments`);

      // Fetch voucher codes for these vouchers
      const voucherCodes = await fetchVoucherCodes(clientToken, accessToken, voucherIds);
      console.log(`[MEWS-DATA] Found ${voucherCodes.length} voucher codes`);

      // Map voucher codes to rates using assignments
      vouchersByRate = mapVoucherCodesToRates(voucherAssignments, voucherCodes);
      console.log(`[MEWS-DATA] Mapped ${vouchersByRate.size} rate(s) to voucher codes`);
    } else {
      console.log('[MEWS-DATA] No voucher assignments found, proceeding without voucher codes');
    }

    // Step 4: Count resources per category
    const resourceCountsPerCategory = new Map<string, number>();
    for (const resource of resources) {
      const count = resourceCountsPerCategory.get(resource.CategoryId) || 0;
      resourceCountsPerCategory.set(resource.CategoryId, count + 1);
    }

    // Step 5: Map resource categories with resource counts
    const resourceCategoryList = resourceCategories.map((rc: MewsResourceCategory) => ({
      id: rc.Id,
      name: rc.Name,
      type: rc.Type,
      resourceCount: resourceCountsPerCategory.get(rc.Id) || 0
    }));

    console.log('[MEWS-DATA] Resource counts per category:');
    resourceCategoryList.forEach(rc => {
      console.log(`[MEWS-DATA]   - ${rc.name} (${rc.type}): ${rc.resourceCount} resources`);
    });

    // Step 6: Find adult and child age categories
    const adultCategory = ageCategories.find((ac: MewsAgeCategory) => ac.Classification === 'Adult');
    const childCategory = ageCategories.find((ac: MewsAgeCategory) => ac.Classification === 'Child');

    if (!adultCategory) {
      throw new Error('No adult age category found');
    }

    console.log('[MEWS-DATA] ✅ Mews data fetch complete');
    console.log(`[MEWS-DATA] - Service: ${serviceId}`);
    console.log(`[MEWS-DATA] - Rates: ${Object.keys(rateMap).length}`);
    console.log(`[MEWS-DATA] - Resource categories: ${resourceCategoryList.length}`);
    console.log(`[MEWS-DATA] - Total resources: ${resources.length}`);
    console.log(`[MEWS-DATA] - Age categories: Adult=${adultCategory.Id}, Child=${childCategory?.Id || 'N/A'}`);
    console.log(`[MEWS-DATA] - Voucher mappings: ${vouchersByRate.size} rate(s) with voucher codes`);
    console.log('[MEWS-DATA] ✅ Fetch complete:', {
      serviceId,
      rates: Object.keys(rateMap).length,
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

  } catch (error) {
    console.error('[MEWS-DATA] ❌ Failed to fetch Mews data:', error);
    throw new Error(`Mews data fetch failed: ${(error as Error).message}`);
  }
}

/**
 * Fetch services from Mews API
 */
async function fetchServices(clientToken: string, accessToken: string): Promise<MewsService[]> {
  const response = await fetch(`${MEWS_API_URL}/api/connector/v1/services/getAll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: clientToken,
      AccessToken: accessToken,
      Client: 'Free Trial Generator',
      ServiceType: 'Bookable' // Filter for bookable services only
    })
  });

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
async function fetchRates(clientToken: string, accessToken: string, serviceId: string): Promise<MewsRate[]> {
  const response = await fetch(`${MEWS_API_URL}/api/connector/v1/rates/getAll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: clientToken,
      AccessToken: accessToken,
      Client: 'Free Trial Generator',
      ServiceIds: [serviceId]
    })
  });

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
  serviceId: string
): Promise<MewsResourceCategory[]> {
  const response = await fetch(`${MEWS_API_URL}/api/connector/v1/resourceCategories/getAll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: clientToken,
      AccessToken: accessToken,
      Client: 'Free Trial Generator',
      ServiceIds: [serviceId]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resource categories fetch failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.ResourceCategories || [];
}

/**
 * Fetch age categories from Mews API
 */
async function fetchAgeCategories(
  clientToken: string,
  accessToken: string,
  serviceId: string
): Promise<MewsAgeCategory[]> {
  const response = await fetch(`${MEWS_API_URL}/api/connector/v1/ageCategories/getAll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: clientToken,
      AccessToken: accessToken,
      Client: 'Free Trial Generator',
      ServiceIds: [serviceId]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Age categories fetch failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.AgeCategories || [];
}

/**
 * Fetch resources from Mews API
 */
async function fetchResources(
  clientToken: string,
  accessToken: string,
  serviceId: string
): Promise<MewsResource[]> {
  console.log('[MEWS-DATA] Fetching resources...');

  const response = await fetch(`${MEWS_API_URL}/api/connector/v1/resources/getAll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: clientToken,
      AccessToken: accessToken,
      Client: 'Free Trial Generator',
      ServiceIds: [serviceId]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resources fetch failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`[MEWS-DATA] Found ${data.Resources?.length || 0} resources`);

  return data.Resources || [];
}

/**
 * Map rates by hardcoded names
 */
function mapRatesByName(rates: MewsRate[]): MewsData['rates'] {
  const rateNames = {
    nonRefundable: 'Non refundable',
    bestPrice: 'Best Price',
    fullyFlexible: 'Fully Flexible',
    corporateDeals: 'Corporate deals',
    otaDeals: 'OTA deals'
  };

  const rateMap: any = {};

  for (const [key, name] of Object.entries(rateNames)) {
    const rate = rates.find((r: MewsRate) => r.Name === name);
    if (rate) {
      rateMap[key] = rate.Id;
    } else {
      console.warn(`[MEWS-DATA] Rate "${name}" not found`);
    }
  }

  // Verify all required rates were found
  if (Object.keys(rateMap).length < 5) {
    const missing = Object.entries(rateNames)
      .filter(([key]) => !rateMap[key])
      .map(([, name]) => name);
    console.error(`[MEWS-DATA] Missing rates: ${missing.join(', ')}`);
    console.error(`[MEWS-DATA] Available rates: ${rates.map((r: MewsRate) => r.Name).join(', ')}`);
    throw new Error(`Missing required rates: ${missing.join(', ')}`);
  }

  return rateMap as MewsData['rates'];
}

/**
 * Fetch voucher assignments from Mews API
 * Returns VoucherAssignments which directly map VoucherId to RateId
 */
async function fetchVoucherAssignments(clientToken: string, accessToken: string, serviceId: string): Promise<MewsVoucherAssignment[]> {
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

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  console.log('[MEWS-DATA] Fetching voucher assignments...');
  console.log('[MEWS-DATA] Endpoint:', endpoint);
  console.log('[MEWS-DATA] Payload:', JSON.stringify({
    ...payload,
    ClientToken: '***REDACTED***',
    AccessToken: '***REDACTED***'
  }, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

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
  voucherIds: string[]
): Promise<MewsVoucherCode[]> {
  const response = await fetch(`${MEWS_API_URL}/api/connector/v1/voucherCodes/getAll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: clientToken,
      AccessToken: accessToken,
      Client: 'Free Trial Generator',
      VoucherIds: voucherIds,
      Limitation: {
        Count: 1000
      }
    })
  });

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
 * Update the "Best Price" rate price to 90 for all resource categories
 */
export async function updateBestPriceRate(
  clientToken: string,
  accessToken: string,
  bestPriceRateId: string
): Promise<boolean> {
  const endpoint = `${MEWS_API_URL}/api/connector/v1/rates/updatePrice`;

  const payload = {
    ClientToken: clientToken,
    AccessToken: accessToken,
    RateId: bestPriceRateId,
    PriceUpdates: [
      {
        Value: 90
      }
    ]
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[MEWS-DATA] Rate price update failed: ${response.status} - ${errorText}`);
      return false;
    }

    console.log('[MEWS-DATA] ✓ Best Price rate updated to 90');
    return true;
  } catch (error) {
    console.error('[MEWS-DATA] Rate price update error:', error);
    return false;
  }
}
