import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockResolveAccessToken = vi.fn();
const mockFetchReservations = vi.fn();
const mockCancelReservation = vi.fn();

vi.mock('@/lib/reservations', () => ({
  resolveAccessToken: (...args: any[]) => mockResolveAccessToken(...args),
  fetchReservations: (...args: any[]) => mockFetchReservations(...args),
  cancelReservation: (...args: any[]) => mockCancelReservation(...args),
}));

describe('POST /api/reservations/cancel-all', () => {
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

  describe('Input Validation', () => {
    it('should return 400 when neither enterpriseId nor accessToken is provided', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Either enterpriseId or accessToken must be provided');
    });
  });

  describe('Token Resolution', () => {
    it('should use provided accessToken directly', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'test-token' });
      mockFetchReservations.mockResolvedValue({ reservations: [] });

      const request = createMockRequest({
        accessToken: 'test-token',
      });

      await POST(request);

      expect(mockResolveAccessToken).toHaveBeenCalledWith(undefined, 'test-token');
    });

    it('should resolve token from enterpriseId', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'resolved-token' });
      mockFetchReservations.mockResolvedValue({ reservations: [] });

      const request = createMockRequest({
        enterpriseId: 'test-enterprise',
      });

      await POST(request);

      expect(mockResolveAccessToken).toHaveBeenCalledWith('test-enterprise', undefined);
    });

    it('should return 404 when enterpriseId lookup fails', async () => {
      mockResolveAccessToken.mockResolvedValue({
        token: '',
        error: 'No active access token found',
      });

      const request = createMockRequest({
        enterpriseId: 'unknown-enterprise',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No active access token found');
    });

    it('should return 401 when accessToken is provided but invalid', async () => {
      mockResolveAccessToken.mockResolvedValue({
        token: '',
        error: 'Invalid token',
      });

      const request = createMockRequest({
        accessToken: 'invalid-token',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('Reservation Fetching', () => {
    it('should fetch only Confirmed and Started reservations', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'test-token' });
      mockFetchReservations.mockResolvedValue({ reservations: [] });

      const request = createMockRequest({
        accessToken: 'test-token',
      });

      await POST(request);

      expect(mockFetchReservations).toHaveBeenCalledWith({
        accessToken: 'test-token',
        serviceId: undefined,
        states: ['Confirmed', 'Started'],
      });
    });

    it('should pass serviceId to fetch when provided', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'test-token' });
      mockFetchReservations.mockResolvedValue({ reservations: [] });

      const request = createMockRequest({
        accessToken: 'test-token',
        serviceId: 'service-123',
      });

      await POST(request);

      expect(mockFetchReservations).toHaveBeenCalledWith({
        accessToken: 'test-token',
        serviceId: 'service-123',
        states: ['Confirmed', 'Started'],
      });
    });

    it('should return 500 when fetch fails', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'test-token' });
      mockFetchReservations.mockResolvedValue({
        reservations: [],
        error: 'Failed to fetch reservations',
      });

      const request = createMockRequest({
        accessToken: 'test-token',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch reservations');
    });
  });

  describe('No Reservations', () => {
    it('should return success with zero counts when no reservations found', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'test-token' });
      mockFetchReservations.mockResolvedValue({ reservations: [] });

      const request = createMockRequest({
        accessToken: 'test-token',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        summary: {
          totalFound: 0,
          attempted: 0,
          succeeded: 0,
          failed: 0,
        },
        results: [],
      });

      // Should not attempt any cancellations
      expect(mockCancelReservation).not.toHaveBeenCalled();
    });
  });

  describe('Reservation Cancellation', () => {
    it('should cancel all reservations successfully', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'test-token' });
      mockFetchReservations.mockResolvedValue({
        reservations: [
          { Id: 'res-1', Number: 'RES001' },
          { Id: 'res-2', Number: 'RES002' },
        ],
      });
      mockCancelReservation.mockResolvedValue({ success: true });

      const request = createMockRequest({
        accessToken: 'test-token',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary).toEqual({
        totalFound: 2,
        attempted: 2,
        succeeded: 2,
        failed: 0,
      });
      expect(data.results).toHaveLength(2);
      expect(mockCancelReservation).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures gracefully', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'test-token' });
      mockFetchReservations.mockResolvedValue({
        reservations: [
          { Id: 'res-1', Number: 'RES001' },
          { Id: 'res-2', Number: 'RES002' },
          { Id: 'res-3', Number: 'RES003' },
        ],
      });

      mockCancelReservation
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: 'Already canceled' })
        .mockResolvedValueOnce({ success: true });

      const request = createMockRequest({
        accessToken: 'test-token',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false); // Overall failure due to one failure
      expect(data.summary).toEqual({
        totalFound: 3,
        attempted: 3,
        succeeded: 2,
        failed: 1,
      });
      expect(data.results).toHaveLength(3);
      expect(data.results[1]).toMatchObject({
        success: false,
        error: 'Already canceled',
      });
    });

    it('should pass cancellation options to cancelReservation', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'test-token' });
      mockFetchReservations.mockResolvedValue({
        reservations: [{ Id: 'res-1', Number: 'RES001' }],
      });
      mockCancelReservation.mockResolvedValue({ success: true });

      const request = createMockRequest({
        accessToken: 'test-token',
        postCancellationFee: true,
        sendEmail: true,
        notes: 'Test cancellation',
      });

      await POST(request);

      expect(mockCancelReservation).toHaveBeenCalledWith({
        accessToken: 'test-token',
        reservationId: 'res-1',
        postCancellationFee: true,
        sendEmail: true,
        notes: 'Test cancellation',
      });
    });

    it('should track individual reservation results correctly', async () => {
      mockResolveAccessToken.mockResolvedValue({ token: 'test-token' });
      mockFetchReservations.mockResolvedValue({
        reservations: [
          { Id: 'res-1', Number: 'RES001' },
          { Id: 'res-2', Number: 'RES002' },
        ],
      });

      mockCancelReservation
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: 'Network error' });

      const request = createMockRequest({
        accessToken: 'test-token',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results).toEqual([
        {
          reservationId: 'res-1',
          reservationNumber: 'RES001',
          success: true,
        },
        {
          reservationId: 'res-2',
          reservationNumber: 'RES002',
          success: false,
          error: 'Network error',
        },
      ]);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on unexpected error', async () => {
      mockResolveAccessToken.mockRejectedValue(new Error('Unexpected database error'));

      const request = createMockRequest({
        enterpriseId: 'test-enterprise',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle JSON parsing errors', async () => {
      const request = {
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});
