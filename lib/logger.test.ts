import { describe, test, expect, vi, beforeEach } from 'vitest';
import { saveEnvironmentLog, readEnvironmentLogs } from './logger';

// Mock Prisma client
const mockCreate = vi.fn();
const mockFindMany = vi.fn();

vi.mock('./prisma', () => ({
  prisma: {
    environmentLog: {
      create: (...args: any[]) => mockCreate(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
    },
  },
}));

describe('saveEnvironmentLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('saves success log with all required fields', async () => {
    const logData = {
      propertyName: 'Test Hotel',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      propertyCountry: 'United Kingdom',
      propertyType: 'hotel',
      loginUrl: 'https://app.mews-demo.com',
      loginEmail: 'john@example.com',
      loginPassword: 'Sample123',
      status: 'success' as const,
    };

    mockCreate.mockResolvedValue({
      id: '123',
      timestamp: new Date(),
      ...logData,
    });

    await saveEnvironmentLog(logData);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        propertyName: 'Test Hotel',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        propertyCountry: 'United Kingdom',
        propertyType: 'hotel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'john@example.com',
        loginPassword: 'Sample123',
        status: 'success',
        errorMessage: undefined,
      },
    });
  });

  test('saves failure log with error message', async () => {
    const logData = {
      propertyName: 'Test Hotel',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      propertyCountry: 'Germany',
      propertyType: 'hostel',
      loginUrl: 'https://app.mews-demo.com',
      loginEmail: 'jane@example.com',
      loginPassword: 'Sample123',
      status: 'failure' as const,
      errorMessage: 'API call failed: Invalid token',
    };

    mockCreate.mockResolvedValue({
      id: '456',
      timestamp: new Date(),
      ...logData,
    });

    await saveEnvironmentLog(logData);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        propertyName: 'Test Hotel',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        propertyCountry: 'Germany',
        propertyType: 'hostel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'jane@example.com',
        loginPassword: 'Sample123',
        status: 'failure',
        errorMessage: 'API call failed: Invalid token',
      },
    });
  });

  test('handles Prisma errors gracefully', async () => {
    const logData = {
      propertyName: 'Test Hotel',
      customerName: 'Bob Smith',
      customerEmail: 'bob@example.com',
      propertyCountry: 'France',
      propertyType: 'apartments',
      loginUrl: 'https://app.mews-demo.com',
      loginEmail: 'bob@example.com',
      loginPassword: 'Sample123',
      status: 'building' as const,
    };

    const dbError = new Error('Database connection failed');
    mockCreate.mockRejectedValue(dbError);

    // Should throw with wrapped error message
    await expect(saveEnvironmentLog(logData)).rejects.toThrow(
      'Database error: Failed to save environment log - Database connection failed'
    );

    expect(console.error).toHaveBeenCalledWith(
      '[LOGGER] Failed to save environment log:',
      'Database connection failed'
    );
  });

  test('logs error to console when save fails', async () => {
    const logData = {
      propertyName: 'Test Hotel',
      customerName: 'Alice Brown',
      customerEmail: 'alice@example.com',
      propertyCountry: 'Spain',
      propertyType: 'hotel',
      loginUrl: 'https://app.mews-demo.com',
      loginEmail: 'alice@example.com',
      loginPassword: 'Sample123',
      status: 'building' as const,
    };

    const error = new Error('Constraint violation');
    mockCreate.mockRejectedValue(error);

    // Function now throws, so we need to catch it
    try {
      await saveEnvironmentLog(logData);
    } catch {
      // Expected to throw
    }

    expect(console.error).toHaveBeenCalledWith(
      '[LOGGER] Failed to save environment log:',
      'Constraint violation'
    );
  });

  test('handles null error message correctly', async () => {
    const logData = {
      propertyName: 'Test Hotel',
      customerName: 'Charlie Wilson',
      customerEmail: 'charlie@example.com',
      propertyCountry: 'Italy',
      propertyType: 'hotel',
      loginUrl: 'https://app.mews-demo.com',
      loginEmail: 'charlie@example.com',
      loginPassword: 'Sample123',
      status: 'failure' as const,
      errorMessage: null,
    };

    mockCreate.mockResolvedValue({
      id: '789',
      timestamp: new Date(),
      ...logData,
    });

    await saveEnvironmentLog(logData);

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        errorMessage: null,
      }),
    });
  });
});

describe('readEnvironmentLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('returns all logs ordered by timestamp desc', async () => {
    const mockLogs = [
      {
        id: '1',
        timestamp: new Date('2024-01-03'),
        propertyName: 'Hotel C',
        customerName: 'Customer C',
        customerEmail: 'c@example.com',
        propertyCountry: 'France',
        propertyType: 'hotel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'c@example.com',
        loginPassword: 'Sample123',
        status: 'success' as const,
        errorMessage: null,
      },
      {
        id: '2',
        timestamp: new Date('2024-01-02'),
        propertyName: 'Hotel B',
        customerName: 'Customer B',
        customerEmail: 'b@example.com',
        propertyCountry: 'Germany',
        propertyType: 'hostel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'b@example.com',
        loginPassword: 'Sample123',
        status: 'failure' as const,
        errorMessage: 'Some error',
      },
      {
        id: '3',
        timestamp: new Date('2024-01-01'),
        propertyName: 'Hotel A',
        customerName: 'Customer A',
        customerEmail: 'a@example.com',
        propertyCountry: 'UK',
        propertyType: 'apartments',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'a@example.com',
        loginPassword: 'Sample123',
        status: 'success' as const,
        errorMessage: null,
      },
    ];

    mockFindMany.mockResolvedValue(mockLogs);

    const result = await readEnvironmentLogs();

    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: {
        timestamp: 'desc',
      },
    });

    expect(result).toEqual(mockLogs);
    expect(result).toHaveLength(3);
    expect(result[0].propertyName).toBe('Hotel C');
  });

  test('returns empty array when no logs exist', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await readEnvironmentLogs();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  test('returns empty array on Prisma error', async () => {
    const dbError = new Error('Database connection failed');
    mockFindMany.mockRejectedValue(dbError);

    const result = await readEnvironmentLogs();

    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      'Failed to read environment logs:',
      dbError
    );
  });

  test('logs error to console on failure', async () => {
    const error = new Error('Query timeout');
    mockFindMany.mockRejectedValue(error);

    await readEnvironmentLogs();

    expect(console.error).toHaveBeenCalledWith(
      'Failed to read environment logs:',
      error
    );
  });

  test('handles database with mixed success and failure logs', async () => {
    const mockLogs = [
      {
        id: '1',
        timestamp: new Date('2024-01-02'),
        propertyName: 'Success Hotel',
        customerName: 'Success Customer',
        customerEmail: 'success@example.com',
        propertyCountry: 'UK',
        propertyType: 'hotel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'success@example.com',
        loginPassword: 'Sample123',
        status: 'success' as const,
        errorMessage: null,
      },
      {
        id: '2',
        timestamp: new Date('2024-01-01'),
        propertyName: 'Failed Hotel',
        customerName: 'Failed Customer',
        customerEmail: 'failed@example.com',
        propertyCountry: 'Germany',
        propertyType: 'hotel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'failed@example.com',
        loginPassword: 'Sample123',
        status: 'failure' as const,
        errorMessage: 'Mews API error',
      },
    ];

    mockFindMany.mockResolvedValue(mockLogs);

    const result = await readEnvironmentLogs();

    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('success');
    expect(result[1].status).toBe('failure');
    expect(result[1].errorMessage).toBe('Mews API error');
  });
});
