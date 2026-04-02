import { describe, test, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

const mockAccessTokenFindMany = vi.fn();
const mockUnifiedLogFindMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    accessToken: {
      findMany: (...args: any[]) => mockAccessTokenFindMany(...args),
    },
    unifiedLog: {
      findMany: (...args: any[]) => mockUnifiedLogFindMany(...args),
    },
  },
}));

function makeToken(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    accessToken: 'tok-abc',
    enterpriseId: 'ent-123',
    enterpriseName: 'Hotel Test',
    serviceId: null,
    serviceName: null,
    integrationId: 'int-1',
    integrationName: 'Connector',
    createdUtc: '2024-01-01',
    receivedAt: new Date('2024-01-01'),
    isEnabled: true,
    action: 'create',
    ...overrides,
  };
}

function makeLog(overrides: Record<string, any> = {}) {
  return {
    id: 'log-1',
    logType: 'environment',
    timestamp: new Date('2024-01-01'),
    enterpriseId: 'ent-123',
    status: 'completed',
    completedAt: null,
    errorMessage: null,
    propertyName: 'Hotel Test',
    customerName: null,
    customerEmail: 'test@example.com',
    propertyCountry: null,
    propertyType: null,
    loginUrl: 'https://app.mews-demo.com/login?token=abc123',
    loginEmail: null,
    loginPassword: null,
    signInUrl: null,
    requestorEmail: null,
    durationDays: 30,
    roomCount: null,
    dormCount: null,
    apartmentCount: null,
    bedCount: null,
    timezone: null,
    salesforceAccountId: null,
    currentStep: null,
    totalSteps: null,
    accessTokenId: null,
    totalItems: null,
    successCount: null,
    failureCount: null,
    operationDetails: null,
    ...overrides,
  };
}

describe('GET /api/environments/list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockAccessTokenFindMany.mockResolvedValue([]);
    mockUnifiedLogFindMany.mockResolvedValue([]);
  });

  test('returns loginUrl when a UnifiedLog entry exists for the enterprise', async () => {
    mockAccessTokenFindMany.mockResolvedValue([makeToken()]);
    mockUnifiedLogFindMany.mockResolvedValue([makeLog()]);

    const response = await GET();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.environments).toHaveLength(1);
    expect(data.environments[0].loginUrl).toBe('https://app.mews-demo.com/login?token=abc123');
  });

  test('returns loginUrl as undefined for manual tokens with no log entry', async () => {
    mockAccessTokenFindMany.mockResolvedValue([makeToken({ enterpriseId: 'ent-manual' })]);
    mockUnifiedLogFindMany.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.environments[0].loginUrl).toBeUndefined();
  });

  test('returns success with empty array when no tokens', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.environments).toHaveLength(0);
  });

  test('returns 500 when database throws', async () => {
    mockAccessTokenFindMany.mockRejectedValue(new Error('DB error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
