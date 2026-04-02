import { fetchWithTimeout } from '@/lib/fetch-timeout';
import { inferSpaceType } from './inference';
import type {
  HotelCandidate,
  HotelResearchData,
  HotelImage,
  HotelPolicy,
  SentimentCategory,
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
    hotelDescription?: string | null;
    hotelImportantInformation?: string | null;
    main_photo?: string | null;
    hotelImages?: Array<{
      url: string;
      urlHd?: string | null;
      caption?: string | null;
      defaultImage?: boolean;
    }>;
    checkinCheckoutTimes?: {
      checkin_start?: string | null;
      checkin_end?: string | null;
      checkout?: string | null;
      instructions?: string[];
    } | null;
    hotelType?: string | null;
    chain?: string | null;
    airportCode?: string | null;
    phone?: string | null;
    email?: string | null;
    parking?: boolean | null;
    childAllowed?: boolean | null;
    petsAllowed?: boolean | null;
    rating?: number | null;
    reviewCount?: number | null;
    location?: { latitude?: number | null; longitude?: number | null } | null;
    policies?: Array<{
      policy_type?: string;
      name?: string;
      description?: string;
    }>;
    sentiment_analysis?: {
      pros?: string[];
      cons?: string[];
      categories?: Array<{ name: string; rating: number; description: string }>;
    } | null;
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

  const images: HotelImage[] = (d.hotelImages ?? []).map(img => ({
    url: img.url,
    urlHd: img.urlHd ?? null,
    caption: img.caption ?? null,
    isDefault: img.defaultImage ?? false,
  }));

  const policies: HotelPolicy[] = (d.policies ?? [])
    .filter(p => p.description)
    .map(p => ({
      type: p.policy_type ?? '',
      name: p.name ?? '',
      description: p.description ?? '',
    }));

  const sentimentCategories: SentimentCategory[] = (
    d.sentiment_analysis?.categories ?? []
  ).map(c => ({
    name: c.name,
    rating: c.rating,
    description: c.description,
  }));

  // Build check-in time string from start/end range
  const ct = d.checkinCheckoutTimes;
  let checkinTime: string | null = null;
  if (ct?.checkin_start && ct?.checkin_end) {
    checkinTime = `${ct.checkin_start} – ${ct.checkin_end}`;
  } else if (ct?.checkin_start) {
    checkinTime = `From ${ct.checkin_start}`;
  }

  // LiteAPI /data/hotel exposes a single `facilities` list of hotel amenities
  // (Pool, Spa, Restaurant, etc.) — these are not individually bookable add-ons.
  // All facilities go to generalFacilities; products stays empty.
  const generalFacilities: string[] = (d.facilities ?? []).map(f => f.name);

  return {
    hotelName: d.name,
    address: buildAddress(d.address, d.city, d.zip),
    starRating: d.starRating ?? null,
    source: 'liteapi',

    description: d.hotelDescription ?? null,
    importantInfo: d.hotelImportantInformation ?? null,
    mainPhoto: d.main_photo ?? null,
    images,

    checkinTime,
    checkoutTime: ct?.checkout ?? null,
    checkinInstructions: ct?.instructions ?? [],

    hotelType: d.hotelType ?? null,
    chain: d.chain ?? null,
    airportCode: d.airportCode ?? null,

    phone: d.phone ?? null,
    email: d.email ?? null,

    parking: d.parking ?? null,
    childAllowed: d.childAllowed ?? null,
    petsAllowed: d.petsAllowed ?? null,
    policies,

    reviewRating: d.rating ?? null,
    reviewCount: d.reviewCount ?? null,
    sentimentPros: d.sentiment_analysis?.pros ?? [],
    sentimentCons: d.sentiment_analysis?.cons ?? [],
    sentimentCategories,

    latitude: d.location?.latitude ?? null,
    longitude: d.location?.longitude ?? null,

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
  // LiteAPI requires countryCode (or lat/lon/placeId) — without it the API
  // returns 400. Fall back to SerpApi when the caller omits countryCode.
  if (!countryCode) return [];

  const params = new URLSearchParams({
    hotelName: name,
    countryCode,
    limit: '10',
  });

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
