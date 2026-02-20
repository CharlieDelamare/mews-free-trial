import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fetchMewsData, fetchBookableServices } from './mews-data-service';

// Mock the api-call-logger
vi.mock('./api-call-logger', () => ({
  loggedFetch: vi.fn(),
}));

// We also need to mock global fetch (used when no logId is provided)
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { loggedFetch } from './api-call-logger';

describe('fetchMewsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  function mockFetchSequence(responses: Record<string, any>) {
    mockFetch.mockImplementation(async (url: string) => {
      for (const [key, value] of Object.entries(responses)) {
        if (url.includes(key)) {
          return {
            ok: true,
            json: async () => value,
            text: async () => JSON.stringify(value),
          };
        }
      }
      return { ok: false, text: async () => 'Not found', json: async () => ({}) };
    });
  }

  const defaultResponses = {
    'services/getAll': {
      Services: [
        { Id: 'svc-1', Name: 'Accommodation', IsActive: true, Ordering: 1, Data: { Discriminator: 'Bookable' } },
        { Id: 'svc-2', Name: 'Spa', IsActive: true, Ordering: 2, Data: { Discriminator: 'Additional' } },
      ],
    },
    'rates/getAll': {
      Rates: [
        { Id: 'rate-1', Name: 'Best Price', Type: 'Public', IsPublic: true, IsActive: true, IsEnabled: true },
        { Id: 'rate-2', Name: 'Corporate', Type: 'Private', IsPublic: false, IsActive: true, IsEnabled: true },
        { Id: 'rate-3', Name: 'Disabled Rate', Type: 'Public', IsPublic: true, IsActive: false, IsEnabled: true },
      ],
    },
    'resourceCategories/getAll': {
      ResourceCategories: [
        { Id: 'cat-1', Names: { 'en-US': 'Standard Room' }, Type: 'Room' },
        { Id: 'cat-2', Names: { 'en-US': 'Suite' }, Type: 'Room' },
      ],
    },
    'ageCategories/getAll': {
      AgeCategories: [
        { Id: 'age-1', Name: 'Adult', Classification: 'Adult' },
        { Id: 'age-2', Name: 'Child', Classification: 'Child' },
      ],
    },
    'resourceCategoryAssignments/getAll': {
      ResourceCategoryAssignments: [
        { Id: 'a1', ResourceId: 'r1', CategoryId: 'cat-1', IsActive: true, CreatedUtc: '', UpdatedUtc: '' },
        { Id: 'a2', ResourceId: 'r2', CategoryId: 'cat-1', IsActive: true, CreatedUtc: '', UpdatedUtc: '' },
        { Id: 'a3', ResourceId: 'r3', CategoryId: 'cat-2', IsActive: true, CreatedUtc: '', UpdatedUtc: '' },
        { Id: 'a4', ResourceId: 'r4', CategoryId: 'cat-2', IsActive: false, CreatedUtc: '', UpdatedUtc: '' }, // inactive
      ],
    },
    'vouchers/getAll': {
      Vouchers: [],
      VoucherAssignments: [],
      VoucherCodes: [],
    },
  };

  test('returns correctly structured MewsData', async () => {
    mockFetchSequence(defaultResponses);

    const result = await fetchMewsData('client-token', 'access-token');

    expect(result.serviceId).toBe('svc-1');
    expect(result.rates).toBeInstanceOf(Array);
    expect(result.resourceCategories).toBeInstanceOf(Array);
    expect(result.ageCategories.adult).toBe('age-1');
    expect(result.ageCategories.child).toBe('age-2');
    expect(result.vouchersByRate).toBeInstanceOf(Map);
  });

  test('selects the first Bookable service', async () => {
    mockFetchSequence(defaultResponses);

    const result = await fetchMewsData('client-token', 'access-token');

    expect(result.serviceId).toBe('svc-1'); // Accommodation, not Spa
  });

  test('uses provided serviceId when given', async () => {
    mockFetchSequence(defaultResponses);

    const result = await fetchMewsData('client-token', 'access-token', {
      serviceId: 'custom-svc',
    });

    expect(result.serviceId).toBe('custom-svc');
    // Should NOT call services/getAll
    const servicesCalls = mockFetch.mock.calls.filter(
      (call: any[]) => call[0].includes('services/getAll')
    );
    expect(servicesCalls).toHaveLength(0);
  });

  test('filters out inactive/disabled rates', async () => {
    mockFetchSequence(defaultResponses);

    const result = await fetchMewsData('client-token', 'access-token');

    // rate-3 is inactive, should be excluded
    expect(result.rates).toHaveLength(2);
    expect(result.rates.map(r => r.id)).toContain('rate-1');
    expect(result.rates.map(r => r.id)).toContain('rate-2');
    expect(result.rates.map(r => r.id)).not.toContain('rate-3');
  });

  test('correctly classifies public vs private rates', async () => {
    mockFetchSequence(defaultResponses);

    const result = await fetchMewsData('client-token', 'access-token');

    const bestPrice = result.rates.find(r => r.name === 'Best Price');
    const corporate = result.rates.find(r => r.name === 'Corporate');

    expect(bestPrice?.isPublic).toBe(true);
    expect(corporate?.isPublic).toBe(false);
  });

  test('counts resources per category using active assignments only', async () => {
    mockFetchSequence(defaultResponses);

    const result = await fetchMewsData('client-token', 'access-token');

    const standard = result.resourceCategories.find(c => c.name === 'Standard Room');
    const suite = result.resourceCategories.find(c => c.name === 'Suite');

    expect(standard?.resourceCount).toBe(2); // 2 active assignments
    expect(suite?.resourceCount).toBe(1); // 1 active, 1 inactive (inactive excluded)
  });

  test('extracts English names from localized Names object', async () => {
    mockFetchSequence(defaultResponses);

    const result = await fetchMewsData('client-token', 'access-token');

    expect(result.resourceCategories[0].name).toBe('Standard Room');
  });

  test('falls back to first available name when no English key', async () => {
    mockFetchSequence({
      ...defaultResponses,
      'resourceCategories/getAll': {
        ResourceCategories: [
          { Id: 'cat-1', Names: { 'de-DE': 'Standardzimmer' }, Type: 'Room' },
        ],
      },
    });

    const result = await fetchMewsData('client-token', 'access-token');

    expect(result.resourceCategories[0].name).toBe('Standardzimmer');
  });

  test('returns "Unknown" when Names object is empty', async () => {
    mockFetchSequence({
      ...defaultResponses,
      'resourceCategories/getAll': {
        ResourceCategories: [
          { Id: 'cat-1', Names: {}, Type: 'Room' },
        ],
      },
    });

    const result = await fetchMewsData('client-token', 'access-token');

    expect(result.resourceCategories[0].name).toBe('Unknown');
  });

  test('throws when no bookable service found', async () => {
    mockFetchSequence({
      ...defaultResponses,
      'services/getAll': {
        Services: [
          { Id: 'svc-2', Name: 'Spa', IsActive: true, Ordering: 1, Data: { Discriminator: 'Additional' } },
        ],
      },
    });

    await expect(
      fetchMewsData('client-token', 'access-token')
    ).rejects.toThrow('No bookable service found');
  });

  test('throws when no active rates found', async () => {
    mockFetchSequence({
      ...defaultResponses,
      'rates/getAll': {
        Rates: [
          { Id: 'rate-1', Name: 'Old Rate', IsPublic: true, IsActive: false, IsEnabled: false },
        ],
      },
    });

    await expect(
      fetchMewsData('client-token', 'access-token')
    ).rejects.toThrow('No active/enabled rates');
  });

  test('throws when no adult age category found', async () => {
    mockFetchSequence({
      ...defaultResponses,
      'ageCategories/getAll': {
        AgeCategories: [
          { Id: 'age-2', Name: 'Child', Classification: 'Child' },
        ],
      },
    });

    await expect(
      fetchMewsData('client-token', 'access-token')
    ).rejects.toThrow('No adult age category found');
  });

  test('handles voucher code mapping for private rates', async () => {
    mockFetchSequence({
      ...defaultResponses,
      'vouchers/getAll': {
        Vouchers: [{ Id: 'v1', Name: 'Corporate Voucher', IsActive: true, AssignedRateIds: ['rate-2'] }],
        VoucherAssignments: [
          { VoucherId: 'v1', RateId: 'rate-2', UpdatedUtc: '2024-01-01' },
        ],
        VoucherCodes: null,
      },
      'voucherCodes/getAll': {
        VoucherCodes: [
          { Id: 'vc1', VoucherId: 'v1', Value: 'CORP2024', IsActive: true },
        ],
      },
    });

    const result = await fetchMewsData('client-token', 'access-token');

    expect(result.vouchersByRate.get('rate-2')).toBe('CORP2024');
  });

  test('handles empty voucher assignments gracefully', async () => {
    mockFetchSequence(defaultResponses);

    const result = await fetchMewsData('client-token', 'access-token');

    expect(result.vouchersByRate.size).toBe(0);
  });

  test('excludes voucher codes with expired validity period', async () => {
    mockFetchSequence({
      ...defaultResponses,
      'vouchers/getAll': {
        Vouchers: [{ Id: 'v1', Name: 'Expired Voucher', IsActive: true, AssignedRateIds: ['rate-2'] }],
        VoucherAssignments: [
          { VoucherId: 'v1', RateId: 'rate-2', UpdatedUtc: '2024-01-01' },
        ],
        VoucherCodes: null,
      },
      'voucherCodes/getAll': {
        VoucherCodes: [
          {
            Id: 'vc1',
            VoucherId: 'v1',
            Value: 'EXPIRED2023',
            IsActive: true,
            ValidityStartUtc: '2023-01-01T00:00:00Z',
            ValidityEndUtc: '2023-12-31T23:59:59Z',
          },
        ],
      },
    });

    const result = await fetchMewsData('client-token', 'access-token');

    expect(result.vouchersByRate.size).toBe(0);
  });

  test('excludes voucher codes with future validity start', async () => {
    mockFetchSequence({
      ...defaultResponses,
      'vouchers/getAll': {
        Vouchers: [{ Id: 'v1', Name: 'Future Voucher', IsActive: true, AssignedRateIds: ['rate-2'] }],
        VoucherAssignments: [
          { VoucherId: 'v1', RateId: 'rate-2', UpdatedUtc: '2024-01-01' },
        ],
        VoucherCodes: null,
      },
      'voucherCodes/getAll': {
        VoucherCodes: [
          {
            Id: 'vc1',
            VoucherId: 'v1',
            Value: 'FUTURE2099',
            IsActive: true,
            ValidityStartUtc: '2099-01-01T00:00:00Z',
            ValidityEndUtc: '2099-12-31T23:59:59Z',
          },
        ],
      },
    });

    const result = await fetchMewsData('client-token', 'access-token');

    expect(result.vouchersByRate.size).toBe(0);
  });

  test('keeps voucher codes with null validity (no restriction)', async () => {
    mockFetchSequence({
      ...defaultResponses,
      'vouchers/getAll': {
        Vouchers: [{ Id: 'v1', Name: 'Open Voucher', IsActive: true, AssignedRateIds: ['rate-2'] }],
        VoucherAssignments: [
          { VoucherId: 'v1', RateId: 'rate-2', UpdatedUtc: '2024-01-01' },
        ],
        VoucherCodes: null,
      },
      'voucherCodes/getAll': {
        VoucherCodes: [
          {
            Id: 'vc1',
            VoucherId: 'v1',
            Value: 'OPEN_CODE',
            IsActive: true,
            ValidityStartUtc: null,
            ValidityEndUtc: null,
          },
        ],
      },
    });

    const result = await fetchMewsData('client-token', 'access-token');

    expect(result.vouchersByRate.get('rate-2')).toBe('OPEN_CODE');
  });

  test('uses loggedFetch when logId is provided', async () => {
    (loggedFetch as any).mockImplementation(async (url: string) => {
      for (const [key, value] of Object.entries(defaultResponses)) {
        if (url.includes(key)) {
          return {
            ok: true,
            json: async () => value,
            text: async () => JSON.stringify(value),
          };
        }
      }
      return { ok: false, text: async () => 'Not found' };
    });

    await fetchMewsData('client-token', 'access-token', { logId: 'log-1' });

    expect(loggedFetch).toHaveBeenCalled();
  });
});

describe('fetchBookableServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('returns only bookable services sorted by ordering', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        Services: [
          { Id: 'svc-3', Name: 'Extra Service', IsActive: true, Ordering: 3, Data: { Discriminator: 'Additional' } },
          { Id: 'svc-1', Name: 'Accommodation', IsActive: true, Ordering: 1, Data: { Discriminator: 'Bookable' } },
          { Id: 'svc-2', Name: 'Events', IsActive: true, Ordering: 2, Data: { Discriminator: 'Bookable' } },
        ],
      }),
      text: async () => '',
    });

    const result = await fetchBookableServices('client-token', 'access-token');

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Accommodation');
    expect(result[1].name).toBe('Events');
    // Additional service should be excluded
    expect(result.find(s => s.name === 'Extra Service')).toBeUndefined();
  });
});
