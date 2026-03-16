import { describe, test, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockResolveAccessToken = vi.fn();
const mockGetDashboardMetrics = vi.fn();

vi.mock('@/lib/reservations', () => ({
  resolveAccessToken: (...args: any[]) => mockResolveAccessToken(...args),
}));

vi.mock('@/lib/control-centre/dashboard-service', () => ({
  getDashboardMetrics: (...args: any[]) => mockGetDashboardMetrics(...args),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    accessToken: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('@/lib/api-call-logger', () => ({
  loggedFetch: vi.fn(),
}));

describe('POST /api/control-centre/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  const mockMetrics = {
    rooms: {
      total: 10,
      clean: 6,
      dirty: 2,
      inspected: 1,
      outOfOrder: 1,
    },
    arrivalsToday: 3,
    departuresToday: 2,
    checkedInCount: 2,
    overdueTaskCount: 0,
  };

  describe('Input Validation', () => {
    test('returns 400 when enterpriseId is missing', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('enterpriseId is required');
    });

    test('returns 400 when body is empty object', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Token Resolution', () => {
    test('returns 404 when token cannot be resolved', async () => {
      mockResolveAccessToken.mockResolvedValue({
        token: '',
        error: 'No active access token found for enterprise test-enterprise',
      });

      const request = createMockRequest({ enterpriseId: 'test-enterprise' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('No active access token found');
    });

    test('returns 404 when token is empty string with no error message', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: '' });

      const request = createMockRequest({ enterpriseId: 'test-enterprise' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    test('calls resolveAccessToken with the correct enterpriseId', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'valid-token' });
      mockGetDashboardMetrics.mockResolvedValue(mockMetrics);

      await POST(createMockRequest({ enterpriseId: 'ent-abc-123' }));

      expect(mockResolveAccessToken).toHaveBeenCalledWith('ent-abc-123');
    });
  });

  describe('Successful response', () => {
    test('returns 200 with metrics shape when successful', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'valid-token' });
      mockGetDashboardMetrics.mockResolvedValue(mockMetrics);

      const request = createMockRequest({ enterpriseId: 'test-enterprise' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metrics).toBeDefined();
    });

    test('metrics has rooms sub-object with correct shape', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'valid-token' });
      mockGetDashboardMetrics.mockResolvedValue(mockMetrics);

      const request = createMockRequest({ enterpriseId: 'test-enterprise' });

      const response = await POST(request);
      const data = await response.json();

      expect(data.metrics.rooms).toBeDefined();
      expect(typeof data.metrics.rooms.total).toBe('number');
      expect(typeof data.metrics.rooms.clean).toBe('number');
      expect(typeof data.metrics.rooms.dirty).toBe('number');
      expect(typeof data.metrics.rooms.inspected).toBe('number');
      expect(typeof data.metrics.rooms.outOfOrder).toBe('number');
    });

    test('metrics has arrival and departure counts', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'valid-token' });
      mockGetDashboardMetrics.mockResolvedValue(mockMetrics);

      const request = createMockRequest({ enterpriseId: 'test-enterprise' });

      const response = await POST(request);
      const data = await response.json();

      expect(typeof data.metrics.arrivalsToday).toBe('number');
      expect(typeof data.metrics.departuresToday).toBe('number');
      expect(typeof data.metrics.checkedInCount).toBe('number');
      expect(typeof data.metrics.overdueTaskCount).toBe('number');
    });

    test('getDashboardMetrics is called with the resolved token', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'resolved-abc' });
      mockGetDashboardMetrics.mockResolvedValue(mockMetrics);

      await POST(createMockRequest({ enterpriseId: 'test-enterprise' }));

      expect(mockGetDashboardMetrics).toHaveBeenCalledWith('resolved-abc');
    });

    test('returns correct metrics values from service', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'valid-token' });
      mockGetDashboardMetrics.mockResolvedValue(mockMetrics);

      const request = createMockRequest({ enterpriseId: 'test-enterprise' });

      const response = await POST(request);
      const data = await response.json();

      expect(data.metrics).toEqual(mockMetrics);
    });
  });

  describe('Error Handling', () => {
    test('returns 500 on unexpected error from getDashboardMetrics', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'valid-token' });
      mockGetDashboardMetrics.mockRejectedValue(new Error('Mews API timeout'));

      const request = createMockRequest({ enterpriseId: 'test-enterprise' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Mews API timeout');
    });

    test('returns 500 with generic message for non-Error throws', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'valid-token' });
      mockGetDashboardMetrics.mockRejectedValue('string error');

      const request = createMockRequest({ enterpriseId: 'test-enterprise' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    test('returns 500 when JSON parsing throws', async () => {
      const request = {
        json: async () => { throw new Error('Invalid JSON'); },
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
