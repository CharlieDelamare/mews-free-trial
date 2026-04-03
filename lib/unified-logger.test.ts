import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  createEnvironmentLog,
  createResetLog,
  createDemoFillerLog,
  updateUnifiedLog,
  updateEnvironmentCustomerStats,
  updateEnvironmentReservationStats,
  findEnvironmentLogByPropertyName,
  findEnvironmentLogByEnterpriseId,
  getUnifiedLogs,
  countUnifiedLogs,
} from './unified-logger';

vi.mock('./prisma', () => ({
  prisma: {
    unifiedLog: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    accessToken: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from './prisma';

describe('createEnvironmentLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('creates a unified log with environment type', async () => {
    const mockLog = { id: 'log-1', logType: 'environment', status: 'building' };
    (prisma.unifiedLog.create as any).mockResolvedValue(mockLog);

    const result = await createEnvironmentLog({
      propertyName: 'Test Hotel',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      propertyCountry: 'United Kingdom',
      propertyType: 'hotel',
      loginUrl: 'https://app.mews-demo.com',
      loginEmail: 'john@example.com',
      loginPassword: 'Sample123',
      status: 'building',
      durationDays: 30,
    });

    expect(prisma.unifiedLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        logType: 'environment',
        status: 'building',
        propertyName: 'Test Hotel',
        durationDays: 30,
      }),
    });
    expect(result).toEqual(mockLog);
  });

  test('throws descriptive error on database failure', async () => {
    (prisma.unifiedLog.create as any).mockRejectedValue(new Error('Connection refused'));

    await expect(
      createEnvironmentLog({
        propertyName: 'Test',
        customerName: 'Test',
        customerEmail: 'test@test.com',
        propertyCountry: 'UK',
        propertyType: 'hotel',
        loginUrl: 'url',
        loginEmail: 'email',
        loginPassword: 'pass',
        status: 'building',
      })
    ).rejects.toThrow('Database error: Failed to create environment log');
  });
});

describe('createResetLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('creates a unified log with reset type', async () => {
    const mockLog = { id: 'log-2', logType: 'reset', status: 'processing' };
    (prisma.unifiedLog.create as any).mockResolvedValue(mockLog);

    const result = await createResetLog({
      enterpriseId: 'ent-1',
      accessTokenId: 1,
      totalSteps: 7,
    });

    expect(prisma.unifiedLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        logType: 'reset',
        status: 'processing',
        enterpriseId: 'ent-1',
        totalSteps: 7,
      }),
    });
    expect(result).toEqual(mockLog);
  });
});

describe('createDemoFillerLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('creates a unified log with demo_filler type', async () => {
    const mockLog = { id: 'log-3', logType: 'demo_filler', status: 'processing' };
    (prisma.unifiedLog.create as any).mockResolvedValue(mockLog);

    const result = await createDemoFillerLog({
      enterpriseId: 'ent-1',
      accessTokenId: 1,
      totalItems: 50,
    });

    expect(prisma.unifiedLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        logType: 'demo_filler',
        status: 'processing',
        totalItems: 50,
      }),
    });
    expect(result).toEqual(mockLog);
  });
});

describe('updateUnifiedLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('updates log by ID with provided fields', async () => {
    const mockUpdated = { id: 'log-1', status: 'completed' };
    (prisma.unifiedLog.update as any).mockResolvedValue(mockUpdated);

    const result = await updateUnifiedLog('log-1', {
      status: 'completed',
      enterpriseId: 'ent-1',
    });

    expect(prisma.unifiedLog.update).toHaveBeenCalledWith({
      where: { id: 'log-1' },
      data: { status: 'completed', enterpriseId: 'ent-1' },
    });
    expect(result).toEqual(mockUpdated);
  });

  test('throws on database error', async () => {
    (prisma.unifiedLog.update as any).mockRejectedValue(new Error('Not found'));

    await expect(
      updateUnifiedLog('nonexistent', { status: 'completed' })
    ).rejects.toThrow('Database error: Failed to update unified log');
  });
});

describe('updateEnvironmentCustomerStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('merges customer stats into operationDetails', async () => {
    (prisma.unifiedLog.findUnique as any).mockResolvedValue({
      operationDetails: { reservations: { status: 'completed', total: 10 } },
    });
    (prisma.unifiedLog.update as any).mockResolvedValue({});

    await updateEnvironmentCustomerStats('log-1', {
      status: 'completed',
      total: 100,
      success: 95,
      failed: 5,
    });

    expect(prisma.unifiedLog.update).toHaveBeenCalledWith({
      where: { id: 'log-1' },
      data: {
        operationDetails: {
          reservations: { status: 'completed', total: 10 },
          customers: { status: 'completed', total: 100, success: 95, failed: 5 },
        },
      },
    });
  });

  test('handles null operationDetails', async () => {
    (prisma.unifiedLog.findUnique as any).mockResolvedValue({
      operationDetails: null,
    });
    (prisma.unifiedLog.update as any).mockResolvedValue({});

    await updateEnvironmentCustomerStats('log-1', {
      status: 'processing',
      total: 100,
      success: 0,
      failed: 0,
    });

    expect(prisma.unifiedLog.update).toHaveBeenCalledWith({
      where: { id: 'log-1' },
      data: {
        operationDetails: {
          customers: { status: 'processing', total: 100, success: 0, failed: 0 },
        },
      },
    });
  });
});

describe('updateEnvironmentReservationStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('merges reservation stats into operationDetails', async () => {
    (prisma.unifiedLog.findUnique as any).mockResolvedValue({
      operationDetails: { customers: { status: 'completed', total: 100 } },
    });
    (prisma.unifiedLog.update as any).mockResolvedValue({});

    await updateEnvironmentReservationStats('log-1', {
      status: 'completed',
      total: 50,
      success: 48,
      failed: 2,
      byState: { Confirmed: 30, Started: 10, Processed: 8 },
    });

    expect(prisma.unifiedLog.update).toHaveBeenCalledWith({
      where: { id: 'log-1' },
      data: {
        operationDetails: {
          customers: { status: 'completed', total: 100 },
          reservations: expect.objectContaining({
            status: 'completed',
            total: 50,
            success: 48,
            failed: 2,
            byState: { Confirmed: 30, Started: 10, Processed: 8 },
          }),
        },
      },
    });
  });
});

describe('findEnvironmentLogByPropertyName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('finds log by property name with building status by default', async () => {
    const mockLog = { id: 'log-1', propertyName: 'Test Hotel', status: 'building' };
    (prisma.unifiedLog.findFirst as any).mockResolvedValue(mockLog);

    const result = await findEnvironmentLogByPropertyName('Test Hotel');

    expect(prisma.unifiedLog.findFirst).toHaveBeenCalledWith({
      where: { propertyName: { equals: 'Test Hotel', mode: 'insensitive' }, logType: 'environment', status: 'building' },
      orderBy: { timestamp: 'desc' },
    });
    expect(result).toEqual(mockLog);
  });

  test('finds log without building status constraint when requireBuilding=false', async () => {
    (prisma.unifiedLog.findFirst as any).mockResolvedValue(null);

    await findEnvironmentLogByPropertyName('Test Hotel', false);

    expect(prisma.unifiedLog.findFirst).toHaveBeenCalledWith({
      where: { propertyName: { equals: 'Test Hotel', mode: 'insensitive' }, logType: 'environment' },
      orderBy: { timestamp: 'desc' },
    });
  });

  test('returns null on database error', async () => {
    (prisma.unifiedLog.findFirst as any).mockRejectedValue(new Error('DB error'));

    const result = await findEnvironmentLogByPropertyName('Test Hotel');
    expect(result).toBeNull();
  });
});

describe('findEnvironmentLogByEnterpriseId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('finds log by enterprise ID', async () => {
    const mockLog = { id: 'log-1', enterpriseId: 'ent-1' };
    (prisma.unifiedLog.findFirst as any).mockResolvedValue(mockLog);

    const result = await findEnvironmentLogByEnterpriseId('ent-1');

    expect(prisma.unifiedLog.findFirst).toHaveBeenCalledWith({
      where: { enterpriseId: 'ent-1', logType: 'environment' },
      orderBy: { timestamp: 'desc' },
    });
    expect(result).toEqual(mockLog);
  });
});

describe('getUnifiedLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('returns all logs sorted by timestamp desc', async () => {
    const mockLogs = [{ id: '1' }, { id: '2' }];
    (prisma.unifiedLog.findMany as any).mockResolvedValue(mockLogs);

    const result = await getUnifiedLogs();

    expect(prisma.unifiedLog.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { timestamp: 'desc' },
      take: undefined,
      skip: undefined,
    });
    expect(result).toHaveLength(2);
  });

  test('filters by logType when specified', async () => {
    (prisma.unifiedLog.findMany as any).mockResolvedValue([]);

    await getUnifiedLogs({ logType: 'environment' });

    expect(prisma.unifiedLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { logType: 'environment' },
      })
    );
  });

  test('returns empty array on error', async () => {
    (prisma.unifiedLog.findMany as any).mockRejectedValue(new Error('DB error'));

    const result = await getUnifiedLogs();
    expect(result).toEqual([]);
  });
});

describe('countUnifiedLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('returns count with optional filters', async () => {
    (prisma.unifiedLog.count as any).mockResolvedValue(42);

    const result = await countUnifiedLogs({ logType: 'environment' });

    expect(prisma.unifiedLog.count).toHaveBeenCalledWith({
      where: { logType: 'environment' },
    });
    expect(result).toBe(42);
  });

  test('returns 0 on error', async () => {
    (prisma.unifiedLog.count as any).mockRejectedValue(new Error('DB error'));

    const result = await countUnifiedLogs();
    expect(result).toBe(0);
  });
});
