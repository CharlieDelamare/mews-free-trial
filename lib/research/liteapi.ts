import { fetchWithTimeout } from '@/lib/fetch-timeout';
import { inferSpaceType } from './inference';
import type {
  HotelCandidate,
  HotelResearchData,
  RoomType,
} from '@/types/research';

const LITEAPI_BASE = 'https://api.liteapi.travel/v3.0';
const TIMEOUT_MS = 10_000;

function getApiKey(): string {
  const key = process.env.LITEAPI_API_KEY;
  if (!key) throw new Error('LITEAPI_API_KEY environment variable is not set');
  return key;
}

/** Build a display address from flat string fields. */
function buildAddress(address?: string | null, city?: string | null, zip?: string | null): string {
  return [address, city, zip].filter(Boolean).join(', ');
}

export function normaliseLiteAPISearchResults(raw: {
  data: Array<{
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    zip?: string | null;
    stars?: number | null;
    country?: string | null;
  }>;
}): HotelCandidate[] {
  return (raw.data ?? []).map(h => ({
    hotelId: h.id,
    name: h.name,
    address: buildAddress(h.address, h.city, h.zip),
    starRating: h.stars ?? null,
    country: h.country ? h.country.toUpperCase() : null,
    source: 'liteapi' as const,
  }));
}

export function normaliseLiteAPIHotel(raw: {
  data: {
    name: string;
    address?: string | null;
    city?: string | null;
    zip?: string | null;
    starRating?: number | null;
    rooms?: Array<{
      roomName: string;
      description?: string | null;
      maxOccupancy?: number | null;
      bedTypes?: Array<{ bedType: string }>;
      roomSizeSquare?: number | null;
      roomAmenities?: Array<{ name: string }>;
    }>;
    facilities?: Array<{ name: string }>;
  };
}): HotelResearchData {
  const d = raw.data;

  const roomTypes: RoomType[] = (d.rooms ?? []).map(r => ({
    name: r.roomName,
    description: r.description ?? null,
    maxOccupancy: r.maxOccupancy ?? null,
    bedType: r.bedTypes?.[0]?.bedType ?? null,
    sizeSqm: r.roomSizeSquare ?? null,
    amenities: (r.roomAmenities ?? []).map(a => a.name),
    spaceType: inferSpaceType(r.roomName),
  }));

  // LiteAPI /data/hotel exposes a single `facilities` list of hotel amenities
  // (Pool, Spa, Restaurant, etc.) — these are not individually bookable add-ons.
  // All facilities go to generalFacilities; products stays empty.
  const generalFacilities: string[] = (d.facilities ?? []).map(f => f.name);

  return {
    hotelName: d.name,
    address: buildAddress(d.address, d.city, d.zip),
    starRating: d.starRating ?? null,
    source: 'liteapi',
    roomTypes,
    ratePlans: [],
    products: [],
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
