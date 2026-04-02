import { describe, test, expect } from 'vitest';
import {
  normaliseLiteAPISearchResults,
  normaliseLiteAPIHotel,
} from './liteapi';

// Matches real LiteAPI /v3.0/data/hotels response shape
const MOCK_SEARCH_RESPONSE = {
  data: [
    {
      id: 'lp12345',
      name: 'The Savoy',
      address: 'Strand',
      city: 'London',
      zip: 'WC2R 0EZ',
      stars: 5,
      country: 'gb',
    },
    {
      id: 'lp99999',
      name: 'Savoy Hotel Manchester',
      address: '1 Deansgate',
      city: 'Manchester',
      zip: 'M1 1AA',
      stars: 4,
      country: 'gb',
    },
  ],
};

// Matches real LiteAPI /v3.0/data/hotel response shape
const MOCK_HOTEL_RESPONSE = {
  data: {
    id: 'lp12345',
    name: 'The Savoy',
    address: 'Strand',
    city: 'London',
    zip: 'WC2R 0EZ',
    starRating: 5,
    rooms: [
      {
        roomName: 'Deluxe Room',
        description: 'Elegant room with river views.',
        maxOccupancy: 2,
        bedTypes: [{ bedType: 'King', quantity: 1, bedSize: '181-210 cm', id: 1 }],
        roomSizeSquare: 35,
        roomAmenities: [
          { amenitiesId: 1, name: 'WiFi', sort: 0 },
          { amenitiesId: 2, name: 'Minibar', sort: 0 },
          { amenitiesId: 3, name: 'Air Conditioning', sort: 0 },
        ],
      },
      {
        roomName: 'Thames Suite',
        description: null,
        maxOccupancy: 3,
        bedTypes: [{ bedType: 'King', quantity: 1, bedSize: '181-210 cm', id: 2 }],
        roomSizeSquare: null,
        roomAmenities: [
          { amenitiesId: 1, name: 'WiFi', sort: 0 },
          { amenitiesId: 4, name: 'Butler Service', sort: 0 },
        ],
      },
    ],
    facilities: [
      { facilityId: 1, name: 'Pool' },
      { facilityId: 2, name: 'Spa' },
      { facilityId: 3, name: 'Restaurant' },
      { facilityId: 4, name: 'Bar' },
      { facilityId: 5, name: 'Gym' },
      { facilityId: 6, name: 'Parking' },
      { facilityId: 7, name: 'Airport transfer' },
    ],
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

  test('uppercases country code', () => {
    const result = normaliseLiteAPISearchResults(MOCK_SEARCH_RESPONSE);
    expect(result[0].country).toBe('GB');
  });

  test('uses stars field (not starRating) for search results', () => {
    const result = normaliseLiteAPISearchResults(MOCK_SEARCH_RESPONSE);
    expect(result[0].starRating).toBe(5);
  });

  test('handles missing address fields gracefully', () => {
    const sparse = {
      data: [{ id: 'lp1', name: 'Hotel', stars: null, country: null }],
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
  test('maps rooms to roomTypes with inferred spaceType', () => {
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

  test('extracts first bedType from bedTypes array', () => {
    const result = normaliseLiteAPIHotel(MOCK_HOTEL_RESPONSE);
    expect(result.roomTypes[0].bedType).toBe('King');
  });

  test('handles null roomSizeSquare gracefully', () => {
    const result = normaliseLiteAPIHotel(MOCK_HOTEL_RESPONSE);
    expect(result.roomTypes[1].sizeSqm).toBeNull();
  });

  test('puts all facilities into generalFacilities (LiteAPI has no separate add-ons list)', () => {
    const result = normaliseLiteAPIHotel(MOCK_HOTEL_RESPONSE);
    expect(result.generalFacilities).toContain('Pool');
    expect(result.generalFacilities).toContain('Restaurant');
    expect(result.generalFacilities).toContain('Parking');
    expect(result.products).toEqual([]);
  });

  test('ratePlans is empty (LiteAPI content endpoint has no rate plan data)', () => {
    const result = normaliseLiteAPIHotel(MOCK_HOTEL_RESPONSE);
    expect(result.ratePlans).toEqual([]);
  });

  test('sets source to liteapi', () => {
    const result = normaliseLiteAPIHotel(MOCK_HOTEL_RESPONSE);
    expect(result.source).toBe('liteapi');
  });

  test('builds address from flat string fields', () => {
    const result = normaliseLiteAPIHotel(MOCK_HOTEL_RESPONSE);
    expect(result.address).toBe('Strand, London, WC2R 0EZ');
  });
});
