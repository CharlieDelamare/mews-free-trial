import { describe, test, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockFindEnvironmentLogByPropertyName = vi.fn();
const mockUpdateUnifiedLog = vi.fn();
const mockSendZapierNotification = vi.fn();
const mockCreateReservationsForEnvironment = vi.fn();
const mockFetchMewsData = vi.fn();
const mockUpdateBestPriceRate = vi.fn();
const mockFetchTimezoneFromConfiguration = vi.fn();
const mockRunInBackground = vi.fn();
const mockSendSandboxReadyEmail = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    accessToken: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/unified-logger', () => ({
  findEnvironmentLogByPropertyName: (...args: any[]) => mockFindEnvironmentLogByPropertyName(...args),
  updateUnifiedLog: (...args: any[]) => mockUpdateUnifiedLog(...args),
}));

vi.mock('@/lib/reservation-service', () => ({
  createReservationsForEnvironment: (...args: any[]) => mockCreateReservationsForEnvironment(...args),
}));

vi.mock('@/lib/zapier', () => ({
  sendZapierNotification: (...args: any[]) => mockSendZapierNotification(...args),
}));

vi.mock('@/lib/mews-data-service', () => ({
  fetchMewsData: (...args: any[]) => mockFetchMewsData(...args),
  updateBestPriceRate: (...args: any[]) => mockUpdateBestPriceRate(...args),
}));

vi.mock('@/lib/timezone-service', () => ({
  fetchTimezoneFromConfiguration: (...args: any[]) => mockFetchTimezoneFromConfiguration(...args),
}));

vi.mock('@/lib/config', () => ({
  getMewsClientToken: () => 'test-client-token',
}));

vi.mock('@/lib/background', () => ({
  runInBackground: (...args: any[]) => mockRunInBackground(...args),
}));

vi.mock('@/lib/email-service', () => ({
  sendSandboxReadyEmail: (...args: any[]) => mockSendSandboxReadyEmail(...args),
}));

vi.mock('@/lib/task-service', () => ({
  createOnboardingTasks: vi.fn().mockResolvedValue({ successCount: 0, totalTasks: 0 }),
}));

import { prisma } from '@/lib/prisma';

describe('POST /api/webhook/access-token', () => {
  const createMockRequest = (body: any) => ({
    json: async () => body,
  } as NextRequest);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Default mocks
    (prisma.accessToken.findFirst as any).mockResolvedValue(null);
    (prisma.accessToken.create as any).mockResolvedValue({
      id: 1,
      accessToken: 'test-access-token',
      enterpriseId: 'ent-1',
      enterpriseName: 'Test Hotel',
      receivedAt: new Date(),
    });
    mockFindEnvironmentLogByPropertyName.mockResolvedValue(null);
    mockUpdateUnifiedLog.mockResolvedValue({});
    mockSendZapierNotification.mockResolvedValue(undefined);
    mockFetchTimezoneFromConfiguration.mockResolvedValue({
      timezone: 'Europe/London',
      defaultLanguageCode: 'en-GB',
    });
    mockFetchMewsData.mockResolvedValue({
      rates: [{ id: 'rate-1', name: 'Best Price', isPublic: true }],
    });
    mockUpdateBestPriceRate.mockResolvedValue(true);
    mockCreateReservationsForEnvironment.mockResolvedValue({
      totalReservations: 50,
      totalCustomers: 50,
      successCount: 50,
      failureCount: 0,
    });
    mockSendSandboxReadyEmail.mockResolvedValue(undefined);
  });

  describe('Action Routing', () => {
    test('routes IntegrationCreated to main handler', async () => {
      const request = createMockRequest({
        Action: 'IntegrationCreated',
        Data: {
          Enterprise: { Id: 'ent-1', Name: 'Test Hotel' },
          AccessToken: 'test-access-token',
          CreatedUtc: '2024-01-01T00:00:00Z',
          IsEnabled: true,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Access token received and stored');
    });

    test('routes IntegrationDeleted to deletion handler', async () => {
      (prisma.accessToken.findMany as any).mockResolvedValue([
        { id: 1, enterpriseId: 'ent-1' },
      ]);
      (prisma.accessToken.updateMany as any).mockResolvedValue({ count: 1 });

      const request = createMockRequest({
        Action: 'IntegrationDeleted',
        Data: {
          Integration: { Id: 'int-1', Name: 'Test Integration' },
          DeletedUtc: '2024-01-01T00:00:00Z',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tokensDisabled).toBe(1);
    });

    test('rejects unknown action types with 400', async () => {
      const request = createMockRequest({
        Action: 'UnknownAction',
        Data: {},
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Payload Validation', () => {
    test('returns 400 when AccessToken is missing', async () => {
      const request = createMockRequest({
        Action: 'IntegrationCreated',
        Data: {
          Enterprise: { Id: 'ent-1', Name: 'Test Hotel' },
          CreatedUtc: '2024-01-01T00:00:00Z',
          IsEnabled: true,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    test('returns 400 when Enterprise data is missing', async () => {
      const request = createMockRequest({
        Action: 'IntegrationCreated',
        Data: {
          AccessToken: 'test-token',
          CreatedUtc: '2024-01-01T00:00:00Z',
          IsEnabled: true,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    test('returns 400 when IntegrationDeleted has no Integration.Id', async () => {
      const request = createMockRequest({
        Action: 'IntegrationDeleted',
        Data: {
          Integration: {},
          DeletedUtc: '2024-01-01T00:00:00Z',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    test('returns 400 when Enterprise.Name is missing', async () => {
      (prisma.accessToken.create as any).mockResolvedValue({
        id: 1,
        accessToken: 'test-token',
        enterpriseId: 'ent-1',
        enterpriseName: undefined,
        receivedAt: new Date(),
      });

      const request = createMockRequest({
        Action: 'IntegrationCreated',
        Data: {
          Enterprise: { Id: 'ent-1' },
          AccessToken: 'test-token',
          CreatedUtc: '2024-01-01T00:00:00Z',
          IsEnabled: true,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Idempotency', () => {
    test('skips duplicate webhooks for same enterprise/token', async () => {
      (prisma.accessToken.findFirst as any).mockResolvedValue({
        id: 99,
        accessToken: 'test-token',
        enterpriseId: 'ent-1',
      });

      const request = createMockRequest({
        Action: 'IntegrationCreated',
        Data: {
          Enterprise: { Id: 'ent-1', Name: 'Test Hotel' },
          AccessToken: 'test-token',
          Integration: { Id: 'int-1' },
          CreatedUtc: '2024-01-01T00:00:00Z',
          IsEnabled: true,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.message).toBe('Duplicate webhook - already processed');
      expect(prisma.accessToken.create).not.toHaveBeenCalled();
    });
  });

  describe('Manual Token Reconciliation', () => {
    test('updates manually stored token with webhook data', async () => {
      // First findFirst for idempotency check: no match
      // Second findFirst for manual token: found
      (prisma.accessToken.findFirst as any)
        .mockResolvedValueOnce(null) // idempotency check
        .mockResolvedValueOnce({
          id: 5,
          accessToken: 'test-token',
          enterpriseId: 'ent-1',
          integrationId: null,
          serviceId: null,
          serviceName: null,
        }); // manual token found

      (prisma.accessToken.update as any).mockResolvedValue({
        id: 5,
        accessToken: 'test-token',
        enterpriseId: 'ent-1',
        enterpriseName: 'Test Hotel',
        receivedAt: new Date(),
      });

      const request = createMockRequest({
        Action: 'IntegrationCreated',
        Data: {
          Enterprise: { Id: 'ent-1', Name: 'Test Hotel' },
          AccessToken: 'test-token',
          Integration: { Id: 'int-1', Name: 'Test Integration' },
          Service: { Id: 'svc-1', Name: 'Accommodation' },
          CreatedUtc: '2024-01-01T00:00:00Z',
          IsEnabled: true,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.accessToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5 },
          data: expect.objectContaining({
            integrationId: 'int-1',
            integrationName: 'Test Integration',
          }),
        })
      );
      // Should NOT create a new token
      expect(prisma.accessToken.create).not.toHaveBeenCalled();
    });
  });

  describe('Environment Log Matching', () => {
    test('updates environment log and triggers background setup when log found', async () => {
      mockFindEnvironmentLogByPropertyName.mockResolvedValue({
        id: 'log-1',
        propertyName: 'Test Hotel',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        requestorEmail: 'requestor@example.com',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'john@example.com',
        loginPassword: 'Sample123',
        signInUrl: 'https://app.mews-demo.com/signin/abc123',
      });

      const request = createMockRequest({
        Action: 'IntegrationCreated',
        Data: {
          Enterprise: { Id: 'ent-1', Name: 'Test Hotel' },
          AccessToken: 'test-token',
          CreatedUtc: '2024-01-01T00:00:00Z',
          IsEnabled: true,
        },
      });

      await POST(request);

      // Should update log with enterpriseId and processing status
      expect(mockUpdateUnifiedLog).toHaveBeenCalledWith('log-1', {
        enterpriseId: 'ent-1',
        status: 'processing',
      });

      // Should trigger background work
      expect(mockRunInBackground).toHaveBeenCalledTimes(1);
    });

    test('updates log to failed when background setup throws', async () => {
      mockFindEnvironmentLogByPropertyName.mockResolvedValue({
        id: 'log-1',
        propertyName: 'Test Hotel',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        requestorEmail: 'requestor@example.com',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'john@example.com',
        loginPassword: 'Sample123',
        durationDays: 30,
      });

      // Capture the background work promise so we can await it
      let capturedPromise: Promise<unknown> | null = null;
      mockRunInBackground.mockImplementation((promise: Promise<unknown>) => {
        capturedPromise = promise;
      });

      // Make reservation creation fail
      mockCreateReservationsForEnvironment.mockRejectedValue(
        new Error('Reservation creation exploded')
      );

      const request = createMockRequest({
        Action: 'IntegrationCreated',
        Data: {
          Enterprise: { Id: 'ent-1', Name: 'Test Hotel' },
          AccessToken: 'test-token',
          CreatedUtc: '2024-01-01T00:00:00Z',
          IsEnabled: true,
        },
      });

      await POST(request);

      // Wait for the background work to complete
      expect(capturedPromise).not.toBeNull();
      await capturedPromise;

      // Should have updated log to 'processing' first, then to 'failed'
      expect(mockUpdateUnifiedLog).toHaveBeenCalledWith('log-1', {
        enterpriseId: 'ent-1',
        status: 'processing',
      });
      expect(mockUpdateUnifiedLog).toHaveBeenCalledWith('log-1', expect.objectContaining({
        status: 'failed',
        errorMessage: expect.stringContaining('Reservation creation exploded'),
      }));
    });

    test('stores token without notifications when no matching log found', async () => {
      mockFindEnvironmentLogByPropertyName.mockResolvedValue(null);

      const request = createMockRequest({
        Action: 'IntegrationCreated',
        Data: {
          Enterprise: { Id: 'ent-1', Name: 'Unknown Hotel' },
          AccessToken: 'test-token',
          CreatedUtc: '2024-01-01T00:00:00Z',
          IsEnabled: true,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      // Background work should NOT run when no log match
      expect(mockRunInBackground).not.toHaveBeenCalled();
    });
  });

  describe('IntegrationDeleted Handling', () => {
    test('disables tokens for deleted integration', async () => {
      (prisma.accessToken.findMany as any).mockResolvedValue([
        { id: 1, enterpriseId: 'ent-1', enterpriseName: 'Hotel A' },
        { id: 2, enterpriseId: 'ent-1', enterpriseName: 'Hotel A' },
      ]);
      (prisma.accessToken.updateMany as any).mockResolvedValue({ count: 2 });

      const request = createMockRequest({
        Action: 'IntegrationDeleted',
        Data: {
          Integration: { Id: 'int-1', Name: 'Test Integration' },
          DeletedUtc: '2024-01-01T00:00:00Z',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.tokensDisabled).toBe(2);
      expect(prisma.accessToken.updateMany).toHaveBeenCalledWith({
        where: { integrationId: 'int-1', isEnabled: true },
        data: { isEnabled: false },
      });
    });

    test('handles no tokens found for deleted integration', async () => {
      (prisma.accessToken.findMany as any).mockResolvedValue([]);

      const request = createMockRequest({
        Action: 'IntegrationDeleted',
        Data: {
          Integration: { Id: 'int-unknown', Name: 'Unknown Integration' },
          DeletedUtc: '2024-01-01T00:00:00Z',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.tokensDisabled).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('returns 500 on unexpected error', async () => {
      const request = {
        json: async () => { throw new Error('Parse error'); },
      } as NextRequest;

      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    test('handles database error during IntegrationDeleted', async () => {
      (prisma.accessToken.findMany as any).mockRejectedValue(new Error('DB error'));

      const request = createMockRequest({
        Action: 'IntegrationDeleted',
        Data: {
          Integration: { Id: 'int-1', Name: 'Test' },
          DeletedUtc: '2024-01-01T00:00:00Z',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});

describe('GET /api/webhook/access-token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('returns all tokens when no enterpriseId filter', async () => {
    (prisma.accessToken.findMany as any).mockResolvedValue([
      { id: 1, enterpriseId: 'ent-1', accessToken: 'token-1' },
      { id: 2, enterpriseId: 'ent-2', accessToken: 'token-2' },
    ]);

    const request = {
      url: 'http://localhost:3000/api/webhook/access-token',
    } as NextRequest;

    const response = await GET(request);
    const data = await response.json();

    expect(data.count).toBe(2);
    expect(data.tokens).toHaveLength(2);
  });

  test('filters by enterpriseId when provided', async () => {
    (prisma.accessToken.findMany as any).mockResolvedValue([
      { id: 1, enterpriseId: 'ent-1', accessToken: 'token-1' },
    ]);

    const request = {
      url: 'http://localhost:3000/api/webhook/access-token?enterpriseId=ent-1',
    } as NextRequest;

    const response = await GET(request);
    const data = await response.json();

    expect(data.count).toBe(1);
    expect(prisma.accessToken.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { enterpriseId: 'ent-1' },
      })
    );
  });

  test('returns 500 on database error', async () => {
    (prisma.accessToken.findMany as any).mockRejectedValue(new Error('DB error'));

    const request = {
      url: 'http://localhost:3000/api/webhook/access-token',
    } as NextRequest;

    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});
