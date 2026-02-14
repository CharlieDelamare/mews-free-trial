import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock the prisma module
const mockUnifiedLogFindMany = vi.fn();
const mockUnifiedLogCount = vi.fn();
const mockEnvironmentLogFindMany = vi.fn();
const mockCustomerCreationLogFindMany = vi.fn();
const mockReservationCreationLogFindMany = vi.fn();
const mockResetOperationLogFindMany = vi.fn();
const mockAccessTokenFindMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    unifiedLog: {
      findMany: (...args: any[]) => mockUnifiedLogFindMany(...args),
      count: (...args: any[]) => mockUnifiedLogCount(...args),
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

function createRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/logs');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

function createUnifiedLog(overrides: Record<string, any> = {}) {
  return {
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
    ...overrides,
  };
}

describe('GET /api/logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    // Default: unified log returns empty with count 0
    mockUnifiedLogFindMany.mockResolvedValue([]);
    mockUnifiedLogCount.mockResolvedValue(0);
    mockAccessTokenFindMany.mockResolvedValue([]);
    // Legacy tables (only used if unifiedLog throws)
    mockEnvironmentLogFindMany.mockResolvedValue([]);
    mockCustomerCreationLogFindMany.mockResolvedValue([]);
    mockReservationCreationLogFindMany.mockResolvedValue([]);
    mockResetOperationLogFindMany.mockResolvedValue([]);
  });

  test('returns success with logs array and pagination metadata', async () => {
    mockUnifiedLogFindMany.mockResolvedValue([createUnifiedLog()]);
    mockUnifiedLogCount
      .mockResolvedValueOnce(1)  // total count
      .mockResolvedValueOnce(0); // active count

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.logs).toHaveLength(1);
    expect(data.logs[0].propertyName).toBe('Test Hotel 1');
    expect(data.logs[0].status).toBe('completed');
    expect(data.totalCount).toBe(1);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(20);
  });

  test('returns success with empty logs array when no logs exist', async () => {
    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.logs).toHaveLength(0);
    expect(data.totalCount).toBe(0);
  });

  test('returns 500 error when database query throws', async () => {
    const error = new Error('Database connection failed');
    mockUnifiedLogFindMany.mockRejectedValue(error);
    mockUnifiedLogCount.mockRejectedValue(error);
    // The route catches unified log errors and falls through, but environmentLog also needs to throw
    mockEnvironmentLogFindMany.mockRejectedValue(error);

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch logs');
  });

  test('returns proper content-type header', async () => {
    const response = await GET(createRequest());

    expect(response.headers.get('content-type')).toContain('application/json');
  });

  test('returns hasActiveOperations: false when all logs are completed', async () => {
    mockUnifiedLogFindMany.mockResolvedValue([createUnifiedLog()]);
    mockUnifiedLogCount
      .mockResolvedValueOnce(1)  // total count
      .mockResolvedValueOnce(0); // active count

    const response = await GET(createRequest());
    const data = await response.json();
    expect(data.hasActiveOperations).toBe(false);
  });

  test('returns hasActiveOperations: true when a log is building', async () => {
    mockUnifiedLogFindMany.mockResolvedValue([createUnifiedLog({ status: 'building' })]);
    mockUnifiedLogCount
      .mockResolvedValueOnce(1)  // total count
      .mockResolvedValueOnce(1); // active count

    const response = await GET(createRequest());
    const data = await response.json();
    expect(data.hasActiveOperations).toBe(true);
  });

  test('returns hasActiveOperations: true when a log is processing', async () => {
    mockUnifiedLogFindMany.mockResolvedValue([createUnifiedLog({ status: 'processing' })]);
    mockUnifiedLogCount
      .mockResolvedValueOnce(1)  // total count
      .mockResolvedValueOnce(1); // active count

    const response = await GET(createRequest());
    const data = await response.json();
    expect(data.hasActiveOperations).toBe(true);
  });

  test('returns hasActiveOperations: false when no logs exist', async () => {
    const response = await GET(createRequest());
    const data = await response.json();
    expect(data.hasActiveOperations).toBe(false);
  });

  test('respects page and pageSize query parameters', async () => {
    mockUnifiedLogFindMany.mockResolvedValue([]);
    mockUnifiedLogCount
      .mockResolvedValueOnce(50) // total count
      .mockResolvedValueOnce(0); // active count

    const response = await GET(createRequest({ page: '3', pageSize: '10' }));
    const data = await response.json();

    expect(data.page).toBe(3);
    expect(data.pageSize).toBe(10);
    expect(data.totalCount).toBe(50);

    // Verify skip and take were passed to findMany
    expect(mockUnifiedLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, skip: 20 })
    );
  });

  test('clamps pageSize to max 100', async () => {
    mockUnifiedLogFindMany.mockResolvedValue([]);
    mockUnifiedLogCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const response = await GET(createRequest({ pageSize: '200' }));
    const data = await response.json();

    expect(data.pageSize).toBe(100);
    expect(mockUnifiedLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });

  test('defaults to page 1 and pageSize 20', async () => {
    mockUnifiedLogFindMany.mockResolvedValue([]);
    mockUnifiedLogCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    await GET(createRequest());

    expect(mockUnifiedLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20, skip: 0 })
    );
  });
});
