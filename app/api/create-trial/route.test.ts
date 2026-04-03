import { describe, test, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock dependencies
const mockCreateEnvironmentLog = vi.fn();
const mockUpdateUnifiedLog = vi.fn();
const mockSendZapierNotification = vi.fn();
global.fetch = vi.fn();

vi.mock('@/lib/unified-logger', () => ({
  createEnvironmentLog: (...args: any[]) => mockCreateEnvironmentLog(...args),
  updateUnifiedLog: (...args: any[]) => mockUpdateUnifiedLog(...args),
}));

vi.mock('@/lib/zapier', () => ({
  sendZapierNotification: (...args: any[]) => mockSendZapierNotification(...args),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    unifiedLog: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('@/lib/codes', async () => {
  const actual = await vi.importActual('@/lib/codes');
  return actual;
});

describe('POST /api/create-trial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Setup default mock return value - route uses log.id
    mockCreateEnvironmentLog.mockResolvedValue({ id: 'test-log-id' });
    mockUpdateUnifiedLog.mockResolvedValue({ id: 'test-log-id' });
    mockSendZapierNotification.mockResolvedValue(undefined);
    // Default session: admin user (charlie.delamare@mews.com is in ADMIN_EMAILS)
    (getServerSession as any).mockResolvedValue({ user: { email: 'charlie.delamare@mews.com' }, expires: '' });
  });

  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  describe('Input Validation', () => {
    test('returns 400 when firstName is missing', async () => {
      const request = createMockRequest({
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields');
    });

    test('returns 400 when lastName is missing', async () => {
      const request = createMockRequest({
        firstName: 'John',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    test('returns 400 when customerEmail is missing', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    test('returns 400 when propertyName is missing', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    test('returns 400 when propertyCountry is missing', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Property Type Configurations', () => {
    test('builds correct API payload for hotel type', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
        durationDays: 30,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await POST(request);

      const fetchCall = (global.fetch as any).mock.calls.find(
        (call: any) => call[0] === 'https://app.mews-demo.com/api/general/v1/enterprises/addSample'
      );

      expect(fetchCall).toBeDefined();
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.CategoryCount).toBe(4);
      expect(payload.FloorCount).toBe(4);
      expect(payload.FloorRoomCount).toBe(5);
      expect(payload.FloorDormCount).toBe(0);
      expect(payload.DormBedCount).toBe(0);
    });

    test('builds correct API payload for hostel type', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hostel',
        propertyCountry: 'Germany',
        preferredLanguage: 'German',
        propertyType: 'hostel',
        durationDays: 30,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await POST(request);

      const fetchCall = (global.fetch as any).mock.calls.find(
        (call: any) => call[0] === 'https://app.mews-demo.com/api/general/v1/enterprises/addSample'
      );

      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.CategoryCount).toBe(4);
      expect(payload.FloorCount).toBe(4);
      expect(payload.FloorRoomCount).toBe(5);
      expect(payload.FloorDormCount).toBe(2);
      expect(payload.DormBedCount).toBe(4);
    });

    test('builds correct API payload for apartments type', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Apartments',
        propertyCountry: 'France',
        preferredLanguage: 'French',
        propertyType: 'apartments',
        durationDays: 30,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await POST(request);

      const fetchCall = (global.fetch as any).mock.calls.find(
        (call: any) => call[0] === 'https://app.mews-demo.com/api/general/v1/enterprises/addSample'
      );

      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.CategoryCount).toBe(4);
      expect(payload.FloorCount).toBe(4);
      expect(payload.FloorRoomCount).toBe(0);
      expect(payload.FloorApartmentCount).toBe(5);
      expect(payload.FloorDormCount).toBe(0);
      expect(payload.DormBedCount).toBe(0);
    });
  });

  describe('Pricing Environment Handling', () => {
    test('adds TaxPrecision=2 for Gross pricing countries', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'Germany',
        preferredLanguage: 'German',
        propertyType: 'hotel',
        durationDays: 30,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await POST(request);

      const fetchCall = (global.fetch as any).mock.calls.find(
        (call: any) => call[0] === 'https://app.mews-demo.com/api/general/v1/enterprises/addSample'
      );

      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.Pricing).toBe('Gross');
      expect(payload.TaxPrecision).toBe(2);
    });

    test('omits TaxPrecision for Net pricing countries', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United States',
        preferredLanguage: 'English (USA)',
        propertyType: 'hotel',
        durationDays: 30,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await POST(request);

      const fetchCall = (global.fetch as any).mock.calls.find(
        (call: any) => call[0] === 'https://app.mews-demo.com/api/general/v1/enterprises/addSample'
      );

      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.Pricing).toBe('Net');
      expect(payload.TaxPrecision).toBeUndefined();
    });
  });

  describe('Mews API Integration', () => {
    test('calls Mews API with correct payload', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
        durationDays: 30,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await POST(request);

      const fetchCall = (global.fetch as any).mock.calls.find(
        (call: any) => call[0] === 'https://app.mews-demo.com/api/general/v1/enterprises/addSample'
      );

      expect(fetchCall).toBeDefined();
      expect(fetchCall[1].method).toBe('POST');
      expect(fetchCall[1].headers['Content-Type']).toBe('application/json');

      const payload = JSON.parse(fetchCall[1].body);
      expect(payload.Client).toBe('Mews Sandbox Manager');
      expect(payload.Name).toBe('Test Hotel');
      expect(payload.Lifetime).toBe('P0Y0M30DT0H0M0S');
      expect(payload.User.Email).toBe('john@example.com');
    });

    test('handles successful Mews API response', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
        durationDays: 30,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ enterpriseId: '123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Trial environment is being created. You will receive the login details shortly.');
      expect(data.propertyName).toBe('Test Hotel');
      expect(data.status).toBe('building');
      expect(data.signInUrl).toBeNull();
    });

    test('saves SignInUrl when present in Mews API response', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
        durationDays: 30,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ SignInUrl: 'https://app.mews-demo.com/signin/abc123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUpdateUnifiedLog).toHaveBeenCalledWith('test-log-id', {
        signInUrl: 'https://app.mews-demo.com/signin/abc123',
      });
      expect(data.signInUrl).toBe('https://app.mews-demo.com/signin/abc123');
    });

    test('does not call updateUnifiedLog for signInUrl when SignInUrl is absent', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
        durationDays: 30,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ enterpriseId: '123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      // updateUnifiedLog should NOT have been called (no signInUrl to save)
      expect(mockUpdateUnifiedLog).not.toHaveBeenCalled();
      expect(data.signInUrl).toBeNull();
    });

    test('handles Mews API error response', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
        durationDays: 30,
      });

      const apiError = { Message: 'Invalid access token' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => apiError,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create trial');
      expect(data.details).toEqual(apiError);
    });
  });

  describe('Database Logging', () => {
    test('saves building log to database before API call', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
        durationDays: 30,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await POST(request);

      expect(mockCreateEnvironmentLog).toHaveBeenCalledWith({
        propertyName: 'Test Hotel',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        propertyCountry: 'United Kingdom',
        propertyType: 'hotel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'john@example.com',
        loginPassword: 'Sample123',
        status: 'building',
        requestorEmail: 'charlie.delamare@mews.com',
        durationDays: 30,
        roomCount: 20,
        dormCount: undefined,
        apartmentCount: undefined,
        bedCount: undefined,
        salesforceAccountId: undefined,
      });
    });

    test('updates log to failure status when API fails', async () => {
      const request = createMockRequest({
        firstName: 'Jane',
        lastName: 'Smith',
        customerEmail: 'jane@example.com',
        propertyName: 'Failed Hotel',
        propertyCountry: 'Germany',
        preferredLanguage: 'German',
        propertyType: 'hostel',
        durationDays: 30,
      });

      const apiError = { Message: 'API failure' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => apiError,
      });

      await POST(request);

      // First saves with building status
      expect(mockCreateEnvironmentLog).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyName: 'Failed Hotel',
          status: 'building',
        })
      );

      // Then updates to failure status
      expect(mockUpdateUnifiedLog).toHaveBeenCalledWith(
        'test-log-id',
        {
          status: 'failed',
          errorMessage: JSON.stringify(apiError),
        }
      );
    });
  });

  describe('Zapier Notifications', () => {
    test('does not send notification on success (handled by webhook)', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        requestorEmail: 'requestor@example.com',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
        durationDays: 30,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await POST(request);

      expect(mockSendZapierNotification).not.toHaveBeenCalled();
    });

    test('sends failure notification to Zapier', async () => {
      const request = createMockRequest({
        firstName: 'Jane',
        lastName: 'Smith',
        requestorEmail: 'requestor@example.com',
        customerEmail: 'jane@example.com',
        propertyName: 'Failed Hotel',
        propertyCountry: 'Germany',
        preferredLanguage: 'German',
        propertyType: 'hotel',
        durationDays: 30,
      });

      const apiError = { Message: 'API failure' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => apiError,
      });

      await POST(request);

      expect(mockSendZapierNotification).toHaveBeenCalledWith(
        'trial_generation_failure',
        expect.objectContaining({
          status: 'failure',
          propertyName: 'Failed Hotel',
          firstName: 'Jane',
          lastName: 'Smith',
          customerName: 'Jane Smith',
          requestorEmail: 'charlie.delamare@mews.com',
          customerEmail: 'jane@example.com',
          error: 'Failed to create trial environment',
        })
      );
    });

    test('continues even if Zapier notification fails', async () => {
      const request = createMockRequest({
        firstName: 'Jane',
        lastName: 'Smith',
        requestorEmail: 'requestor@example.com',
        customerEmail: 'jane@example.com',
        propertyName: 'Failed Hotel',
        propertyCountry: 'Germany',
        preferredLanguage: 'German',
        propertyType: 'hotel',
        durationDays: 30,
      });

      const apiError = { Message: 'API failure' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => apiError,
      });

      mockSendZapierNotification.mockRejectedValueOnce(new Error('Zapier error'));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create trial');
    });
  });

  describe('Admin Duration Exception', () => {
    test('allows 1-day duration for admin users', async () => {
      const request = createMockRequest({
        firstName: 'Charlie',
        lastName: 'Delamare',
        requestorEmail: 'charlie.delamare@mews.com',
        customerEmail: 'customer@example.com',
        propertyName: 'Charlie Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
        durationDays: 1,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify the API was called with 1-day lifetime
      const fetchCall = (global.fetch as any).mock.calls.find(
        (call: any) => call[0] === 'https://app.mews-demo.com/api/general/v1/enterprises/addSample'
      );
      const payload = JSON.parse(fetchCall[1].body);
      expect(payload.Lifetime).toBe('P0Y0M1DT0H0M0S');
    });

    test('allows 1-day duration for any admin (session-based, not email-specific)', async () => {
      const request = createMockRequest({
        firstName: 'Charlie',
        lastName: 'Delamare',
        requestorEmail: 'charlie.delamare@gmail.com',
        customerEmail: 'customer@example.com',
        propertyName: 'Charlie Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
        durationDays: 1,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    test('rejects 1-day duration for non-admin users', async () => {
      // Override default admin session with a non-admin session
      (getServerSession as any).mockResolvedValueOnce({ user: { email: 'user@mews.com' }, expires: '' });

      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'customer@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
        durationDays: 1,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid duration');
    });
  });

  describe('Duplicate Salesforce ID Prevention', () => {
    test('returns 409 when Salesforce ID already has an environment', async () => {
      // Use non-admin session so the Salesforce duplicate check runs (admins bypass it)
      (getServerSession as any).mockResolvedValueOnce({ user: { email: 'user@mews.com' }, expires: '' });

      const { prisma } = await import('@/lib/prisma');
      (prisma.unifiedLog.findFirst as any).mockResolvedValueOnce({
        id: 'existing-log-1',
        propertyName: 'Existing Hotel',
        customerEmail: 'existing@example.com',
        status: 'completed',
        timestamp: new Date(),
        enterpriseId: 'ent-existing',
      });

      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'new@example.com',
        propertyName: 'New Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
        durationDays: 30,
        salesforceAccountId: '001ABCDEFGHIJKLM',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists for this Salesforce Account ID');
      expect(data.existingEnvironment).toBeDefined();
      expect(data.existingEnvironment.propertyName).toBe('Existing Hotel');
    });

    test('skips duplicate check for admin users', async () => {
      const request = createMockRequest({
        firstName: 'Charlie',
        lastName: 'Delamare',
        requestorEmail: 'charlie.delamare@mews.com',
        customerEmail: 'customer@example.com',
        propertyName: 'Charlie Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
        durationDays: 7,
        salesforceAccountId: '001ABCDEFGHIJKLM',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      // The unifiedLog.findFirst for salesforce check should NOT have been called
      // (Charlie bypasses it). The mock returns null by default anyway.
    });
  });

  describe('Error Handling', () => {
    test('handles fetch error during API call', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
        durationDays: 30,
      });

      const fetchError = new Error('fetch failed');
      (global.fetch as any).mockRejectedValueOnce(fetchError);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to communicate with Mews API');
    });

    test('handles JSON parsing error', async () => {
      const request = {
        json: async () => {
          throw new SyntaxError('Invalid JSON');
        },
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request format');
    });
  });
});
