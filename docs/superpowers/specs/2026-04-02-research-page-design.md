# Research Page Design

**Date:** 2026-04-02
**Feature:** `/research` — Hotel data lookup for Mews sandbox configuration
**Status:** Approved, ready for implementation

---

## Overview

A new page in the Mews Sandbox Manager that lets a sales rep look up a real hotel by name and city, retrieve structured property data from LiteAPI (with SerpApi as a fallback), and review it in a tabbed interface. The output — room types, rate plans, and products — maps directly to the Mews PMS entities needed to make a sandbox look like a real hotel.

**Phase 1 scope:** Display only. No data is written to Mews or stored in the database.
**Phase 2 (future):** "Apply to sandbox" action at the end of the results view.

---

## User Flow

The page is a single `'use client'` component that steps through four phases, controlled by a `phase` state variable:

```
idle        → Search form (hotel name + city + optional country code)
             ↓ submit
searching   → Loading state; calls GET /api/research/search
             ↓ candidates returned
selecting   → Disambiguation list of up to 10 candidates
             (name, address, star rating, country)
             ↓ user clicks one
fetching    → Loading state; calls GET /api/research/hotel
             ↓ full data returned
results     → Tabbed view: Room Types | Rate Plans | Products
             "Search again" link resets to idle
```

If LiteAPI returns a single unambiguous match, the disambiguation step is shown anyway — the user always confirms which property they want before fetching full content.

---

## Architecture

### Page

**`app/research/page.tsx`** — single `'use client'` component. All phase state lives here. Follows the same pattern as `app/fill/page.tsx`.

### API Routes

| Route | Method | Params | Purpose |
|---|---|---|---|
| `/api/research/search` | GET | `name`, `city`, `countryCode?` | Search LiteAPI `/v3.0/data/hotels`; fall back to SerpApi if 0 results |
| `/api/research/hotel` | GET | `hotelId`, `source` (`liteapi` or `serpapi`) | Fetch full hotel content from LiteAPI `/v3.0/data/hotel` or SerpApi; normalise into shared shape |

Both routes return `{ success: boolean; error?: string; ...data }` per the project API convention.

### Navbar

`/research` is added to the **Tools** group in `app/navbar.tsx`, alongside the ROI Calculator.

---

## External APIs

### LiteAPI (primary)

- Base URL: `https://api.liteapi.travel/v3.0`
- Auth: `X-API-Key: <LITEAPI_API_KEY>` header
- Search: `GET /data/hotels?hotelName=savoy&cityName=london&countryCode=GB&limit=10`
- Full content: `GET /data/hotel?hotelId=lp12345`

### SerpApi (fallback)

- Used only when LiteAPI returns 0 candidates
- Engine: `google_hotels`
- URL: `https://serpapi.com/search?engine=google_hotels&q=The+Savoy+London&api_key=<SERPAPI_API_KEY>`
- Response is normalised into the same shape as the LiteAPI response so the UI is source-agnostic

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `LITEAPI_API_KEY` | Yes | LiteAPI authentication key |
| `SERPAPI_API_KEY` | No | SerpApi key — fallback only; gracefully skipped if absent |

---

## Data Extraction & Mews Mapping

The API route normalises both source formats into a single `HotelResearchData` shape:

```typescript
interface HotelResearchData {
  hotelName: string;
  address: string;
  starRating: number | null;
  source: 'liteapi' | 'serpapi';
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  products: Product[];
  generalFacilities: string[];
}

interface RoomType {
  name: string;
  description: string | null;
  maxOccupancy: number | null;
  bedType: string | null;
  sizeSqm: number | null;
  amenities: string[];
  spaceType: 'Room' | 'Suite' | 'Apartment' | 'Dorm' | 'Other'; // inferred
}

interface RatePlan {
  name: string;
  boardType: 'RO' | 'BB' | 'HB' | 'FB' | 'AI' | null;
  cancellationPolicy: string | null;
  isRefundable: boolean | null;
}

interface Product {
  name: string;
  category: 'Food & Beverage' | 'Transport' | 'Wellness' | 'Parking' | 'Other';
}
```

### Mews entity mapping

| Extracted data | Mews entity |
|---|---|
| `roomTypes[]` | Space Categories (name, description, max persons, space type) |
| `ratePlans[]` | Rate Plans (name, board type, cancellation policy) |
| `products[]` | Products / add-ons (individually bookable items) |
| `generalFacilities[]` | Displayed as hotel amenities; not mapped to Mews Products |

**Space type inference** — derived from room type name keywords:
- "suite", "penthouse" → `Suite`
- "apartment", "studio", "residence" → `Apartment`
- "dorm", "bunk", "pod" → `Dorm`
- everything else → `Room`

**Board type inference** — derived from rate name keywords:
- "room only", "RO", "no meals" → `RO`
- "bed and breakfast", "B&B", "BB" → `BB`
- "half board", "HB" → `HB`
- "full board", "FB" → `FB`
- "all inclusive", "AI", "all-in" → `AI`

---

## UI

### Search Form (idle phase)

- Hotel name input (required)
- City input (required)
- Country code input (optional, e.g. `GB`) with helper text
- Submit button → `bg-mews-primary text-mews-night-black`

### Disambiguation List (selecting phase)

- Up to 10 candidate cards
- Each card: hotel name, full address, star rating, country
- Clicking a card advances to `fetching`
- "Search again" link resets to `idle`

### Results View (results phase)

- Header: hotel name, address, star rating, source badge (`via LiteAPI` or `via SerpApi`)
- Three tabs: **Room Types** · **Rate Plans** · **Products**
- "Search again" link top-right

**Room Types tab:** One card per room type — name, description, max occupancy, bed type, size, amenities as chips, Mews space type badge.

**Rate Plans tab:** One card per rate plan — name, board type badge (`RO`/`BB`/`HB`/`FB`/`AI`), refundable/non-refundable tag, cancellation policy text.

**Products tab:** Two sub-sections:
- *Individually bookable* (`products[]`) — list with category tags (Food & Beverage, Transport, Wellness, etc.)
- *General hotel facilities* (`generalFacilities[]`) — flat chip list; labelled "not mapped to Mews products"

### Loading States

- `searching` / `fetching` phases show a centred spinner with descriptive text ("Finding hotels…" / "Loading hotel data…")

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| LiteAPI 0 results | Silently retries with SerpApi |
| Both sources return 0 results | Inline message: "No results found for [name] in [city]. Try adjusting the hotel name or city." |
| `LITEAPI_API_KEY` missing | API route returns 500; page shows error banner |
| `SERPAPI_API_KEY` missing | SerpApi fallback is skipped; only LiteAPI is attempted |
| Hotel found, content sparse | Empty sections are omitted gracefully rather than shown as empty cards |
| Network timeout | 10s timeout via `lib/fetch-timeout.ts`; shows "Request timed out — try again" inline |

---

## Out of Scope (Phase 1)

- Writing data to Mews (creating space categories, rate plans, or products via API)
- Saving researched hotels to the database
- Caching results between sessions
- Editing or overriding extracted data before applying it
