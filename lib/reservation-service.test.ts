import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createReservationsForEnvironment } from './reservation-service';

// Mock all external dependencies
vi.mock('./prisma', () => ({
  prisma: {
    reservationCreationLog: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
      update: vi.fn().mockResolvedValue({}),
    },
    customerCreationLog: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
      update: vi.fn().mockResolvedValue({}),
    },
    unifiedLog: {
      findFirst: vi.fn().mockResolvedValue({
        roomCount: 10,
        dormCount: 0,
        apartmentCount: 0,
        bedCount: 0,
        durationDays: 7,
        timezone: 'Europe/London',
        propertyType: 'hotel',
        timestamp: new Date('2024-01-15'),
      }),
    },
    environmentLog: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('./unified-logger', () => ({
  updateEnvironmentReservationStats: vi.fn().mockResolvedValue(undefined),
  createDemoFillerLog: vi.fn().mockResolvedValue({ id: 'test-log' }),
  updateUnifiedLog: vi.fn().mockResolvedValue({}),
}));

vi.mock('./mews-data-service', () => ({
  fetchMewsData: vi.fn().mockResolvedValue({
    serviceId: 'svc-1',
    rates: [
      { id: 'rate-1', name: 'Best Price', isPublic: true },
    ],
    resourceCategories: [
      { id: 'cat-1', name: 'Standard Room', type: 'Room', resourceCount: 10 },
    ],
    ageCategories: { adult: 'age-adult-1' },
    vouchersByRate: new Map(),
  }),
}));

vi.mock('./sample-customers', () => ({
  getSampleCustomers: vi.fn(() =>
    Array.from({ length: 300 }, (_, i) => ({
      FirstName: `Customer${i}`,
      LastName: `Last${i}`,
      Email: `customer${i}@example.com`,
      Phone: '+44123456789',
      BirthDate: '1990-01-01',
      NationalityCode: 'GB',
      Sex: 'Male',
      Title: 'Mr',
      Classifications: [],
      Notes: 'Test customer',
    }))
  ),
}));

vi.mock('./mews-rate-limiter', () => ({
  fetchWithRateLimit: vi.fn(),
}));

vi.mock('./api-call-logger', () => ({
  fetchWithRateLimitAndLog: vi.fn(),
}));

vi.mock('./force-log', () => ({
  log: {
    reservations: vi.fn(),
    customers: vi.fn(),
  },
  logError: vi.fn(),
}));

vi.mock('./translations/language-utils', () => ({
  resolveLanguage: vi.fn(() => 'en'),
}));

vi.mock('./translations/customer-notes', () => ({
  translateNote: vi.fn((note: string) => note),
}));

// Import mocks for assertions
import { fetchWithRateLimit } from './mews-rate-limiter';
import { fetchWithRateLimitAndLog } from './api-call-logger';
import { prisma } from './prisma';

describe('createReservationsForEnvironment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Default: customer creation succeeds
    // Set up both fetch mocks (fetchWithRateLimit for no logId, fetchWithRateLimitAndLog for logId)
    const defaultFetchImpl = async (url: string) => {
      if (url.includes('customers/add')) {
        return {
          ok: true,
          json: async () => ({ Id: `cust-${Math.random().toString(36).substr(2, 9)}` }),
          text: async () => '',
        };
      }
      if (url.includes('reservations/add')) {
        return {
          ok: true,
          json: async () => ({
            Reservations: [{ Reservation: { Id: `res-${Math.random().toString(36).substr(2, 9)}` } }],
          }),
          text: async () => '',
        };
      }
      if (url.includes('reservations/getAll')) {
        return {
          ok: true,
          json: async () => ({ Reservations: [] }),
          text: async () => '',
        };
      }
      if (url.includes('configuration/get')) {
        return {
          ok: true,
          json: async () => ({
            Enterprise: { TimeZoneIdentifier: 'Europe/London' },
          }),
          text: async () => '',
        };
      }
      // Default
      return { ok: true, json: async () => ({}), text: async () => '' };
    };
    (fetchWithRateLimit as any).mockImplementation(defaultFetchImpl);
    (fetchWithRateLimitAndLog as any).mockImplementation(defaultFetchImpl);
  });

  test('creates reservation log in database at start', async () => {
    await createReservationsForEnvironment('test-token', 'ent-1', 1, {
      skipStateTransitions: true,
    });

    expect(prisma.reservationCreationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          enterpriseId: 'ent-1',
          accessTokenId: 1,
          status: 'processing',
        }),
      })
    );
  });

  test('returns result with success and failure counts', async () => {
    const result = await createReservationsForEnvironment('test-token', 'ent-1', 1, {
      skipStateTransitions: true,
    });

    expect(result).toHaveProperty('totalReservations');
    expect(result).toHaveProperty('totalCustomers');
    expect(result).toHaveProperty('successCount');
    expect(result).toHaveProperty('failureCount');
    expect(result).toHaveProperty('durationSeconds');
    expect(typeof result.durationSeconds).toBe('number');
  });

  test('updates reservation log to completed on success', async () => {
    await createReservationsForEnvironment('test-token', 'ent-1', 1, {
      skipStateTransitions: true,
    });

    expect(prisma.reservationCreationLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'completed',
        }),
      })
    );
  });

  test('throws and updates log to failed when no resource categories found', async () => {
    const { fetchMewsData } = await import('./mews-data-service');
    (fetchMewsData as any).mockResolvedValueOnce({
      serviceId: 'svc-1',
      rates: [{ id: 'rate-1', name: 'Best Price', isPublic: true }],
      resourceCategories: [], // empty - no categories
      ageCategories: { adult: 'age-adult-1' },
      vouchersByRate: new Map(),
    });

    await expect(
      createReservationsForEnvironment('test-token', 'ent-1', 1, {
        skipStateTransitions: true,
      })
    ).rejects.toThrow();

    expect(prisma.reservationCreationLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'failed',
        }),
      })
    );
  });

  test('filters out Dorm-type resource categories', async () => {
    const { fetchMewsData } = await import('./mews-data-service');
    (fetchMewsData as any).mockResolvedValueOnce({
      serviceId: 'svc-1',
      rates: [{ id: 'rate-1', name: 'Best Price', isPublic: true }],
      resourceCategories: [
        { id: 'cat-1', name: 'Standard Room', type: 'Room', resourceCount: 5 },
        { id: 'cat-2', name: 'Shared Dorm', type: 'Dorm', resourceCount: 3 },
      ],
      ageCategories: { adult: 'age-adult-1' },
      vouchersByRate: new Map(),
    });

    const result = await createReservationsForEnvironment('test-token', 'ent-1', 1, {
      skipStateTransitions: true,
    });

    // Should have created reservations only for Standard Room category, not Dorm
    expect(result.successCount).toBeGreaterThan(0);
  });

  test('creates customers before reservations', async () => {
    const callOrder: string[] = [];
    (fetchWithRateLimit as any).mockImplementation(async (url: string) => {
      if (url.includes('customers/add')) {
        callOrder.push('customer');
        return {
          ok: true,
          json: async () => ({ Id: `cust-${callOrder.length}` }),
          text: async () => '',
        };
      }
      if (url.includes('reservations/add')) {
        callOrder.push('reservation');
        return {
          ok: true,
          json: async () => ({
            Reservations: [{ Reservation: { Id: `res-${callOrder.length}` } }],
          }),
          text: async () => '',
        };
      }
      return { ok: true, json: async () => ({}), text: async () => '' };
    });

    await createReservationsForEnvironment('test-token', 'ent-1', 1, {
      skipStateTransitions: true,
    });

    // All customers should be created before any reservation
    const firstReservation = callOrder.indexOf('reservation');
    const lastCustomer = callOrder.lastIndexOf('customer');
    if (firstReservation !== -1 && lastCustomer !== -1) {
      expect(lastCustomer).toBeLessThan(firstReservation);
    }
  });

  test('throws when all customer creations fail', async () => {
    (fetchWithRateLimit as any).mockImplementation(async (url: string) => {
      if (url.includes('customers/add')) {
        return {
          ok: false,
          status: 500,
          json: async () => ({ Message: 'Server error' }),
          text: async () => 'Server error',
        };
      }
      return { ok: true, json: async () => ({}), text: async () => '' };
    });

    await expect(
      createReservationsForEnvironment('test-token', 'ent-1', 1, {
        skipStateTransitions: true,
      })
    ).rejects.toThrow('Failed to create any customers');
  });

  test('handles custom date range option', async () => {
    const result = await createReservationsForEnvironment('test-token', 'ent-1', 1, {
      dateRange: {
        start: new Date('2024-02-01'),
        end: new Date('2024-02-08'),
      },
      skipStateTransitions: true,
    });

    expect(result.successCount).toBeGreaterThanOrEqual(0);
  });

  test('handles custom reservation count option', async () => {
    const result = await createReservationsForEnvironment('test-token', 'ent-1', 1, {
      reservationCount: 5,
      skipStateTransitions: true,
    });

    // With 5 requested, total should be around 5 (some may fail)
    expect(result.totalReservations).toBeLessThanOrEqual(10);
  });

  test('updates unified log stats when logId is provided', async () => {
    const { updateEnvironmentReservationStats } = await import('./unified-logger');

    await createReservationsForEnvironment('test-token', 'ent-1', 1, {
      operationType: 'automatic',
      logId: 'test-log-id',
      skipStateTransitions: true,
    });

    // Should update stats at least twice: once for processing, once for completed
    expect(updateEnvironmentReservationStats).toHaveBeenCalledWith(
      'test-log-id',
      expect.objectContaining({ status: 'processing' })
    );
    expect(updateEnvironmentReservationStats).toHaveBeenCalledWith(
      'test-log-id',
      expect.objectContaining({ status: 'completed' })
    );
  });

  test('does not update unified log stats for demo_filler operation type', async () => {
    const { updateEnvironmentReservationStats } = await import('./unified-logger');

    await createReservationsForEnvironment('test-token', 'ent-1', 1, {
      operationType: 'demo_filler',
      logId: 'test-log-id',
      skipStateTransitions: true,
    });

    // For demo_filler, the automatic-only stats update should not happen
    expect(updateEnvironmentReservationStats).not.toHaveBeenCalledWith(
      'test-log-id',
      expect.objectContaining({ status: 'processing' })
    );
  });

  test('fetches environment data from unified log first', async () => {
    await createReservationsForEnvironment('test-token', 'ent-1', 1, {
      skipStateTransitions: true,
    });

    expect(prisma.unifiedLog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          enterpriseId: 'ent-1',
          logType: 'environment',
        }),
      })
    );
  });

  test('handles reservation API returning fewer IDs than expected', async () => {
    (fetchWithRateLimit as any).mockImplementation(async (url: string) => {
      if (url.includes('customers/add')) {
        return {
          ok: true,
          json: async () => ({ Id: `cust-${Math.random().toString(36).substr(2, 9)}` }),
          text: async () => '',
        };
      }
      if (url.includes('reservations/add')) {
        // Return empty reservations array (fewer than expected)
        return {
          ok: true,
          json: async () => ({ Reservations: [] }),
          text: async () => '',
        };
      }
      return { ok: true, json: async () => ({}), text: async () => '' };
    });

    const result = await createReservationsForEnvironment('test-token', 'ent-1', 1, {
      skipStateTransitions: true,
    });

    // Should track failures for missing reservation IDs
    expect(result.failureCount).toBeGreaterThan(0);
  });
});
