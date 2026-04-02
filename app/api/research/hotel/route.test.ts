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
