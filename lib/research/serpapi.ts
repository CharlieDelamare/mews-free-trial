import { fetchWithTimeout } from '@/lib/fetch-timeout';
import { inferSpaceType, inferProductCategory } from './inference';
import type {
  HotelCandidate,
  HotelResearchData,
  RoomType,
  Product,
} from '@/types/research';

const SERPAPI_BASE = 'https://serpapi.com/search';
const TIMEOUT_MS = 10_000;

/** Extract numeric star rating from strings like "5-star hotel" or "4-star hotel". */
function extractStarRating(hotelClass: string | null | undefined): number | null {
  if (!hotelClass) return null;
  const match = hotelClass.match(/(\d)/);
  return match ? parseInt(match[1], 10) : null;
}

export function normaliseSerpApiSearchResults(raw: {
  properties?: Array<{
    name: string;
    hotel_class?: string | null;
    address?: string;
    amenities?: string[];
    property_token?: string;
  }>;
}): HotelCandidate[] {
  return (raw.properties ?? []).map((p, i) => ({
    hotelId: p.property_token ?? `serpapi-${i}`,
    name: p.name,
    address: p.address ?? '',
    starRating: extractStarRating(p.hotel_class ?? null),
    country: null,
    source: 'serpapi' as const,
    propertyToken: p.property_token,
  }));
}

export function normaliseSerpApiHotel(
  raw: {
    name: string;
    description?: string | null;
    hotel_class?: string | null;
    address?: string | null;
    amenities?: string[];
    rooms?: Array<{
      name: string;
      description?: string | null;
      highlights?: Array<{ highlighted_text: string }>;
    }>;
  },
  propertyToken: string
): HotelResearchData {
  const roomTypes: RoomType[] = (raw.rooms ?? []).map(r => ({
    name: r.name,
    description: r.description ?? null,
    maxOccupancy: null,
    bedType: null,
    sizeSqm: null,
    amenities: (r.highlights ?? []).map(h => h.highlighted_text),
    spaceType: inferSpaceType(r.name),
  }));

  const productNames = (raw.amenities ?? []).filter(
    a => inferProductCategory(a) !== 'Other' || /parking/i.test(a)
  );
  const facilityNames = (raw.amenities ?? []).filter(
    a => !productNames.includes(a)
  );

  const products: Product[] = productNames.map(name => ({
    name,
    category: inferProductCategory(name),
  }));

  return {
    hotelName: raw.name,
    address: raw.address ?? '',
    starRating: extractStarRating(raw.hotel_class ?? null),
    source: 'serpapi',
    roomTypes,
    ratePlans: [],
    products,
    generalFacilities: facilityNames,
  };
}

export async function searchSerpApi(
  name: string,
  city: string
): Promise<HotelCandidate[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    engine: 'google_hotels',
    q: `${name} ${city}`,
    api_key: apiKey,
  });

  const response = await fetchWithTimeout(
    `${SERPAPI_BASE}?${params}`,
    {},
    TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`SerpApi search failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return normaliseSerpApiSearchResults(json);
}

export async function fetchSerpApiHotel(
  propertyToken: string
): Promise<HotelResearchData> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) throw new Error('SERPAPI_API_KEY environment variable is not set');

  const params = new URLSearchParams({
    engine: 'google_hotels',
    property_token: propertyToken,
    api_key: apiKey,
  });

  const response = await fetchWithTimeout(
    `${SERPAPI_BASE}?${params}`,
    {},
    TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`SerpApi property fetch failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return normaliseSerpApiHotel(json, propertyToken);
}
