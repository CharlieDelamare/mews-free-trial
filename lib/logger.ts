import { prisma } from './prisma';

export interface EnvironmentLog {
  id: string;
  timestamp: Date;
  propertyName: string;
  customerName: string;
  customerEmail: string;
  propertyCountry: string;
  propertyType: string;
  loginUrl: string;
  loginEmail: string;
  loginPassword: string;
  status: 'building' | 'Updating' | 'completed' | 'failure';
  errorMessage?: string | null;
  enterpriseId?: string | null;
  requestorEmail?: string | null;
  durationDays?: number | null;
  roomCount?: number | null;
  dormCount?: number | null;
  apartmentCount?: number | null;
  bedCount?: number | null;
  timezone?: string | null;
}

export async function saveEnvironmentLog(log: Omit<EnvironmentLog, 'id' | 'timestamp'>) {
  try {
    const created = await prisma.environmentLog.create({
      data: {
        propertyName: log.propertyName,
        customerName: log.customerName,
        customerEmail: log.customerEmail,
        propertyCountry: log.propertyCountry,
        propertyType: log.propertyType,
        loginUrl: log.loginUrl,
        loginEmail: log.loginEmail,
        loginPassword: log.loginPassword,
        status: log.status,
        errorMessage: log.errorMessage,
        enterpriseId: log.enterpriseId,
        requestorEmail: log.requestorEmail,
        durationDays: log.durationDays,
        roomCount: log.roomCount,
        dormCount: log.dormCount,
        apartmentCount: log.apartmentCount,
        bedCount: log.bedCount,
        timezone: log.timezone,
      },
    });
    return created;
  } catch (error) {
    console.error('[LOGGER] Failed to save environment log:', error);
    console.error('[LOGGER] Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      code: (error as any).code
    });
    console.error('[LOGGER] Attempted to save log for:', log.propertyName);
    throw new Error(`Database error: Failed to save environment log - ${(error as Error).message}`);
  }
}

export async function updateEnvironmentLog(enterpriseId: string, updates: {
  status?: 'building' | 'Updating' | 'completed' | 'failure';
  errorMessage?: string;
  timezone?: string;
}) {
  try {
    console.log('[LOGGER] Attempting to update environment log for enterpriseId:', enterpriseId);
    console.log('[LOGGER] Updates to apply:', updates);

    const result = await prisma.environmentLog.updateMany({
      where: { enterpriseId },
      data: updates,
    });

    console.log('[LOGGER] Update result - records affected:', result.count);

    if (result.count === 0) {
      console.warn('[LOGGER] ⚠️  WARNING: updateMany returned count 0 - no records matched enterpriseId:', enterpriseId);
    }

    return result;
  } catch (error) {
    console.error('[LOGGER] Failed to update environment log for enterpriseId:', enterpriseId, error);
    console.error('[LOGGER] Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      code: (error as any).code
    });
    throw new Error(`Database error: Failed to update environment log - ${(error as Error).message}`);
  }
}

export async function updateEnvironmentLogById(id: string, updates: {
  status?: 'building' | 'Updating' | 'completed' | 'failure';
  errorMessage?: string;
  enterpriseId?: string;
}) {
  try {
    console.log('[LOGGER] Updating environment log by ID:', id, 'with updates:', updates);
    const result = await prisma.environmentLog.update({
      where: { id },
      data: updates,
    });
    console.log('[LOGGER] ✅ Environment log updated successfully:', id);
    return result;
  } catch (error) {
    console.error('[LOGGER] ❌ Failed to update environment log by ID:', id, error);
    console.error('[LOGGER] Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      code: (error as any).code
    });
    throw new Error(`Database error: Failed to update environment log by ID - ${(error as Error).message}`);
  }
}

export async function findEnvironmentLogByEnterpriseId(enterpriseId: string) {
  try {
    console.log('[LOGGER] Searching for environment log with enterprise ID:', enterpriseId);
    const result = await prisma.environmentLog.findFirst({
      where: { enterpriseId },
      orderBy: { timestamp: 'desc' }
    });
    if (result) {
      console.log('[LOGGER] ✅ Found environment log:', result.id);
    } else {
      console.log('[LOGGER] ⚠️  No environment log found for enterprise ID:', enterpriseId);
    }
    return result;
  } catch (error) {
    console.error('[LOGGER] ❌ Failed to find environment log:', error);
    return null;
  }
}

export async function findEnvironmentLogByPropertyName(
  propertyName: string,
  requireBuilding: boolean = true
) {
  try {
    console.log('[LOGGER] Searching for environment log with property name:', propertyName);

    const whereClause = requireBuilding
      ? { propertyName, status: 'building' as const }
      : { propertyName };

    const result = await prisma.environmentLog.findFirst({
      where: whereClause,
      orderBy: { timestamp: 'desc' }
    });

    if (result) {
      console.log('[LOGGER] ✅ Found environment log by property name:', result.id);
    } else {
      console.log('[LOGGER] ⚠️  No environment log found for property name:', propertyName);
    }
    return result;
  } catch (error) {
    console.error('[LOGGER] ❌ Failed to find environment log by property name:', error);
    return null;
  }
}

export async function readEnvironmentLogs(): Promise<EnvironmentLog[]> {
  try {
    const logs = await prisma.environmentLog.findMany({
      orderBy: {
        timestamp: 'desc',
      },
    });
    return logs as EnvironmentLog[];
  } catch (error) {
    console.error('Failed to read environment logs:', error);
    return [];
  }
}
