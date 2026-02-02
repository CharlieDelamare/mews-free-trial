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

    // Step 2: Fetch rates, resource categories, and age categories in parallel
    const [rates, resourceCategories, ageCategories] = await Promise.all([
      fetchRates(clientToken, accessToken, serviceId),
      fetchResourceCategories(clientToken, accessToken, serviceId),
      fetchAgeCategories(clientToken, accessToken, serviceId)
    ]);

    // Map rates by hardcoded names
    const rateMap = mapRatesByName(rates);

    // Fetch vouchers and voucher codes (sequential)
    const vouchers = await fetchVouchers(clientToken, accessToken, serviceId);
    const activeVouchers = vouchers.filter((v: MewsVoucher) => v.IsActive);

    let vouchersByRate = new Map<string, string>();
    if (activeVouchers.length > 0) {
      const voucherIds = activeVouchers.map((v: MewsVoucher) => v.Id);
      const voucherCodes = await fetchVoucherCodes(clientToken, accessToken, voucherIds);
      vouchersByRate = mapVoucherCodesToRates(activeVouchers, voucherCodes);
    }

    // Step 4: Map resource categories
    const resourceCategoryList = resourceCategories.map((rc: MewsResourceCategory) => ({
      id: rc.Id,
      name: rc.Name,
      type: rc.Type
    }));

    // Step 5: Find adult and child age categories
    const adultCategory = ageCategories.find((ac: MewsAgeCategory) => ac.Classification === 'Adult');
    const childCategory = ageCategories.find((ac: MewsAgeCategory) => ac.Classification === 'Child');

    if (!adultCategory) {
      throw new Error('No adult age category found');
    }

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
 * Fetch vouchers from Mews API
 */
async function fetchVouchers(clientToken: string, accessToken: string, serviceId: string): Promise<MewsVoucher[]> {
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

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[MEWS-DATA] Vouchers fetch failed: ${response.status} - ${errorText}`);
    // Don't throw - continue without vouchers
    return [];
  }

  const data = await response.json();
  return data.Vouchers || [];
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
      VoucherIds: voucherIds
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
 * Map voucher codes to rates
 */
function mapVoucherCodesToRates(vouchers: MewsVoucher[], voucherCodes: MewsVoucherCode[]): Map<string, string> {
  const rateToCodeMap = new Map<string, string>();

  // Filter active voucher codes only
  const activeVoucherCodes = voucherCodes.filter((vc: MewsVoucherCode) => vc.IsActive);

  // For each active voucher code, map its rates to the code value
  for (const voucherCode of activeVoucherCodes) {
    // Find the parent voucher
    const parentVoucher = vouchers.find((v: MewsVoucher) => v.Id === voucherCode.VoucherId);

    if (!parentVoucher) {
      console.warn(`[MEWS-DATA] ⚠️  Voucher code ${voucherCode.Id} has no parent voucher`);
      continue;
    }

    if (!parentVoucher.AssignedRateIds || parentVoucher.AssignedRateIds.length === 0) {
      console.warn(`[MEWS-DATA] ⚠️  Voucher ${parentVoucher.Name} has no assigned rates`);
      continue;
    }

    // Map each assigned rate to this voucher code (use first code found for each rate)
    for (const rateId of parentVoucher.AssignedRateIds) {
      if (!rateToCodeMap.has(rateId)) {
        rateToCodeMap.set(rateId, voucherCode.Value);
      }
    }
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
