import { prisma } from './prisma';
import type {
  LogType,
  LogStatus,
  UnifiedLog,
  EnvironmentLog,
  ResetLog,
  DemoFillerLog,
  CreateEnvironmentLogInput,
  CreateResetLogInput,
  CreateDemoFillerLogInput,
  EnvironmentSetupStats,
  ResetOperationDetails,
  DemoFillerDetails,
} from '@/types/unified-log';

// === Create Functions ===

/**
 * Create an environment log entry
 */
export async function createEnvironmentLog(input: CreateEnvironmentLogInput): Promise<EnvironmentLog> {
  try {
    const created = await prisma.unifiedLog.create({
      data: {
        logType: 'environment',
        status: input.status || 'building',
        propertyName: input.propertyName,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        propertyCountry: input.propertyCountry,
        propertyType: input.propertyType,
        loginUrl: input.loginUrl,
        loginEmail: input.loginEmail,
        loginPassword: input.loginPassword,
        requestorEmail: input.requestorEmail,
        durationDays: input.durationDays,
        roomCount: input.roomCount,
        dormCount: input.dormCount,
        apartmentCount: input.apartmentCount,
        bedCount: input.bedCount,
        salesforceAccountId: input.salesforceAccountId,
      },
    });
    return created as unknown as EnvironmentLog;
  } catch (error) {
    console.error('[UNIFIED-LOGGER] Failed to create environment log:', (error as Error).message);
    throw new Error(`Database error: Failed to create environment log - ${(error as Error).message}`);
  }
}

/**
 * Create a reset operation log entry
 */
export async function createResetLog(input: CreateResetLogInput): Promise<ResetLog> {
  try {
    const created = await prisma.unifiedLog.create({
      data: {
        logType: 'reset',
        status: 'processing',
        enterpriseId: input.enterpriseId,
        accessTokenId: input.accessTokenId,
        currentStep: 0,
        totalSteps: input.totalSteps || 7,
      },
    });
    return created as unknown as ResetLog;
  } catch (error) {
    console.error('[UNIFIED-LOGGER] Failed to create reset log:', (error as Error).message);
    throw new Error(`Database error: Failed to create reset log - ${(error as Error).message}`);
  }
}

/**
 * Create a demo filler log entry
 */
export async function createDemoFillerLog(input: CreateDemoFillerLogInput): Promise<DemoFillerLog> {
  try {
    const created = await prisma.unifiedLog.create({
      data: {
        logType: 'demo_filler',
        status: 'processing',
        enterpriseId: input.enterpriseId,
        accessTokenId: input.accessTokenId,
        totalItems: input.totalItems,
        successCount: 0,
        failureCount: 0,
      },
    });
    return created as unknown as DemoFillerLog;
  } catch (error) {
    console.error('[UNIFIED-LOGGER] Failed to create demo filler log:', (error as Error).message);
    throw new Error(`Database error: Failed to create demo filler log - ${(error as Error).message}`);
  }
}

// === Update Functions ===

/**
 * Update a unified log by ID
 */
export async function updateUnifiedLog(
  id: string,
  updates: {
    status?: LogStatus;
    enterpriseId?: string;
    timezone?: string;
    errorMessage?: string;
    completedAt?: Date;
    currentStep?: number;
    successCount?: number;
    failureCount?: number;
    operationDetails?: EnvironmentSetupStats | ResetOperationDetails | DemoFillerDetails;
  }
): Promise<UnifiedLog> {
  try {
    const result = await prisma.unifiedLog.update({
      where: { id },
      data: updates,
    });
    return result as unknown as UnifiedLog;
  } catch (error) {
    console.error('[UNIFIED-LOGGER] Failed to update log:', id, (error as Error).message);
    throw new Error(`Database error: Failed to update unified log - ${(error as Error).message}`);
  }
}

/**
 * Update customer setup stats in an environment log's operationDetails
 */
export async function updateEnvironmentCustomerStats(
  logId: string,
  stats: {
    status: 'processing' | 'completed' | 'failed';
    total: number;
    success: number;
    failed: number;
  }
): Promise<void> {
  try {
    // Get current operationDetails
    const log = await prisma.unifiedLog.findUnique({
      where: { id: logId },
      select: { operationDetails: true },
    });

    const currentDetails = (log?.operationDetails as EnvironmentSetupStats) || {};
    const updatedDetails: EnvironmentSetupStats = {
      ...currentDetails,
      customers: stats,
    };

    await prisma.unifiedLog.update({
      where: { id: logId },
      data: { operationDetails: updatedDetails },
    });
  } catch (error) {
    console.error('[UNIFIED-LOGGER] Failed to update customer stats:', logId, (error as Error).message);
    throw new Error(`Database error: Failed to update customer stats - ${(error as Error).message}`);
  }
}

/**
 * Update reservation setup stats in an environment log's operationDetails
 */
export async function updateEnvironmentReservationStats(
  logId: string,
  stats: {
    status: 'processing' | 'completed' | 'failed';
    total: number;
    success: number;
    failed: number;
    byState?: Record<string, number>;
    failures?: Array<{
      error: string;
      skipped?: boolean;
      checkInUtc?: string;
      checkOutUtc?: string;
    }>;
  }
): Promise<void> {
  try {
    // Get current operationDetails
    const log = await prisma.unifiedLog.findUnique({
      where: { id: logId },
      select: { operationDetails: true },
    });

    const currentDetails = (log?.operationDetails as EnvironmentSetupStats) || {};
    const updatedDetails: EnvironmentSetupStats = {
      ...currentDetails,
      reservations: stats,
    };

    await prisma.unifiedLog.update({
      where: { id: logId },
      data: { operationDetails: updatedDetails },
    });
  } catch (error) {
    console.error('[UNIFIED-LOGGER] Failed to update reservation stats:', logId, (error as Error).message);
    throw new Error(`Database error: Failed to update reservation stats - ${(error as Error).message}`);
  }
}

/**
 * Update reset operation details
 */
export async function updateResetDetails(
  logId: string,
  details: Partial<ResetOperationDetails>
): Promise<void> {
  try {
    const log = await prisma.unifiedLog.findUnique({
      where: { id: logId },
      select: { operationDetails: true },
    });

    const currentDetails = (log?.operationDetails as ResetOperationDetails) || {};
    const updatedDetails: ResetOperationDetails = {
      ...currentDetails,
      ...details,
    };

    await prisma.unifiedLog.update({
      where: { id: logId },
      data: { operationDetails: updatedDetails },
    });
  } catch (error) {
    console.error('[UNIFIED-LOGGER] Failed to update reset details:', logId, (error as Error).message);
    throw new Error(`Database error: Failed to update reset details - ${(error as Error).message}`);
  }
}

// === Find Functions ===

/**
 * Find a unified log by ID
 */
export async function findUnifiedLogById(id: string): Promise<UnifiedLog | null> {
  try {
    const result = await prisma.unifiedLog.findUnique({
      where: { id },
    });
    return result as unknown as UnifiedLog | null;
  } catch (error) {
    console.error('[UNIFIED-LOGGER] Failed to find log by ID:', (error as Error).message);
    return null;
  }
}

/**
 * Find environment log by property name (used by webhook to match logs)
 */
export async function findEnvironmentLogByPropertyName(
  propertyName: string,
  requireBuilding: boolean = true
): Promise<EnvironmentLog | null> {
  try {
    const whereClause = requireBuilding
      ? { propertyName, logType: 'environment', status: 'building' }
      : { propertyName, logType: 'environment' };

    const result = await prisma.unifiedLog.findFirst({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
    });

    return result as unknown as EnvironmentLog | null;
  } catch (error) {
    console.error('[UNIFIED-LOGGER] Failed to find log by property name:', (error as Error).message);
    return null;
  }
}

/**
 * Find environment log by enterprise ID
 */
export async function findEnvironmentLogByEnterpriseId(enterpriseId: string): Promise<EnvironmentLog | null> {
  try {
    const result = await prisma.unifiedLog.findFirst({
      where: { enterpriseId, logType: 'environment' },
      orderBy: { timestamp: 'desc' },
    });
    return result as unknown as EnvironmentLog | null;
  } catch (error) {
    console.error('[UNIFIED-LOGGER] Failed to find log by enterprise ID:', (error as Error).message);
    return null;
  }
}

// === Read Functions ===

/**
 * Get all unified logs, sorted by timestamp descending
 */
export async function getUnifiedLogs(options?: {
  logType?: LogType;
  status?: LogStatus;
  enterpriseId?: string;
  limit?: number;
  offset?: number;
}): Promise<UnifiedLog[]> {
  try {
    const where: Record<string, unknown> = {};

    if (options?.logType) where.logType = options.logType;
    if (options?.status) where.status = options.status;
    if (options?.enterpriseId) where.enterpriseId = options.enterpriseId;

    const logs = await prisma.unifiedLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return logs as unknown as UnifiedLog[];
  } catch (error) {
    console.error('[UNIFIED-LOGGER] Failed to get unified logs:', (error as Error).message);
    return [];
  }
}

/**
 * Get all logs with enterprise name enrichment from AccessToken
 */
export async function getUnifiedLogsWithEnterpriseNames(): Promise<(UnifiedLog & { enterpriseName?: string })[]> {
  try {
    const logs = await prisma.unifiedLog.findMany({
      orderBy: { timestamp: 'desc' },
    });

    // Get unique enterprise IDs
    const enterpriseIds = Array.from(new Set(logs.map(l => l.enterpriseId).filter((id): id is string => id !== null)));

    // Fetch enterprise names from AccessToken
    const tokens = await prisma.accessToken.findMany({
      where: { enterpriseId: { in: enterpriseIds } },
      select: { enterpriseId: true, enterpriseName: true },
      distinct: ['enterpriseId'],
    });

    // Create lookup map
    const nameMap = new Map(tokens.map(t => [t.enterpriseId, t.enterpriseName]));

    // Enrich logs with enterprise names
    return logs.map(log => ({
      ...log,
      enterpriseName: log.enterpriseId ? nameMap.get(log.enterpriseId) : undefined,
    })) as unknown as (UnifiedLog & { enterpriseName?: string })[];
  } catch (error) {
    console.error('[UNIFIED-LOGGER] Failed to get logs with enterprise names:', (error as Error).message);
    return [];
  }
}

/**
 * Count unified logs (useful for pagination)
 */
export async function countUnifiedLogs(options?: {
  logType?: LogType;
  status?: LogStatus;
  enterpriseId?: string;
}): Promise<number> {
  try {
    const where: Record<string, unknown> = {};

    if (options?.logType) where.logType = options.logType;
    if (options?.status) where.status = options.status;
    if (options?.enterpriseId) where.enterpriseId = options.enterpriseId;

    return await prisma.unifiedLog.count({ where });
  } catch (error) {
    console.error('[UNIFIED-LOGGER] Failed to count logs:', (error as Error).message);
    return 0;
  }
}
