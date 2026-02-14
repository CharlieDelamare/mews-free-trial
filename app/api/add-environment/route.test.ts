import { describe, test, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockFindEnvironmentLogByEnterpriseId = vi.fn();
const mockUpdateEnvironmentLog = vi.fn();
const mockFetchReservations = vi.fn();
const mockCancelReservation = vi.fn();
const mockSendZapierNotification = vi.fn();
const mockCreateSampleCustomers = vi.fn();
const mockFetchTimezoneFromConfiguration = vi.fn();
const mockRunInBackground = vi.fn();
global.fetch = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    accessToken: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 1,
        accessToken: 'test-access-token',
        enterpriseId: 'ent-1',
        enterpriseName: 'Test Hotel',
        serviceId: 'svc-1',
        serviceName: 'Accommodation',
        receivedAt: new Date(),
      }),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  findEnvironmentLogByEnterpriseId: (...args: any[]) => mockFindEnvironmentLogByEnterpriseId(...args),
  updateEnvironmentLog: (...args: any[]) => mockUpdateEnvironmentLog(...args),
}));

vi.mock('@/lib/reservations', () => ({
  fetchReservations: (...args: any[]) => mockFetchReservations(...args),
  cancelReservation: (...args: any[]) => mockCancelReservation(...args),
}));

vi.mock('@/lib/zapier', () => ({
  sendZapierNotification: (...args: any[]) => mockSendZapierNotification(...args),
}));

vi.mock('@/lib/customer-service', () => ({
  createSampleCustomers: (...args: any[]) => mockCreateSampleCustomers(...args),
}));

vi.mock('@/lib/timezone-service', () => ({
  fetchTimezoneFromConfiguration: (...args: any[]) => mockFetchTimezoneFromConfiguration(...args),
}));

vi.mock('@/lib/background', () => ({
  runInBackground: (...args: any[]) => mockRunInBackground(...args),
}));

import { prisma } from '@/lib/prisma';

describe('POST /api/add-environment', () => {
  const createMockRequest = (body: any) => ({
    json: async () => body,
  } as NextRequest);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Reset prisma mocks to defaults
    (prisma.$queryRaw as any).mockResolvedValue([{ 1: 1 }]);
    (prisma.accessToken.findFirst as any).mockResolvedValue(null);
    (prisma.accessToken.create as any).mockResolvedValue({
      id: 1,
      accessToken: 'test-access-token',
      enterpriseId: 'ent-1',
      enterpriseName: 'Test Hotel',
      serviceId: 'svc-1',
      serviceName: 'Accommodation',
      receivedAt: new Date(),
    });

    // Default mocks
    mockFetchReservations.mockResolvedValue({ reservations: [], error: undefined });
    mockCancelReservation.mockResolvedValue({ success: true });
    mockSendZapierNotification.mockResolvedValue(undefined);
    mockCreateSampleCustomers.mockResolvedValue({
      totalCustomers: 100,
      successCount: 100,
      failureCount: 0,
    });
    mockFetchTimezoneFromConfiguration.mockResolvedValue({
      timezone: 'Europe/London',
      defaultLanguageCode: 'en-GB',
    });
    mockFindEnvironmentLogByEnterpriseId.mockResolvedValue(null);
    mockUpdateEnvironmentLog.mockResolvedValue({});

    // Mock Mews Configuration API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        NowUtc: '2024-01-15T00:00:00Z',
        Enterprise: { Id: 'ent-1', Name: 'Test Hotel' },
        Service: { Id: 'svc-1', Name: 'Accommodation' },
      }),
      text: async () => '',
    });
  });

  describe('Input Validation', () => {
    test('returns 400 when access token is missing', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    test('returns 400 when access token is not a string', async () => {
      const request = createMockRequest({ accessToken: 123 });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    test('returns 400 when access token is empty string', async () => {
      const request = createMockRequest({ accessToken: '' });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Token Validation', () => {
    test('validates access token against Mews Configuration API', async () => {
      const request = createMockRequest({ accessToken: 'test-access-token' });

      await POST(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('configuration/get'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    test('returns 400 when Mews API rejects the token', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        text: async () => 'Invalid token',
      });

      const request = createMockRequest({ accessToken: 'bad-token' });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid access token');
    });
  });

  describe('Duplicate Detection', () => {
    test('returns 409 when access token already exists', async () => {
      (prisma.accessToken.findFirst as any).mockResolvedValue({
        id: 1,
        accessToken: 'test-access-token',
      });

      const request = createMockRequest({ accessToken: 'test-access-token' });
      const response = await POST(request);

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('already been added');
    });
  });

  describe('Reservation Cancellation', () => {
    test('cancels existing reservations for the environment', async () => {
      mockFetchReservations.mockResolvedValue({
        reservations: [
          { Id: 'res-1' },
          { Id: 'res-2' },
        ],
        error: undefined,
      });

      const request = createMockRequest({ accessToken: 'test-access-token' });
      await POST(request);

      expect(mockCancelReservation).toHaveBeenCalledTimes(2);
      expect(mockCancelReservation).toHaveBeenCalledWith(
        expect.objectContaining({
          reservationId: 'res-1',
          sendEmail: false,
        })
      );
    });

    test('continues when reservation fetch fails', async () => {
      mockFetchReservations.mockResolvedValue({
        reservations: [],
        error: 'API error',
      });

      const request = createMockRequest({ accessToken: 'test-access-token' });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    test('continues when reservation cancellation throws', async () => {
      mockFetchReservations.mockResolvedValue({
        reservations: [{ Id: 'res-1' }],
        error: undefined,
      });
      mockCancelReservation.mockRejectedValue(new Error('Cancel error'));

      const request = createMockRequest({ accessToken: 'test-access-token' });
      const response = await POST(request);

      // Should still succeed despite cancellation errors
      expect(response.status).toBe(200);
    });
  });

  describe('Environment Log Matching', () => {
    test('creates customer when matching log found', async () => {
      mockFindEnvironmentLogByEnterpriseId.mockResolvedValue({
        id: 'log-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        requestorEmail: 'requestor@example.com',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'john@example.com',
        loginPassword: 'Sample123',
      });

      // Mock customer creation API
      (global.fetch as any).mockImplementation(async (url: string) => {
        if (url.includes('configuration/get')) {
          return {
            ok: true,
            json: async () => ({
              NowUtc: '2024-01-15T00:00:00Z',
              Enterprise: { Id: 'ent-1', Name: 'Test Hotel' },
            }),
          };
        }
        if (url.includes('customers/add')) {
          return {
            ok: true,
            json: async () => ({ Id: 'cust-1' }),
          };
        }
        return { ok: true, json: async () => ({}) };
      });

      const request = createMockRequest({ accessToken: 'test-access-token' });
      await POST(request);

      // Should update log status to completed
      expect(mockUpdateEnvironmentLog).toHaveBeenCalledWith(
        'ent-1',
        expect.objectContaining({
          status: 'completed',
        })
      );
    });

    test('sends manual_environment_configured notification when log found', async () => {
      mockFindEnvironmentLogByEnterpriseId.mockResolvedValue({
        id: 'log-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        requestorEmail: 'requestor@example.com',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'john@example.com',
        loginPassword: 'Sample123',
      });

      (global.fetch as any).mockImplementation(async (url: string) => {
        if (url.includes('configuration/get')) {
          return {
            ok: true,
            json: async () => ({
              NowUtc: '2024-01-15T00:00:00Z',
              Enterprise: { Id: 'ent-1', Name: 'Test Hotel' },
            }),
          };
        }
        if (url.includes('customers/add')) {
          return { ok: true, json: async () => ({ Id: 'cust-1' }) };
        }
        return { ok: true, json: async () => ({}) };
      });

      const request = createMockRequest({ accessToken: 'test-access-token' });
      await POST(request);

      expect(mockSendZapierNotification).toHaveBeenCalledWith(
        'manual_environment_configured',
        expect.objectContaining({
          status: 'success',
          propertyName: 'Test Hotel',
        })
      );
    });

    test('sends manual_environment_added notification when no log found', async () => {
      mockFindEnvironmentLogByEnterpriseId.mockResolvedValue(null);

      const request = createMockRequest({ accessToken: 'test-access-token' });
      await POST(request);

      expect(mockSendZapierNotification).toHaveBeenCalledWith(
        'manual_environment_added',
        expect.objectContaining({
          status: 'info',
          action: 'manual-addition',
        })
      );
    });
  });

  describe('Sample Customer Creation', () => {
    test('triggers sample customer creation in background', async () => {
      const request = createMockRequest({ accessToken: 'test-access-token' });
      await POST(request);

      // createSampleCustomers should be called (fire-and-forget via runInBackground)
      expect(mockCreateSampleCustomers).toHaveBeenCalledWith(
        'test-access-token',
        'ent-1',
        1,
        expect.objectContaining({ languageCode: 'en-GB' })
      );
    });
  });

  describe('Success Response', () => {
    test('returns success with environment data', async () => {
      const request = createMockRequest({ accessToken: 'test-access-token' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.enterpriseId).toBe('ent-1');
      expect(data.data.enterpriseName).toBe('Test Hotel');
      expect(data.operations.sampleCustomersCreating).toBe(true);
    });
  });

  describe('Database Connection', () => {
    test('returns 500 when database connection fails', async () => {
      (prisma.$queryRaw as any).mockRejectedValue(new Error('Connection refused'));

      const request = createMockRequest({ accessToken: 'test-access-token' });
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Database connection error');
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
  });
});
