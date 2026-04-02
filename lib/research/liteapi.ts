import { fetchWithTimeout } from '@/lib/fetch-timeout';
import { inferSpaceType, inferBoardType, inferProductCategory } from './inference';
import type {
  HotelCandidate,
  HotelResearchData,
  RoomType,
  RatePlan,
  Product,
} from '@/types/research';

const LITEAPI_BASE = 'https://api.liteapi.travel/v3.0';
const TIMEOUT_MS = 10_000;

function getApiKey(): string {
  const key = process.env.LITEAPI_API_KEY;
  if (!key) throw new Error('LITEAPI_API_KEY environment variable is not set');
  return key;
}

function buildAddress(addr: {
  line1?: string;
  city?: string;
  postalCode?: string;
} = {}): string {
  return [addr.line1, addr.city, addr.postalCode].filter(Boolean).join(', ');
}

export function normaliseLiteAPISearchResults(raw: {
  data: Array<{
    id: string;
    name: string;
    address?: { line1?: string; city?: string; postalCode?: string };
    starRating?: number | null;
    country?: string | null;
  }>;
}): HotelCandidate[] {
  return (raw.data ?? []).map(h => ({
    hotelId: h.id,
    name: h.name,
    address: buildAddress(h.address),
    starRating: h.starRating ?? null,
    country: h.country ?? null,
    source: 'liteapi' as const,
  }));
}

export function normaliseLiteAPIHotel(raw: {
  data: {
    id: string;
    name: string;
    hotelDescription?: string | null;
    address?: { line1?: string; city?: string; postalCode?: string };
    starRating?: number | null;
    roomTypes?: Array<{
      name: string;
      description?: string | null;
      maxOccupancy?: number | null;
      bedType?: string | null;
      roomSize?: string | null;
      amenities?: string[];
    }>;
    ratePlans?: Array<{
      name: string;
      boardBasis?: string | null;
      cancellationPolicy?: string | null;
      isRefundable?: boolean | null;
    }>;
    facilities?: string[];
    addons?: string[];
  };
}): HotelResearchData {
  const d = raw.data;

  const roomTypes: RoomType[] = (d.roomTypes ?? []).map(rt => ({
    name: rt.name,
    description: rt.description ?? null,
    maxOccupancy: rt.maxOccupancy ?? null,
    bedType: rt.bedType ?? null,
    sizeSqm: rt.roomSize ? parseFloat(rt.roomSize) || null : null,
    amenities: rt.amenities ?? [],
    spaceType: inferSpaceType(rt.name),
  }));

  const ratePlans: RatePlan[] = (d.ratePlans ?? []).map(rp => ({
    name: rp.name,
    boardType: inferBoardType(rp.boardBasis ?? rp.name),
    cancellationPolicy: rp.cancellationPolicy ?? null,
    isRefundable: rp.isRefundable ?? null,
  }));

  const products: Product[] = (d.addons ?? []).map(name => ({
    name,
    category: inferProductCategory(name),
  }));

  const generalFacilities: string[] = d.facilities ?? [];

  return {
    hotelName: d.name,
    address: buildAddress(d.address),
    starRating: d.starRating ?? null,
    source: 'liteapi',
    roomTypes,
    ratePlans,
    products,
    generalFacilities,
  };
}

export async function searchLiteAPI(
  name: string,
  city: string,
  countryCode?: string
): Promise<HotelCandidate[]> {
  const params = new URLSearchParams({
    hotelName: name,
    cityName: city,
    limit: '10',
  });
  if (countryCode) params.set('countryCode', countryCode);

  const response = await fetchWithTimeout(
    `${LITEAPI_BASE}/data/hotels?${params}`,
    { headers: { 'X-API-Key': getApiKey() } },
    TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`LiteAPI search failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return normaliseLiteAPISearchResults(json);
}

export async function fetchLiteAPIHotel(hotelId: string): Promise<HotelResearchData> {
  const response = await fetchWithTimeout(
    `${LITEAPI_BASE}/data/hotel?hotelId=${encodeURIComponent(hotelId)}`,
    { headers: { 'X-API-Key': getApiKey() } },
    TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`LiteAPI hotel fetch failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return normaliseLiteAPIHotel(json);
}
