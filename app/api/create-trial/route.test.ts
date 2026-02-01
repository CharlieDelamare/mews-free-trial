import { describe, test, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockSaveEnvironmentLog = vi.fn();
global.fetch = vi.fn();

vi.mock('@/lib/logger', () => ({
  saveEnvironmentLog: (...args: any[]) => mockSaveEnvironmentLog(...args),
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
        propertyCountry: 'Germany', // Gross pricing
        preferredLanguage: 'German',
        propertyType: 'hotel',
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
        propertyCountry: 'United States', // Net pricing
        preferredLanguage: 'English (USA)',
        propertyType: 'hotel',
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
      expect(payload.Client).toBe('Free Trial Generator');
      expect(payload.AccessToken).toBe('test-sample-token');
      expect(payload.Name).toBe('Test Hotel');
      expect(payload.Lifetime).toBe('P0Y0M45DT0H0M0S');
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
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ enterpriseId: '123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Trial created successfully! Check your email for login details.');
      expect(data.propertyName).toBe('Test Hotel');
      expect(data.loginUrl).toBe('https://app.mews-demo.com');
      expect(data.loginEmail).toBe('john@example.com');
      expect(data.defaultPassword).toBe('Sample123');
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
    test('saves success log to database', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await POST(request);

      expect(mockSaveEnvironmentLog).toHaveBeenCalledWith({
        propertyName: 'Test Hotel',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        propertyCountry: 'United Kingdom',
        propertyType: 'hotel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'john@example.com',
        loginPassword: 'Sample123',
        status: 'success',
      });
    });

    test('saves failure log with error message to database', async () => {
      const request = createMockRequest({
        firstName: 'Jane',
        lastName: 'Smith',
        customerEmail: 'jane@example.com',
        propertyName: 'Failed Hotel',
        propertyCountry: 'Germany',
        preferredLanguage: 'German',
        propertyType: 'hostel',
      });

      const apiError = { Message: 'API failure' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => apiError,
      });

      await POST(request);

      expect(mockSaveEnvironmentLog).toHaveBeenCalledWith({
        propertyName: 'Failed Hotel',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        propertyCountry: 'Germany',
        propertyType: 'hostel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'jane@example.com',
        loginPassword: 'Sample123',
        status: 'failure',
        errorMessage: JSON.stringify(apiError),
      });
    });
  });

  describe('Slack Notifications', () => {
    test('sends success notification to Slack', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        requestorEmail: 'requestor@example.com',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
      });

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true }),
        });

      await POST(request);

      const slackCall = (global.fetch as any).mock.calls.find(
        (call: any) => call[0] === 'https://slack.com/api/chat.postMessage'
      );

      expect(slackCall).toBeDefined();
      expect(slackCall[1].method).toBe('POST');
      expect(slackCall[1].headers.Authorization).toBe('Bearer test-slack-token');

      const payload = JSON.parse(slackCall[1].body);
      expect(payload.channel).toBe('test-channel-id');
      expect(payload.blocks[0].text.text).toContain('New Trial Generated');
    });

    test('sends failure notification to Slack', async () => {
      const request = createMockRequest({
        firstName: 'Jane',
        lastName: 'Smith',
        requestorEmail: 'requestor@example.com',
        customerEmail: 'jane@example.com',
        propertyName: 'Failed Hotel',
        propertyCountry: 'Germany',
        preferredLanguage: 'German',
        propertyType: 'hotel',
      });

      const apiError = { Message: 'API failure' };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => apiError,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true }),
        });

      await POST(request);

      const slackCall = (global.fetch as any).mock.calls.find(
        (call: any) => call[0] === 'https://slack.com/api/chat.postMessage'
      );

      expect(slackCall).toBeDefined();
      const payload = JSON.parse(slackCall[1].body);
      expect(payload.blocks[0].text.text).toContain('Trial Generation Failed');
    });

    test('skips Slack notification when not configured', async () => {
      const originalSlackToken = process.env.SLACK_BOT_TOKEN;
      const originalChannelId = process.env.SLACK_CHANNEL_ID;

      delete process.env.SLACK_BOT_TOKEN;
      delete process.env.SLACK_CHANNEL_ID;

      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await POST(request);

      const slackCall = (global.fetch as any).mock.calls.find(
        (call: any) => call[0] === 'https://slack.com/api/chat.postMessage'
      );

      expect(slackCall).toBeUndefined();
      expect(console.log).toHaveBeenCalledWith('Slack API not configured, skipping notification');

      // Restore environment variables
      process.env.SLACK_BOT_TOKEN = originalSlackToken;
      process.env.SLACK_CHANNEL_ID = originalChannelId;
    });
  });

  describe('Error Handling', () => {
    test('handles internal server error', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: 'john@example.com',
        propertyName: 'Test Hotel',
        propertyCountry: 'United Kingdom',
        preferredLanguage: 'English (UK)',
        propertyType: 'hotel',
      });

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    test('handles JSON parsing error', async () => {
      const request = {
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
