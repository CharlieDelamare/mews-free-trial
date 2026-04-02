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
