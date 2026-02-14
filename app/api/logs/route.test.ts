import { describe, test, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock the prisma module
const mockUnifiedLogFindMany = vi.fn();
const mockEnvironmentLogFindMany = vi.fn();
const mockCustomerCreationLogFindMany = vi.fn();
const mockReservationCreationLogFindMany = vi.fn();
const mockResetOperationLogFindMany = vi.fn();
const mockAccessTokenFindMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    unifiedLog: {
      findMany: (...args: any[]) => mockUnifiedLogFindMany(...args),
    },
    environmentLog: {
      findMany: (...args: any[]) => mockEnvironmentLogFindMany(...args),
    },
    customerCreationLog: {
      findMany: (...args: any[]) => mockCustomerCreationLogFindMany(...args),
    },
    reservationCreationLog: {
      findMany: (...args: any[]) => mockReservationCreationLogFindMany(...args),
    },
    resetOperationLog: {
      findMany: (...args: any[]) => mockResetOperationLogFindMany(...args),
    },
    accessToken: {
      findMany: (...args: any[]) => mockAccessTokenFindMany(...args),
    },
  },
}));

describe('GET /api/logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    // Default: all tables return empty
    mockUnifiedLogFindMany.mockResolvedValue([]);
    mockEnvironmentLogFindMany.mockResolvedValue([]);
    mockCustomerCreationLogFindMany.mockResolvedValue([]);
    mockReservationCreationLogFindMany.mockResolvedValue([]);
    mockResetOperationLogFindMany.mockResolvedValue([]);
    mockAccessTokenFindMany.mockResolvedValue([]);
  });

  test('returns success with logs array', async () => {
    mockUnifiedLogFindMany.mockResolvedValue([
      {
        id: '1',
        logType: 'environment',
        timestamp: new Date('2024-01-03'),
        enterpriseId: 'e1',
        status: 'completed',
        completedAt: null,
        errorMessage: null,
        propertyName: 'Test Hotel 1',
        customerName: 'Customer 1',
        customerEmail: 'customer1@example.com',
        propertyCountry: 'United Kingdom',
        propertyType: 'hotel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'customer1@example.com',
        loginPassword: 'Sample123',
        requestorEmail: null,
        durationDays: 30,
        salesforceAccountId: null,
        operationDetails: null,
        currentStep: null,
        totalSteps: null,
        totalItems: null,
        successCount: null,
        failureCount: null,
      },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.logs).toHaveLength(1);
    expect(data.logs[0].propertyName).toBe('Test Hotel 1');
    expect(data.logs[0].status).toBe('completed');
  });

  test('returns success with empty logs array when no logs exist', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.logs).toHaveLength(0);
  });

  test('returns 500 error when database query throws', async () => {
    const error = new Error('Database connection failed');
    mockUnifiedLogFindMany.mockRejectedValue(error);
    // The route catches unified log errors and falls through, but environmentLog also needs to throw
    mockEnvironmentLogFindMany.mockRejectedValue(error);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch logs');
  });

  test('returns proper content-type header', async () => {
    const response = await GET();

    expect(response.headers.get('content-type')).toContain('application/json');
  });

  test('returns hasActiveOperations: false when all logs are completed', async () => {
    mockUnifiedLogFindMany.mockResolvedValue([
      {
        id: '1',
        logType: 'environment',
        timestamp: new Date('2024-01-03'),
        enterpriseId: 'e1',
        status: 'completed',
        completedAt: null,
        errorMessage: null,
        propertyName: 'Test Hotel',
        customerName: 'Customer 1',
        customerEmail: 'c@example.com',
        propertyCountry: 'United Kingdom',
        propertyType: 'hotel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'c@example.com',
        loginPassword: 'Sample123',
        requestorEmail: null,
        durationDays: 30,
        salesforceAccountId: null,
        operationDetails: null,
        currentStep: null,
        totalSteps: null,
        totalItems: null,
        successCount: null,
        failureCount: null,
      },
    ]);

    const response = await GET();
    const data = await response.json();
    expect(data.hasActiveOperations).toBe(false);
  });

  test('returns hasActiveOperations: true when a log is building', async () => {
    mockUnifiedLogFindMany.mockResolvedValue([
      {
        id: '1',
        logType: 'environment',
        timestamp: new Date('2024-01-03'),
        enterpriseId: 'e1',
        status: 'building',
        completedAt: null,
        errorMessage: null,
        propertyName: 'Test Hotel',
        customerName: 'Customer 1',
        customerEmail: 'c@example.com',
        propertyCountry: 'United Kingdom',
        propertyType: 'hotel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'c@example.com',
        loginPassword: 'Sample123',
        requestorEmail: null,
        durationDays: 30,
        salesforceAccountId: null,
        operationDetails: null,
        currentStep: null,
        totalSteps: null,
        totalItems: null,
        successCount: null,
        failureCount: null,
      },
    ]);

    const response = await GET();
    const data = await response.json();
    expect(data.hasActiveOperations).toBe(true);
  });

  test('returns hasActiveOperations: true when a log is processing', async () => {
    mockUnifiedLogFindMany.mockResolvedValue([
      {
        id: '1',
        logType: 'environment',
        timestamp: new Date('2024-01-03'),
        enterpriseId: 'e1',
        status: 'processing',
        completedAt: null,
        errorMessage: null,
        propertyName: 'Test Hotel',
        customerName: 'Customer 1',
        customerEmail: 'c@example.com',
        propertyCountry: 'United Kingdom',
        propertyType: 'hotel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'c@example.com',
        loginPassword: 'Sample123',
        requestorEmail: null,
        durationDays: 30,
        salesforceAccountId: null,
        operationDetails: null,
        currentStep: null,
        totalSteps: null,
        totalItems: null,
        successCount: null,
        failureCount: null,
      },
    ]);

    const response = await GET();
    const data = await response.json();
    expect(data.hasActiveOperations).toBe(true);
  });

  test('returns hasActiveOperations: false when no logs exist', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.hasActiveOperations).toBe(false);
  });
});
