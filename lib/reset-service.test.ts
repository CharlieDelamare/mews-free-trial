import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

vi.mock('./prisma', () => ({
  prisma: {
    unifiedLog: {
      create: vi.fn().mockResolvedValue({ id: 'log-1' }),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('./unified-logger', () => ({
  createResetLog: vi.fn().mockResolvedValue({ id: 'log-1' }),
  updateUnifiedLog: vi.fn().mockResolvedValue({}),
  updateEnvironmentCustomerStats: vi.fn().mockResolvedValue({}),
}));

vi.mock('./mews-data-service', () => ({
  fetchAllMewsData: vi.fn().mockResolvedValue([
    {
      serviceId: 'svc-1',
      rates: [{ id: 'rate-1', name: 'Rate 1', isPublic: true }],
      resourceCategories: [],
      ageCategories: { adult: 'age-1' },
      vouchersByRate: new Map(),
    },
  ]),
}));

vi.mock('./bill-service', () => ({
  closeBillsForEnvironment: vi.fn().mockResolvedValue({
    totalBills: 0, successCount: 0, failureCount: 0, details: [],
  }),
}));

vi.mock('./reservation-service', () => ({
  createReservationsForEnvironment: vi.fn().mockResolvedValue({
    successCount: 0, failureCount: 0, customerIds: [],
  }),
}));

vi.mock('./timezone-service', () => ({
  fetchTimezoneFromConfiguration: vi.fn().mockResolvedValue({
    timezone: 'Europe/London',
    currency: 'GBP',
    defaultLanguageCode: 'en-GB',
    nowUtc: new Date().toISOString(),
  }),
}));

vi.mock('@/lib/config', () => ({
  getMewsClientToken: () => 'test-client-token',
  getMewsApiUrl: () => 'https://api.mews-demo.com',
}));

describe('resetEnvironment reservation fetching', () => {
  it('fetches Confirmed/Optional and Started reservations in parallel (not serial)', async () => {
    const callOrder: string[] = [];
    const DELAY = 20;

    global.fetch = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      const body = JSON.parse(opts.body as string);
      const states: string[] = body.States ?? [];
      const label = states.join('/');
      callOrder.push(`start:${label}`);

      return new Promise((resolve) => {
        setTimeout(() => {
          callOrder.push(`end:${label}`);
          resolve({
            ok: true,
            json: async () => ({ Reservations: [], Cursor: null }),
          } as unknown as Response);
        }, DELAY);
      });
    });

    const { resetEnvironment } = await import('./reset-service');
    await resetEnvironment('access-token', 'enterprise-1', 1);

    // If fetches are parallel, the second "start" appears before the first "end"
    const confirmedStart = callOrder.indexOf('start:Confirmed/Optional');
    const startedStart = callOrder.indexOf('start:Started');
    const confirmedEnd = callOrder.indexOf('end:Confirmed/Optional');

    expect(startedStart).toBeGreaterThanOrEqual(0);
    expect(confirmedEnd).toBeGreaterThan(confirmedStart);
    // Key assertion: Started fetch starts before Confirmed/Optional fetch ends
    expect(startedStart).toBeLessThan(confirmedEnd);
  });
});
