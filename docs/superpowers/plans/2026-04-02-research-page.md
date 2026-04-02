# Research Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/research` page that lets a sales rep look up a real hotel by name and city, retrieve structured data from LiteAPI (with SerpApi fallback), and review room types, rate plans, and products in a tabbed interface.

**Architecture:** Single `'use client'` page at `app/research/page.tsx` with a four-phase state machine (idle → searching → selecting → fetching → results). Two Next.js API routes call LiteAPI and SerpApi. Pure normalisation functions in `lib/research/` transform raw API responses into a shared `HotelResearchData` shape.

**Tech Stack:** Next.js 14 App Router · TypeScript strict · Tailwind CSS · Mews design system tokens · Vitest + MSW for tests · LiteAPI v3 (primary) · SerpApi Google Hotels (fallback)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `types/research.ts` | All shared TypeScript interfaces |
| Create | `lib/research/inference.ts` | Pure functions: `inferSpaceType`, `inferBoardType`, `inferProductCategory` |
| Create | `lib/research/liteapi.ts` | LiteAPI HTTP calls + normalise to shared shape |
| Create | `lib/research/serpapi.ts` | SerpApi HTTP calls + normalise to shared shape |
| Create | `app/api/research/search/route.ts` | GET handler: search candidates, LiteAPI → SerpApi fallback |
| Create | `app/api/research/hotel/route.ts` | GET handler: fetch full hotel data by source |
| Create | `app/research/page.tsx` | The full page — all phases, tabs, UI |
| Create | `lib/research/inference.test.ts` | Tests for inference functions |
| Create | `lib/research/liteapi.test.ts` | Tests for LiteAPI normalisation |
| Create | `lib/research/serpapi.test.ts` | Tests for SerpApi normalisation |
| Create | `app/api/research/search/route.test.ts` | Tests for search API route |
| Create | `app/api/research/hotel/route.test.ts` | Tests for hotel API route |
| Modify | `app/navbar.tsx` | Add Research link to Tools group |
| Modify | `tests/setup.ts` | Add `LITEAPI_API_KEY` and `SERPAPI_API_KEY` env vars |

---

## Task 1: Shared TypeScript Types

**Files:**
- Create: `types/research.ts`

No test needed — pure type definitions.

- [ ] **Step 1: Create the types file**

```typescript
// types/research.ts

export type SpaceType = 'Room' | 'Suite' | 'Apartment' | 'Dorm' | 'Other';
export type BoardType = 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
export type ProductCategory = 'Food & Beverage' | 'Transport' | 'Wellness' | 'Parking' | 'Other';
export type ResearchSource = 'liteapi' | 'serpapi';

export interface HotelCandidate {
  hotelId: string;
  name: string;
  address: string;
  starRating: number | null;
  country: string | null;
  source: ResearchSource;
  /** SerpApi only — needed to fetch full property data */
  propertyToken?: string;
}

export interface RoomType {
  name: string;
  description: string | null;
  maxOccupancy: number | null;
  bedType: string | null;
  sizeSqm: number | null;
  amenities: string[];
  spaceType: SpaceType;
}

export interface RatePlan {
  name: string;
  boardType: BoardType | null;
  cancellationPolicy: string | null;
  isRefundable: boolean | null;
}

export interface Product {
  name: string;
  category: ProductCategory;
}

export interface HotelResearchData {
  hotelName: string;
  address: string;
  starRating: number | null;
  source: ResearchSource;
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  products: Product[];
  generalFacilities: string[];
}
```

- [ ] **Step 2: Commit**

```bash
git add types/research.ts
git commit -m "feat(research): add shared TypeScript types"
```

---

## Task 2: Inference Utilities

**Files:**
- Create: `lib/research/inference.ts`
- Create: `lib/research/inference.test.ts`

These are pure functions — no HTTP, no side effects. Test first.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/research/inference.test.ts
import { describe, test, expect } from 'vitest';
import { inferSpaceType, inferBoardType, inferProductCategory } from './inference';

describe('inferSpaceType', () => {
  test('returns Suite for suite names', () => {
    expect(inferSpaceType('Thames Suite')).toBe('Suite');
    expect(inferSpaceType('Penthouse View')).toBe('Suite');
  });

  test('returns Apartment for apartment names', () => {
    expect(inferSpaceType('Studio Apartment')).toBe('Apartment');
    expect(inferSpaceType('River Residence')).toBe('Apartment');
  });

  test('returns Dorm for dorm names', () => {
    expect(inferSpaceType('Mixed Dorm')).toBe('Dorm');
    expect(inferSpaceType('Bunk Room')).toBe('Dorm');
    expect(inferSpaceType('Sleep Pod')).toBe('Dorm');
  });

  test('returns Room for standard room names', () => {
    expect(inferSpaceType('Deluxe Room')).toBe('Room');
    expect(inferSpaceType('Superior King')).toBe('Room');
    expect(inferSpaceType('Classic Double')).toBe('Room');
  });

  test('is case-insensitive', () => {
    expect(inferSpaceType('PRESIDENTIAL SUITE')).toBe('Suite');
    expect(inferSpaceType('studio apartment')).toBe('Apartment');
  });
});

describe('inferBoardType', () => {
  test('returns BB for bed and breakfast', () => {
    expect(inferBoardType('Bed and Breakfast Rate')).toBe('BB');
    expect(inferBoardType('B&B Package')).toBe('BB');
  });

  test('returns RO for room only', () => {
    expect(inferBoardType('Room Only')).toBe('RO');
    expect(inferBoardType('No Meals Included')).toBe('RO');
    expect(inferBoardType('Best Available Rate RO')).toBe('RO');
  });

  test('returns HB for half board', () => {
    expect(inferBoardType('Half Board')).toBe('HB');
  });

  test('returns FB for full board', () => {
    expect(inferBoardType('Full Board Package')).toBe('FB');
  });

  test('returns AI for all inclusive', () => {
    expect(inferBoardType('All Inclusive')).toBe('AI');
    expect(inferBoardType('All-In Rate')).toBe('AI');
  });

  test('returns null when no match', () => {
    expect(inferBoardType('Standard Rate')).toBeNull();
    expect(inferBoardType('Flexible')).toBeNull();
  });

  test('is case-insensitive', () => {
    expect(inferBoardType('BED AND BREAKFAST')).toBe('BB');
    expect(inferBoardType('all inclusive')).toBe('AI');
  });
});

describe('inferProductCategory', () => {
  test('returns Food & Beverage for food items', () => {
    expect(inferProductCategory('Breakfast')).toBe('Food & Beverage');
    expect(inferProductCategory('Dinner Package')).toBe('Food & Beverage');
    expect(inferProductCategory('Restaurant Voucher')).toBe('Food & Beverage');
    expect(inferProductCategory('Mini Bar')).toBe('Food & Beverage');
  });

  test('returns Transport for transport items', () => {
    expect(inferProductCategory('Airport Transfer')).toBe('Transport');
    expect(inferProductCategory('Shuttle Service')).toBe('Transport');
    expect(inferProductCategory('Taxi')).toBe('Transport');
  });

  test('returns Wellness for spa and gym items', () => {
    expect(inferProductCategory('Spa Treatment')).toBe('Wellness');
    expect(inferProductCategory('Gym Access')).toBe('Wellness');
    expect(inferProductCategory('Massage')).toBe('Wellness');
  });

  test('returns Parking for parking items', () => {
    expect(inferProductCategory('Parking')).toBe('Parking');
    expect(inferProductCategory('Valet Parking')).toBe('Parking');
  });

  test('returns Other when no match', () => {
    expect(inferProductCategory('Newspaper')).toBe('Other');
    expect(inferProductCategory('Turndown Service')).toBe('Other');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test lib/research/inference.test.ts
```

Expected: FAIL — `Cannot find module './inference'`

- [ ] **Step 3: Implement the inference functions**

```typescript
// lib/research/inference.ts
import type { SpaceType, BoardType, ProductCategory } from '@/types/research';

export function inferSpaceType(name: string): SpaceType {
  const lower = name.toLowerCase();
  if (/suite|penthouse/.test(lower)) return 'Suite';
  if (/apartment|studio|residence/.test(lower)) return 'Apartment';
  if (/dorm|bunk|pod/.test(lower)) return 'Dorm';
  return 'Room';
}

export function inferBoardType(name: string): BoardType | null {
  const lower = name.toLowerCase();
  if (/all.?inclusive|all.?in\b/.test(lower)) return 'AI';
  if (/full.?board|\bfb\b/.test(lower)) return 'FB';
  if (/half.?board|\bhb\b/.test(lower)) return 'HB';
  if (/bed.and.breakfast|b&b|\bbb\b/.test(lower)) return 'BB';
  if (/room.?only|no.?meals|\bro\b/.test(lower)) return 'RO';
  return null;
}

export function inferProductCategory(name: string): ProductCategory {
  const lower = name.toLowerCase();
  if (/breakfast|dinner|lunch|restaurant|food|beverage|bar|mini.?bar|meal/.test(lower)) return 'Food & Beverage';
  if (/transfer|shuttle|taxi|transport|airport/.test(lower)) return 'Transport';
  if (/spa|massage|wellness|gym|fitness|sauna|pool/.test(lower)) return 'Wellness';
  if (/parking|valet|garage/.test(lower)) return 'Parking';
  return 'Other';
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test lib/research/inference.test.ts
```

Expected: PASS — all tests green

- [ ] **Step 5: Commit**

```bash
git add lib/research/inference.ts lib/research/inference.test.ts
git commit -m "feat(research): add inference utilities with tests"
```

---

## Task 3: LiteAPI Client & Normaliser

**Files:**
- Create: `lib/research/liteapi.ts`
- Create: `lib/research/liteapi.test.ts`

> **Important:** Before implementing, sign up for a free LiteAPI sandbox key at https://liteapi.travel and check the actual v3 response shape by calling:
> - `GET https://api.liteapi.travel/v3.0/data/hotels?hotelName=savoy&cityName=london&limit=3` with `X-API-Key: your-key`
> - `GET https://api.liteapi.travel/v3.0/data/hotel?hotelId=<id from above>`
>
> The shapes below are modelled on common LiteAPI v3 patterns. Adjust field names to match actual responses.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/research/liteapi.test.ts
import { describe, test, expect } from 'vitest';
import {
  normaliseLiteAPISearchResults,
  normaliseLiteAPIHotel,
} from './liteapi';

const MOCK_SEARCH_RESPONSE = {
  data: [
    {
      id: 'lp12345',
      name: 'The Savoy',
      address: {
        line1: 'Strand',
        city: 'London',
        country: 'GB',
        postalCode: 'WC2R 0EZ',
      },
      starRating: 5,
      country: 'GB',
    },
    {
      id: 'lp99999',
      name: 'Savoy Hotel Manchester',
      address: {
        line1: '1 Deansgate',
        city: 'Manchester',
        country: 'GB',
        postalCode: 'M1 1AA',
      },
      starRating: 4,
      country: 'GB',
    },
  ],
};

const MOCK_HOTEL_RESPONSE = {
  data: {
    id: 'lp12345',
    name: 'The Savoy',
    hotelDescription: 'Iconic luxury hotel on the Strand.',
    address: {
      line1: 'Strand',
      city: 'London',
      country: 'GB',
      postalCode: 'WC2R 0EZ',
    },
    starRating: 5,
    roomTypes: [
      {
        roomTypeId: 'rt-001',
        name: 'Deluxe Room',
        description: 'Elegant room with river views.',
        maxOccupancy: 2,
        bedType: 'King',
        roomSize: '35',
        amenities: ['WiFi', 'Minibar', 'Air Conditioning'],
      },
      {
        roomTypeId: 'rt-002',
        name: 'Thames Suite',
        description: null,
        maxOccupancy: 3,
        bedType: 'King',
        roomSize: null,
        amenities: ['WiFi', 'Butler Service'],
      },
    ],
    ratePlans: [
      {
        name: 'Best Available Rate',
        boardBasis: 'Room Only',
        cancellationPolicy: 'Free cancellation up to 24h before check-in.',
        isRefundable: true,
      },
      {
        name: 'Bed and Breakfast',
        boardBasis: null,
        cancellationPolicy: 'Non-refundable.',
        isRefundable: false,
      },
    ],
    facilities: ['Pool', 'Spa', 'Restaurant', 'Bar', 'Gym'],
    addons: ['Airport Transfer', 'Late Checkout', 'Parking'],
  },
};

describe('normaliseLiteAPISearchResults', () => {
  test('maps API response to HotelCandidate array', () => {
    const result = normaliseLiteAPISearchResults(MOCK_SEARCH_RESPONSE);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      hotelId: 'lp12345',
      name: 'The Savoy',
      address: 'Strand, London, WC2R 0EZ',
      starRating: 5,
      country: 'GB',
      source: 'liteapi',
    });
  });

  test('handles missing address fields gracefully', () => {
    const sparse = {
      data: [{ id: 'lp1', name: 'Hotel', address: {}, starRating: null, country: null }],
    };
    const result = normaliseLiteAPISearchResults(sparse);
    expect(result[0].address).toBe('');
    expect(result[0].starRating).toBeNull();
  });

  test('returns empty array when data is empty', () => {
    expect(normaliseLiteAPISearchResults({ data: [] })).toEqual([]);
  });
});

describe('normaliseLiteAPIHotel', () => {
  test('maps room types with inferred spaceType', () => {
    const result = normaliseLiteAPIHotel(MOCK_HOTEL_RESPONSE);
    expect(result.roomTypes).toHaveLength(2);
    expect(result.roomTypes[0]).toEqual({
      name: 'Deluxe Room',
      description: 'Elegant room with river views.',
      maxOccupancy: 2,
      bedType: 'King',
      sizeSqm: 35,
      amenities: ['WiFi', 'Minibar', 'Air Conditioning'],
      spaceType: 'Room',
    });
    expect(result.roomTypes[1].spaceType).toBe('Suite');
  });

  test('maps rate plans with inferred boardType', () => {
    const result = normaliseLiteAPIHotel(MOCK_HOTEL_RESPONSE);
    expect(result.ratePlans).toHaveLength(2);
    expect(result.ratePlans[0].boardType).toBe('RO');
    expect(result.ratePlans[1].boardType).toBe('BB');
    expect(result.ratePlans[0].isRefundable).toBe(true);
    expect(result.ratePlans[1].isRefundable).toBe(false);
  });

  test('splits facilities into products and generalFacilities', () => {
    const result = normaliseLiteAPIHotel(MOCK_HOTEL_RESPONSE);
    expect(result.products.map(p => p.name)).toContain('Airport Transfer');
    expect(result.products.map(p => p.name)).toContain('Parking');
    expect(result.generalFacilities).toContain('Pool');
    expect(result.generalFacilities).toContain('Restaurant');
  });

  test('sets source to liteapi', () => {
    const result = normaliseLiteAPIHotel(MOCK_HOTEL_RESPONSE);
    expect(result.source).toBe('liteapi');
  });

  test('handles null roomSize gracefully', () => {
    const result = normaliseLiteAPIHotel(MOCK_HOTEL_RESPONSE);
    expect(result.roomTypes[1].sizeSqm).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test lib/research/liteapi.test.ts
```

Expected: FAIL — `Cannot find module './liteapi'`

- [ ] **Step 3: Implement the LiteAPI client**

```typescript
// lib/research/liteapi.ts
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

  // Addons → products; facilities → general hotel amenities
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test lib/research/liteapi.test.ts
```

Expected: PASS — all tests green

- [ ] **Step 5: Commit**

```bash
git add lib/research/liteapi.ts lib/research/liteapi.test.ts
git commit -m "feat(research): add LiteAPI client and normaliser"
```

---

## Task 4: SerpApi Client & Normaliser

**Files:**
- Create: `lib/research/serpapi.ts`
- Create: `lib/research/serpapi.test.ts`

> **Important:** Check the actual SerpApi Google Hotels response shape at https://serpapi.com/google-hotels-api before adjusting field names. Free tier gives 100 searches/month. The shapes below reflect common SerpApi Google Hotels patterns.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/research/serpapi.test.ts
import { describe, test, expect } from 'vitest';
import {
  normaliseSerpApiSearchResults,
  normaliseSerpApiHotel,
} from './serpapi';

const MOCK_SEARCH_RESPONSE = {
  properties: [
    {
      name: 'The Savoy',
      description: 'Luxury hotel on the Strand.',
      link: 'https://example.com/savoy',
      hotel_class: '5-star hotel',
      overall_rating: 4.8,
      gps_coordinates: { latitude: 51.51, longitude: -0.12 },
      nearby_places: [{ name: 'Charing Cross', transportations: [] }],
      images: [],
      amenities: ['Pool', 'Spa', 'Restaurant', 'Bar', 'WiFi', 'Parking', 'Gym'],
      property_token: 'tok_abc123',
      serpapi_property_details_link: 'https://serpapi.com/search?engine=google_hotels&property_token=tok_abc123',
    },
  ],
};

const MOCK_PROPERTY_RESPONSE = {
  name: 'The Savoy',
  description: 'Luxury hotel on the Strand.',
  hotel_class: '5-star hotel',
  overall_rating: 4.8,
  address: 'Strand, London WC2R 0EZ, UK',
  amenities: ['Pool', 'Spa', 'Restaurant', 'Bar', 'WiFi', 'Gym'],
  rooms: [
    {
      name: 'Deluxe Room',
      description: 'Elegant room with views of the Thames.',
      highlights: [{ highlighted_text: 'River views' }, { highlighted_text: 'King bed' }],
    },
    {
      name: 'Thames Suite',
      description: null,
      highlights: [],
    },
  ],
  prices: [
    { source: 'Official site', rate_per_night: { extracted_lowest: 500 } },
  ],
};

describe('normaliseSerpApiSearchResults', () => {
  test('maps properties to HotelCandidate array', () => {
    const result = normaliseSerpApiSearchResults(MOCK_SEARCH_RESPONSE);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'The Savoy',
      starRating: 5,
      source: 'serpapi',
      propertyToken: 'tok_abc123',
    });
  });

  test('extracts star rating from hotel_class string', () => {
    const result = normaliseSerpApiSearchResults(MOCK_SEARCH_RESPONSE);
    expect(result[0].starRating).toBe(5);
  });

  test('returns empty array when properties is empty', () => {
    expect(normaliseSerpApiSearchResults({ properties: [] })).toEqual([]);
  });

  test('returns empty array when properties is missing', () => {
    expect(normaliseSerpApiSearchResults({})).toEqual([]);
  });
});

describe('normaliseSerpApiHotel', () => {
  test('maps rooms to roomTypes', () => {
    const result = normaliseSerpApiHotel(MOCK_PROPERTY_RESPONSE, 'tok_abc123');
    expect(result.roomTypes).toHaveLength(2);
    expect(result.roomTypes[0].name).toBe('Deluxe Room');
    expect(result.roomTypes[0].spaceType).toBe('Room');
    expect(result.roomTypes[1].spaceType).toBe('Suite');
  });

  test('splits amenities into products and generalFacilities', () => {
    const result = normaliseSerpApiHotel(MOCK_PROPERTY_RESPONSE, 'tok_abc123');
    expect(result.generalFacilities).toContain('Pool');
    expect(result.generalFacilities).toContain('Restaurant');
    expect(result.products.map(p => p.name)).toContain('Parking');
  });

  test('sets source to serpapi', () => {
    const result = normaliseSerpApiHotel(MOCK_PROPERTY_RESPONSE, 'tok_abc123');
    expect(result.source).toBe('serpapi');
  });

  test('returns empty ratePlans — SerpApi does not reliably expose rate plan data', () => {
    const result = normaliseSerpApiHotel(MOCK_PROPERTY_RESPONSE, 'tok_abc123');
    expect(result.ratePlans).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test lib/research/serpapi.test.ts
```

Expected: FAIL — `Cannot find module './serpapi'`

- [ ] **Step 3: Implement the SerpApi client**

```typescript
// lib/research/serpapi.ts
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
    gps_coordinates?: { latitude: number; longitude: number };
    amenities?: string[];
    property_token?: string;
  }>;
}): HotelCandidate[] {
  return (raw.properties ?? []).map((p, i) => ({
    hotelId: p.property_token ?? `serpapi-${i}`,
    name: p.name,
    address: p.address ?? '',
    starRating: extractStarRating(p.hotel_class ?? null),
    country: null, // SerpApi search doesn't always expose country code
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
    maxOccupancy: null, // Not reliably available from SerpApi
    bedType: null,      // Not reliably available from SerpApi
    sizeSqm: null,
    amenities: (r.highlights ?? []).map(h => h.highlighted_text),
    spaceType: inferSpaceType(r.name),
  }));

  // Separate amenities: anything that matches a product category becomes a product
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
    // SerpApi Google Hotels does not reliably expose structured rate plan data
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
  if (!apiKey) return []; // Silently skip if key not configured

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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test lib/research/serpapi.test.ts
```

Expected: PASS — all tests green

- [ ] **Step 5: Commit**

```bash
git add lib/research/serpapi.ts lib/research/serpapi.test.ts
git commit -m "feat(research): add SerpApi client and normaliser"
```

---

## Task 5: Search API Route

**Files:**
- Create: `app/api/research/search/route.ts`
- Create: `app/api/research/search/route.test.ts`
- Modify: `tests/setup.ts`

- [ ] **Step 1: Add env vars to the test setup**

Open `tests/setup.ts` and add two lines inside the `beforeAll` block:

```typescript
process.env.LITEAPI_API_KEY = 'test-liteapi-key';
process.env.SERPAPI_API_KEY = 'test-serpapi-key';
```

- [ ] **Step 2: Write the failing tests**

```typescript
// app/api/research/search/route.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

const mockSearchLiteAPI = vi.fn();
const mockSearchSerpApi = vi.fn();

vi.mock('@/lib/research/liteapi', () => ({
  searchLiteAPI: (...args: any[]) => mockSearchLiteAPI(...args),
}));

vi.mock('@/lib/research/serpapi', () => ({
  searchSerpApi: (...args: any[]) => mockSearchSerpApi(...args),
}));

const MOCK_CANDIDATES = [
  {
    hotelId: 'lp12345',
    name: 'The Savoy',
    address: 'Strand, London',
    starRating: 5,
    country: 'GB',
    source: 'liteapi' as const,
  },
];

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost/api/research/search');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

describe('GET /api/research/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns 400 when name is missing', async () => {
    const req = makeRequest({ city: 'London' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('name');
  });

  test('returns 400 when city is missing', async () => {
    const req = makeRequest({ name: 'The Savoy' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
  });

  test('returns candidates from LiteAPI when results found', async () => {
    mockSearchLiteAPI.mockResolvedValue(MOCK_CANDIDATES);
    const req = makeRequest({ name: 'The Savoy', city: 'London' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.candidates).toHaveLength(1);
    expect(data.candidates[0].name).toBe('The Savoy');
    expect(mockSearchSerpApi).not.toHaveBeenCalled();
  });

  test('falls back to SerpApi when LiteAPI returns no results', async () => {
    mockSearchLiteAPI.mockResolvedValue([]);
    mockSearchSerpApi.mockResolvedValue(MOCK_CANDIDATES);
    const req = makeRequest({ name: 'Boutique Inn', city: 'Bath' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.candidates).toHaveLength(1);
    expect(mockSearchSerpApi).toHaveBeenCalledWith('Boutique Inn', 'Bath');
  });

  test('returns empty candidates when both sources find nothing', async () => {
    mockSearchLiteAPI.mockResolvedValue([]);
    mockSearchSerpApi.mockResolvedValue([]);
    const req = makeRequest({ name: 'Unknown Hotel', city: 'Nowhere' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.candidates).toEqual([]);
  });

  test('passes countryCode to LiteAPI when provided', async () => {
    mockSearchLiteAPI.mockResolvedValue(MOCK_CANDIDATES);
    const req = makeRequest({ name: 'The Savoy', city: 'London', countryCode: 'GB' });
    await GET(req);
    expect(mockSearchLiteAPI).toHaveBeenCalledWith('The Savoy', 'London', 'GB');
  });

  test('returns 500 when LiteAPI throws', async () => {
    mockSearchLiteAPI.mockRejectedValue(new Error('LITEAPI_API_KEY environment variable is not set'));
    const req = makeRequest({ name: 'The Savoy', city: 'London' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm run test app/api/research/search/route.test.ts
```

Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 4: Implement the route**

```typescript
// app/api/research/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchLiteAPI } from '@/lib/research/liteapi';
import { searchSerpApi } from '@/lib/research/serpapi';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get('name')?.trim();
  const city = searchParams.get('city')?.trim();
  const countryCode = searchParams.get('countryCode')?.trim() || undefined;

  if (!name || !city) {
    return NextResponse.json(
      { success: false, error: 'name and city are required' },
      { status: 400 }
    );
  }

  try {
    let candidates = await searchLiteAPI(name, city, countryCode);

    if (candidates.length === 0) {
      candidates = await searchSerpApi(name, city);
    }

    return NextResponse.json({ success: true, candidates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test app/api/research/search/route.test.ts
```

Expected: PASS — all tests green

- [ ] **Step 6: Commit**

```bash
git add app/api/research/search/route.ts app/api/research/search/route.test.ts tests/setup.ts
git commit -m "feat(research): add search API route with LiteAPI/SerpApi fallback"
```

---

## Task 6: Hotel API Route

**Files:**
- Create: `app/api/research/hotel/route.ts`
- Create: `app/api/research/hotel/route.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// app/api/research/hotel/route.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import type { HotelResearchData } from '@/types/research';

const mockFetchLiteAPIHotel = vi.fn();
const mockFetchSerpApiHotel = vi.fn();

vi.mock('@/lib/research/liteapi', () => ({
  fetchLiteAPIHotel: (...args: any[]) => mockFetchLiteAPIHotel(...args),
}));

vi.mock('@/lib/research/serpapi', () => ({
  fetchSerpApiHotel: (...args: any[]) => mockFetchSerpApiHotel(...args),
}));

const MOCK_HOTEL_DATA: HotelResearchData = {
  hotelName: 'The Savoy',
  address: 'Strand, London, WC2R 0EZ',
  starRating: 5,
  source: 'liteapi',
  roomTypes: [],
  ratePlans: [],
  products: [],
  generalFacilities: [],
};

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost/api/research/hotel');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

describe('GET /api/research/hotel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns 400 when hotelId is missing', async () => {
    const req = makeRequest({ source: 'liteapi' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
  });

  test('returns 400 when source is missing', async () => {
    const req = makeRequest({ hotelId: 'lp12345' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
  });

  test('returns 400 when source is invalid', async () => {
    const req = makeRequest({ hotelId: 'lp12345', source: 'unknown' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
  });

  test('calls fetchLiteAPIHotel for liteapi source', async () => {
    mockFetchLiteAPIHotel.mockResolvedValue(MOCK_HOTEL_DATA);
    const req = makeRequest({ hotelId: 'lp12345', source: 'liteapi' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.hotel.hotelName).toBe('The Savoy');
    expect(mockFetchLiteAPIHotel).toHaveBeenCalledWith('lp12345');
    expect(mockFetchSerpApiHotel).not.toHaveBeenCalled();
  });

  test('calls fetchSerpApiHotel for serpapi source', async () => {
    mockFetchSerpApiHotel.mockResolvedValue({ ...MOCK_HOTEL_DATA, source: 'serpapi' });
    const req = makeRequest({ hotelId: 'tok_abc123', source: 'serpapi' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(mockFetchSerpApiHotel).toHaveBeenCalledWith('tok_abc123');
    expect(mockFetchLiteAPIHotel).not.toHaveBeenCalled();
  });

  test('returns 500 when fetch throws', async () => {
    mockFetchLiteAPIHotel.mockRejectedValue(new Error('API error'));
    const req = makeRequest({ hotelId: 'lp12345', source: 'liteapi' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test app/api/research/hotel/route.test.ts
```

Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Implement the route**

```typescript
// app/api/research/hotel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchLiteAPIHotel } from '@/lib/research/liteapi';
import { fetchSerpApiHotel } from '@/lib/research/serpapi';
import type { ResearchSource } from '@/types/research';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const hotelId = searchParams.get('hotelId')?.trim();
  const source = searchParams.get('source')?.trim() as ResearchSource | null;

  if (!hotelId) {
    return NextResponse.json(
      { success: false, error: 'hotelId is required' },
      { status: 400 }
    );
  }

  if (source !== 'liteapi' && source !== 'serpapi') {
    return NextResponse.json(
      { success: false, error: 'source must be "liteapi" or "serpapi"' },
      { status: 400 }
    );
  }

  try {
    const hotel =
      source === 'liteapi'
        ? await fetchLiteAPIHotel(hotelId)
        : await fetchSerpApiHotel(hotelId);

    return NextResponse.json({ success: true, hotel });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch hotel data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test app/api/research/hotel/route.test.ts
```

Expected: PASS — all tests green

- [ ] **Step 5: Run the full test suite to confirm nothing is broken**

```bash
npm run test
```

Expected: All existing tests still passing

- [ ] **Step 6: Commit**

```bash
git add app/api/research/hotel/route.ts app/api/research/hotel/route.test.ts
git commit -m "feat(research): add hotel data API route"
```

---

## Task 7: Navbar Link

**Files:**
- Modify: `app/navbar.tsx`

- [ ] **Step 1: Add the Research link to the Tools group**

Open `app/navbar.tsx`. Find the Tools section (currently contains the ROI Calculator `Link`). The existing markup looks like:

```tsx
<div className="mt-4">
  <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-1 text-neutral-400">Tools</p>
  <div className="space-y-1">
    <Link key="/roi-calculator" href="/roi-calculator" onClick={close} className={linkClasses('/roi-calculator')}>
      <span className="flex items-center gap-2">
        <Calculator className="h-4 w-4" />
        ROI Calculator
      </span>
    </Link>
  </div>
</div>
```

Add the Research link directly after ROI Calculator:

```tsx
<div className="mt-4">
  <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-1 text-neutral-400">Tools</p>
  <div className="space-y-1">
    <Link key="/roi-calculator" href="/roi-calculator" onClick={close} className={linkClasses('/roi-calculator')}>
      <span className="flex items-center gap-2">
        <Calculator className="h-4 w-4" />
        ROI Calculator
      </span>
    </Link>
    <Link key="/research" href="/research" onClick={close} className={linkClasses('/research')}>
      <span className="flex items-center gap-2">
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z" />
        </svg>
        Research
      </span>
    </Link>
  </div>
</div>
```

Also add `'/research'` to the `allLinks` array so the top bar label displays correctly. Find:

```tsx
const allLinks = [...sandboxLinks, ...operationLinks, logsLink];
```

Change to:

```tsx
const allLinks = [...sandboxLinks, ...operationLinks, logsLink, { href: '/research', label: 'Research', icon: <></> }];
```

The `icon` field is only used during rendering via `renderLinks()`, which is not called for this item — it's rendered inline above. The empty fragment satisfies the inferred type without adding a visual element.

- [ ] **Step 2: Commit**

```bash
git add app/navbar.tsx
git commit -m "feat(research): add Research link to navbar Tools group"
```

---

## Task 8: Research Page — Search & Disambiguation Phases

**Files:**
- Create: `app/research/page.tsx` (initial version — search + selecting phases only)

No automated test for the page (React component tests for this interaction-heavy component would be integration tests — defer to manual smoke testing).

- [ ] **Step 1: Create the page with idle + searching + selecting phases**

```tsx
// app/research/page.tsx
'use client';

import { useState } from 'react';
import type { HotelCandidate, HotelResearchData } from '@/types/research';

type Phase = 'idle' | 'searching' | 'selecting' | 'fetching' | 'results' | 'error';

interface SearchForm {
  name: string;
  city: string;
  countryCode: string;
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <span className="text-xs text-neutral-500">
      {'★'.repeat(rating)}{'☆'.repeat(Math.max(0, 5 - rating))}
    </span>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <svg className="animate-spin h-8 w-8 text-mews-primary" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}

export default function ResearchPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [form, setForm] = useState<SearchForm>({ name: '', city: '', countryCode: '' });
  const [candidates, setCandidates] = useState<HotelCandidate[]>([]);
  const [hotel, setHotel] = useState<HotelResearchData | null>(null);
  const [activeTab, setActiveTab] = useState<'rooms' | 'rates' | 'products'>('rooms');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function resetToIdle() {
    setPhase('idle');
    setCandidates([]);
    setHotel(null);
    setErrorMessage(null);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPhase('searching');
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({ name: form.name, city: form.city });
      if (form.countryCode) params.set('countryCode', form.countryCode);

      const res = await fetch(`/api/research/search?${params}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error ?? 'Search failed');

      setCandidates(data.candidates);
      setPhase('selecting');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Search failed');
      setPhase('error');
    }
  }

  async function handleSelectCandidate(candidate: HotelCandidate) {
    setPhase('fetching');

    try {
      const params = new URLSearchParams({
        hotelId: candidate.hotelId,
        source: candidate.source,
      });

      const res = await fetch(`/api/research/hotel?${params}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error ?? 'Failed to load hotel data');

      setHotel(data.hotel);
      setActiveTab('rooms');
      setPhase('results');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load hotel data');
      setPhase('error');
    }
  }

  return (
    <main className="min-h-screen bg-mews-linen py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-mews-night-black mb-2">Hotel Research</h1>
          <p className="text-neutral-600">Look up a real hotel to inspire your Mews sandbox configuration</p>
        </div>

        {/* ── IDLE: Search form ── */}
        {phase === 'idle' && (
          <form onSubmit={handleSearch} className="bg-white rounded-xl border border-neutral-100 shadow-sm p-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                Hotel Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="e.g. The Savoy"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-mews-primary focus:border-mews-primary"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="city"
                type="text"
                required
                placeholder="e.g. London"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-mews-primary focus:border-mews-primary"
              />
            </div>

            <div>
              <label htmlFor="countryCode" className="block text-sm font-medium text-neutral-700 mb-1">
                Country Code <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                id="countryCode"
                type="text"
                placeholder="e.g. GB"
                maxLength={2}
                value={form.countryCode}
                onChange={e => setForm(f => ({ ...f, countryCode: e.target.value.toUpperCase() }))}
                className="w-32 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-mews-primary focus:border-mews-primary uppercase"
              />
              <p className="text-xs text-neutral-500 mt-1">2-letter ISO code — helps narrow results (e.g. GB, US, FR)</p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 font-semibold rounded-lg bg-mews-primary text-mews-night-black hover:bg-mews-primary-hover transition-colors"
            >
              Search
            </button>
          </form>
        )}

        {/* ── SEARCHING ── */}
        {phase === 'searching' && <Spinner label="Finding hotels…" />}

        {/* ── SELECTING: Disambiguation list ── */}
        {phase === 'selecting' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-mews-night-black">
                {candidates.length === 0
                  ? `No results for "${form.name}" in ${form.city}`
                  : `${candidates.length} match${candidates.length === 1 ? '' : 'es'} found — select the right property`}
              </h2>
              <button
                onClick={resetToIdle}
                className="text-sm text-mews-primary hover:underline"
              >
                ← Search again
              </button>
            </div>

            {candidates.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-8 text-center">
                <p className="text-neutral-500 text-sm mb-4">
                  Try adjusting the hotel name or city, or check the spelling.
                </p>
                <button
                  onClick={resetToIdle}
                  className="py-2 px-4 bg-mews-primary text-mews-night-black font-semibold rounded-lg hover:bg-mews-primary-hover transition-colors text-sm"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map(candidate => (
                  <button
                    key={candidate.hotelId}
                    onClick={() => handleSelectCandidate(candidate)}
                    className="w-full text-left bg-white rounded-xl border border-neutral-100 shadow-sm p-5 hover:border-mews-primary hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-mews-night-black group-hover:text-mews-primary transition-colors">
                            {candidate.name}
                          </span>
                          <StarRating rating={candidate.starRating} />
                        </div>
                        <p className="text-sm text-neutral-500">
                          {[candidate.address, candidate.country].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-500 shrink-0">
                        {candidate.source === 'liteapi' ? 'LiteAPI' : 'SerpApi'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FETCHING ── */}
        {phase === 'fetching' && <Spinner label="Loading hotel data…" />}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-8 text-center">
            <p className="text-red-600 text-sm mb-4">{errorMessage ?? 'Something went wrong.'}</p>
            <button
              onClick={resetToIdle}
              className="py-2 px-4 bg-mews-primary text-mews-night-black font-semibold rounded-lg hover:bg-mews-primary-hover transition-colors text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── RESULTS: placeholder until Task 9 ── */}
        {phase === 'results' && hotel && (
          <p className="text-center text-neutral-400 text-sm py-12">Results view — implemented in Task 9</p>
        )}

      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify the page renders**

```bash
npm run dev
```

Navigate to http://localhost:3000/research. Confirm:
- Search form appears ✓
- Submitting with missing fields shows browser validation ✓
- Navbar shows "Research" in the Tools group ✓

- [ ] **Step 3: Commit**

```bash
git add app/research/page.tsx
git commit -m "feat(research): add research page with search and disambiguation phases"
```

---

## Task 9: Research Page — Results Tabs

**Files:**
- Modify: `app/research/page.tsx` — replace the results placeholder with the full tabbed view

- [ ] **Step 1: Replace the results placeholder with the full results view**

In `app/research/page.tsx`, find the results section:

```tsx
{/* ── RESULTS: placeholder until Task 9 ── */}
{phase === 'results' && hotel && (
  <p className="text-center text-neutral-400 text-sm py-12">Results view — implemented in Task 9</p>
)}
```

Replace it with:

```tsx
{/* ── RESULTS: Tabbed view ── */}
{phase === 'results' && hotel && (
  <div>
    {/* Header */}
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-mews-night-black">{hotel.hotelName}</h2>
          <StarRating rating={hotel.starRating} />
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
            via {hotel.source === 'liteapi' ? 'LiteAPI' : 'SerpApi'}
          </span>
        </div>
        {hotel.address && (
          <p className="text-sm text-neutral-500">{hotel.address}</p>
        )}
      </div>
      <button
        onClick={resetToIdle}
        className="text-sm text-mews-primary hover:underline shrink-0"
      >
        ← Search again
      </button>
    </div>

    {/* Tabs */}
    <div className="flex gap-1 mb-6 border-b border-neutral-200">
      {(['rooms', 'rates', 'products'] as const).map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
            activeTab === tab
              ? 'text-mews-night-black border-mews-primary bg-mews-primary/10'
              : 'text-neutral-500 border-transparent hover:text-mews-night-black hover:border-neutral-300'
          }`}
        >
          {tab === 'rooms' && `Room Types (${hotel.roomTypes.length})`}
          {tab === 'rates' && `Rate Plans (${hotel.ratePlans.length})`}
          {tab === 'products' && `Products (${hotel.products.length + hotel.generalFacilities.length})`}
        </button>
      ))}
    </div>

    {/* ── Room Types Tab ── */}
    {activeTab === 'rooms' && (
      <div>
        {hotel.roomTypes.length === 0 ? (
          <p className="text-neutral-400 text-sm text-center py-12">No room type data available from this source.</p>
        ) : (
          <div className="space-y-4">
            {hotel.roomTypes.map((room, i) => (
              <div key={i} className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-mews-night-black">{room.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-mews-primary/10 text-mews-night-black shrink-0">
                    {room.spaceType}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-neutral-500 mb-3">
                  {room.maxOccupancy && <span>Max {room.maxOccupancy} guests</span>}
                  {room.bedType && <span>{room.bedType} bed</span>}
                  {room.sizeSqm && <span>{room.sizeSqm} m²</span>}
                </div>
                {room.description && (
                  <p className="text-sm text-neutral-600 mb-3">{room.description}</p>
                )}
                {room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {room.amenities.map((a, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {/* ── Rate Plans Tab ── */}
    {activeTab === 'rates' && (
      <div>
        {hotel.ratePlans.length === 0 ? (
          <p className="text-neutral-400 text-sm text-center py-12">No rate plan data available from this source.</p>
        ) : (
          <div className="space-y-4">
            {hotel.ratePlans.map((rate, i) => (
              <div key={i} className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-mews-night-black">{rate.name}</h3>
                  <div className="flex gap-2 shrink-0">
                    {rate.boardType && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-mews-yellow text-mews-night-black font-semibold">
                        {rate.boardType}
                      </span>
                    )}
                    {rate.isRefundable !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        rate.isRefundable
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {rate.isRefundable ? 'Refundable' : 'Non-refundable'}
                      </span>
                    )}
                  </div>
                </div>
                {rate.cancellationPolicy && (
                  <p className="text-sm text-neutral-600">{rate.cancellationPolicy}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {/* ── Products Tab ── */}
    {activeTab === 'products' && (
      <div className="space-y-6">
        {hotel.products.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">Individually Bookable Products</h3>
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm divide-y divide-neutral-50">
              {hotel.products.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-mews-night-black">{p.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full">
                    {p.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hotel.generalFacilities.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-1">General Hotel Facilities</h3>
            <p className="text-xs text-neutral-400 mb-3">These are hotel amenities — not mapped to individual Mews products</p>
            <div className="flex flex-wrap gap-2">
              {hotel.generalFacilities.map((f, i) => (
                <span key={i} className="text-xs px-3 py-1 bg-white border border-neutral-200 text-neutral-600 rounded-full">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {hotel.products.length === 0 && hotel.generalFacilities.length === 0 && (
          <p className="text-neutral-400 text-sm text-center py-12">No product or facility data available from this source.</p>
        )}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 2: Verify end-to-end manually**

```bash
npm run dev
```

Test this flow:
1. Go to http://localhost:3000/research
2. Search for "The Savoy" / "London" / "GB"
3. Confirm disambiguation list appears with hotel cards
4. Click a hotel — confirm loading spinner shows
5. Confirm results appear with all three tabs working
6. Confirm "Search again" resets to the form

- [ ] **Step 3: Run the full test suite**

```bash
npm run test
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add app/research/page.tsx
git commit -m "feat(research): add results tabbed view with room types, rate plans, and products"
```

---

## Task 10: Final Check

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Fix any TypeScript or lint errors before proceeding.

- [ ] **Step 2: Run the full test suite one final time**

```bash
npm run test
```

Expected: All tests pass

- [ ] **Step 3: Manual smoke test checklist**

- [ ] Search form validates required fields
- [ ] Searching a well-known hotel (e.g. "Marriott", "London") returns candidates
- [ ] Selecting a candidate shows the loading spinner then results
- [ ] Room Types tab: cards show name, spaceType badge, amenity chips
- [ ] Rate Plans tab: board type badge and refundable tag display correctly
- [ ] Products tab: bookable products separated from general facilities
- [ ] "Search again" returns to idle from all result phases
- [ ] Error state shows a friendly message with a retry button
- [ ] Navbar shows Research link in the Tools group
- [ ] No console errors in the browser

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(research): complete hotel research page (Phase 1 — display only)"
```
