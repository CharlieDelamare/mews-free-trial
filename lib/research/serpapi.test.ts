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
      amenities: ['Pool', 'Spa', 'Restaurant', 'Bar', 'WiFi', 'Parking', 'Gym'],
      property_token: 'tok_abc123',
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

  test('returns empty ratePlans', () => {
    const result = normaliseSerpApiHotel(MOCK_PROPERTY_RESPONSE, 'tok_abc123');
    expect(result.ratePlans).toEqual([]);
  });
});
