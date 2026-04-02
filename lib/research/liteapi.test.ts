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
