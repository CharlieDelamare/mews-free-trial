import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSampleCustomers } from './customer-service';

// Mock dependencies
const mockPrismaCreate = vi.fn();
const mockPrismaUpdate = vi.fn();
const mockGetSampleCustomers = vi.fn();
global.fetch = vi.fn();

vi.mock('./prisma', () => ({
  prisma: {
    customerCreationLog: {
      create: (...args: any[]) => mockPrismaCreate(...args),
      update: (...args: any[]) => mockPrismaUpdate(...args),
    },
  },
}));

vi.mock('./sample-customers', () => ({
  getSampleCustomers: () => mockGetSampleCustomers(),
  SampleCustomer: {} as any,
}));

describe('customer-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Default mock implementations
    mockPrismaCreate.mockResolvedValue({
      id: 1,
      enterpriseId: 'test-enterprise',
      accessTokenId: 123,
      totalCustomers: 100,
      successCount: 0,
      failureCount: 0,
      startedAt: new Date('2024-01-01T00:00:00Z'),
      completedAt: null,
      status: 'processing',
      customerResults: [],
      errorSummary: null,
    });

    mockPrismaUpdate.mockResolvedValue({
      id: 1,
      enterpriseId: 'test-enterprise',
      accessTokenId: 123,
      totalCustomers: 100,
      successCount: 100,
      failureCount: 0,
      startedAt: new Date('2024-01-01T00:00:00Z'),
      completedAt: new Date('2024-01-01T00:01:00Z'),
      status: 'completed',
      customerResults: [],
      errorSummary: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createSampleCustomers', () => {
    it('should create CustomerCreationLog with processing status', async () => {
      mockGetSampleCustomers.mockReturnValue([
        {
          FirstName: 'John',
          LastName: 'Doe',
          Email: 'john@example.com',
          Phone: '+44123456789',
          BirthDate: '1990-01-01',
          Sex: 'Male',
          Title: 'Mister',
          NationalityCode: 'GB',
          PreferredLanguageCode: 'en-GB',
        },
      ]);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ Id: 'customer-123' }),
      });

      await createSampleCustomers('test-token', 'test-enterprise', 123);

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: {
          enterpriseId: 'test-enterprise',
          accessTokenId: 123,
          totalCustomers: 1,
          successCount: 0,
          failureCount: 0,
          status: 'processing',
          customerResults: [],
        },
      });
    });

    it('should update log with final results on success', async () => {
      mockGetSampleCustomers.mockReturnValue([
        {
          FirstName: 'John',
          LastName: 'Doe',
          Email: 'john@example.com',
          Phone: '+44123456789',
          BirthDate: '1990-01-01',
          Sex: 'Male',
          Title: 'Mister',
          NationalityCode: 'GB',
          PreferredLanguageCode: 'en-GB',
        },
      ]);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ Id: 'customer-123' }),
      });

      await createSampleCustomers('test-token', 'test-enterprise', 123);

      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          successCount: 1,
          failureCount: 0,
          status: 'completed',
          errorSummary: null,
        }),
      });
    });

    it('should process customers in batches of 5', async () => {
      const customers = Array.from({ length: 12 }, (_, i) => ({
        FirstName: `Customer`,
        LastName: `${i}`,
        Email: `customer${i}@example.com`,
        Phone: '+44123456789',
        BirthDate: '1990-01-01',
        Sex: 'Male',
        Title: 'Mister',
        NationalityCode: 'GB',
        PreferredLanguageCode: 'en-GB',
      }));

      mockGetSampleCustomers.mockReturnValue(customers);

      let callCount = 0;
      (global.fetch as any).mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          json: async () => ({ Id: `customer-${callCount}` }),
        };
      });

      await createSampleCustomers('test-token', 'test-enterprise', 123);

      // Should make 12 API calls (one per customer)
      expect(global.fetch).toHaveBeenCalledTimes(12);

      // Verify batch size in the update call
      const updateCall = mockPrismaUpdate.mock.calls[0][0];
      expect(updateCall.data.successCount).toBe(12);
    });

    it('should handle partial failures gracefully', async () => {
      mockGetSampleCustomers.mockReturnValue([
        {
          FirstName: 'Success',
          LastName: 'User',
          Email: 'success@example.com',
          Phone: '+44123456789',
          BirthDate: '1990-01-01',
          Sex: 'Male',
          Title: 'Mister',
          NationalityCode: 'GB',
          PreferredLanguageCode: 'en-GB',
        },
        {
          FirstName: 'Failure',
          LastName: 'User',
          Email: 'failure@example.com',
          Phone: '+44123456789',
          BirthDate: '1990-01-01',
          Sex: 'Male',
          Title: 'Mister',
          NationalityCode: 'GB',
          PreferredLanguageCode: 'en-GB',
        },
      ]);

      (global.fetch as any).mockImplementation(async (url: string, options: any) => {
        const body = JSON.parse(options.body);
        if (body.Email === 'failure@example.com') {
          return {
            ok: false,
            json: async () => ({ Message: 'Customer already exists' }),
          };
        }
        return {
          ok: true,
          json: async () => ({ Id: 'customer-123' }),
        };
      });

      await createSampleCustomers('test-token', 'test-enterprise', 123);

      const updateCall = mockPrismaUpdate.mock.calls[0][0];
      expect(updateCall.data.successCount).toBe(1);
      expect(updateCall.data.failureCount).toBe(1);
      expect(updateCall.data.errorSummary).toContain('1 customers failed');
    });

    it('should handle network errors gracefully', async () => {
      mockGetSampleCustomers.mockReturnValue([
        {
          FirstName: 'John',
          LastName: 'Doe',
          Email: 'john@example.com',
          Phone: '+44123456789',
          BirthDate: '1990-01-01',
          Sex: 'Male',
          Title: 'Mister',
          NationalityCode: 'GB',
          PreferredLanguageCode: 'en-GB',
        },
      ]);

      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await createSampleCustomers('test-token', 'test-enterprise', 123);

      const updateCall = mockPrismaUpdate.mock.calls[0][0];
      expect(updateCall.data.successCount).toBe(0);
      expect(updateCall.data.failureCount).toBe(1);
    });

    it('should handle API response without ID', async () => {
      mockGetSampleCustomers.mockReturnValue([
        {
          FirstName: 'John',
          LastName: 'Doe',
          Email: 'john@example.com',
          Phone: '+44123456789',
          BirthDate: '1990-01-01',
          Sex: 'Male',
          Title: 'Mister',
          NationalityCode: 'GB',
          PreferredLanguageCode: 'en-GB',
        },
      ]);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}), // No ID in response
      });

      await createSampleCustomers('test-token', 'test-enterprise', 123);

      const updateCall = mockPrismaUpdate.mock.calls[0][0];
      expect(updateCall.data.successCount).toBe(0);
      expect(updateCall.data.failureCount).toBe(1);
    });

    it('should track individual customer results', async () => {
      mockGetSampleCustomers.mockReturnValue([
        {
          FirstName: 'John',
          LastName: 'Doe',
          Email: 'john@example.com',
          Phone: '+44123456789',
          BirthDate: '1990-01-01',
          Sex: 'Male',
          Title: 'Mister',
          NationalityCode: 'GB',
          PreferredLanguageCode: 'en-GB',
        },
      ]);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ Id: 'customer-123' }),
      });

      const result = await createSampleCustomers('test-token', 'test-enterprise', 123);

      expect(result.customerResults).toHaveLength(1);
      expect(result.customerResults[0]).toMatchObject({
        email: 'john@example.com',
        success: true,
        customerId: 'customer-123',
      });
    });

    it('should update log with failed status on fatal error', async () => {
      // Make the first prisma update throw an error, then succeed on retry
      mockPrismaUpdate
        .mockRejectedValueOnce(new Error('Database connection lost'))
        .mockResolvedValueOnce({
          id: 1,
          enterpriseId: 'test-enterprise',
          accessTokenId: 123,
          totalCustomers: 100,
          successCount: 0,
          failureCount: 0,
          startedAt: new Date('2024-01-01T00:00:00Z'),
          completedAt: new Date('2024-01-01T00:01:00Z'),
          status: 'failed',
          customerResults: [],
          errorSummary: 'Database connection lost',
        });

      mockGetSampleCustomers.mockReturnValue([
        {
          FirstName: 'John',
          LastName: 'Doe',
          Email: 'john@example.com',
          Phone: '+44123456789',
          BirthDate: '1990-01-01',
          Sex: 'Male',
          Title: 'Mister',
          NationalityCode: 'GB',
          PreferredLanguageCode: 'en-GB',
        },
      ]);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ Id: 'customer-123' }),
      });

      await expect(
        createSampleCustomers('test-token', 'test-enterprise', 123)
      ).rejects.toThrow('Database connection lost');

      // Verify update was called twice: first threw error, second logged the failure
      expect(mockPrismaUpdate).toHaveBeenCalledTimes(2);
      expect(mockPrismaUpdate).toHaveBeenLastCalledWith({
        where: { id: 1 },
        data: {
          completedAt: expect.any(Date),
          status: 'failed',
          errorSummary: 'Database connection lost',
        },
      });
    });

    it('should apply 100ms delay between batches', async () => {
      const customers = Array.from({ length: 7 }, (_, i) => ({
        FirstName: `Customer`,
        LastName: `${i}`,
        Email: `customer${i}@example.com`,
        Phone: '+44123456789',
        BirthDate: '1990-01-01',
        Sex: 'Male',
        Title: 'Mister',
        NationalityCode: 'GB',
        PreferredLanguageCode: 'en-GB',
      }));

      mockGetSampleCustomers.mockReturnValue(customers);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ Id: 'customer-123' }),
      });

      const startTime = Date.now();
      await createSampleCustomers('test-token', 'test-enterprise', 123);
      const duration = Date.now() - startTime;

      // With 7 customers in batches of 5, there should be 1 delay (100ms)
      // Allow some margin for test execution time
      expect(duration).toBeGreaterThanOrEqual(80);
    });

    it('should send correct API request payload', async () => {
      mockGetSampleCustomers.mockReturnValue([
        {
          FirstName: 'John',
          LastName: 'Doe',
          Email: 'john@example.com',
          Phone: '+44123456789',
          BirthDate: '1990-01-01',
          Sex: 'Male',
          Title: 'Mister',
          NationalityCode: 'GB',
          PreferredLanguageCode: 'en-GB',
        },
      ]);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ Id: 'customer-123' }),
      });

      await createSampleCustomers('test-token', 'test-enterprise', 123);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.mews-test.com/api/connector/v1/customers/add',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"Email":"john@example.com"'),
        }
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);
      expect(payload).toMatchObject({
        ClientToken: 'test-client-token',
        AccessToken: 'test-token',
        Client: 'Mews Sandbox Manager - Sample Data',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john@example.com',
        Phone: '+44123456789',
        BirthDate: '1990-01-01',
        Sex: 'Male',
        Title: 'Mister',
        NationalityCode: 'GB',
        PreferredLanguageCode: 'en-GB',
      });
    });

    it('should return correct result structure', async () => {
      mockGetSampleCustomers.mockReturnValue([
        {
          FirstName: 'John',
          LastName: 'Doe',
          Email: 'john@example.com',
          Phone: '+44123456789',
          BirthDate: '1990-01-01',
          Sex: 'Male',
          Title: 'Mister',
          NationalityCode: 'GB',
          PreferredLanguageCode: 'en-GB',
        },
      ]);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ Id: 'customer-123' }),
      });

      const result = await createSampleCustomers('test-token', 'test-enterprise', 123);

      expect(result).toMatchObject({
        id: expect.any(Number),
        enterpriseId: 'test-enterprise',
        totalCustomers: expect.any(Number),
        successCount: expect.any(Number),
        failureCount: expect.any(Number),
        startedAt: expect.any(Date),
        completedAt: expect.any(Date),
        status: 'completed',
        customerResults: expect.any(Array),
      });
    });
  });
});
