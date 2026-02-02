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
  salesforceAccountId?: string | null;
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
        salesforceAccountId: log.salesforceAccountId,
      },
    });
    return created;
  } catch (error) {
    console.error('[LOGGER] Failed to save environment log:', (error as Error).message);
    throw new Error(`Database error: Failed to save environment log - ${(error as Error).message}`);
  }
}

export async function updateEnvironmentLog(enterpriseId: string, updates: {
  status?: 'building' | 'Updating' | 'completed' | 'failure';
  errorMessage?: string;
  timezone?: string;
}) {
  try {
    const result = await prisma.environmentLog.updateMany({
      where: { enterpriseId },
      data: updates,
    });

    if (result.count === 0) {
      console.warn('[LOGGER] No records matched enterpriseId:', enterpriseId);
    }

    return result;
  } catch (error) {
    console.error('[LOGGER] Failed to update environment log:', enterpriseId, (error as Error).message);
    throw new Error(`Database error: Failed to update environment log - ${(error as Error).message}`);
  }
}

export async function updateEnvironmentLogById(id: string, updates: {
  status?: 'building' | 'Updating' | 'completed' | 'failure';
  errorMessage?: string;
  enterpriseId?: string;
}) {
  try {
    const result = await prisma.environmentLog.update({
      where: { id },
      data: updates,
    });
    return result;
  } catch (error) {
    console.error('[LOGGER] Failed to update log by ID:', id, (error as Error).message);
    throw new Error(`Database error: Failed to update environment log by ID - ${(error as Error).message}`);
  }
}

export async function findEnvironmentLogByEnterpriseId(enterpriseId: string) {
  try {
    const result = await prisma.environmentLog.findFirst({
      where: { enterpriseId },
      orderBy: { timestamp: 'desc' }
    });
    return result;
  } catch (error) {
    console.error('[LOGGER] Failed to find log:', (error as Error).message);
    return null;
  }
}

export async function findEnvironmentLogByPropertyName(
  propertyName: string,
  requireBuilding: boolean = true
) {
  try {
    const whereClause = requireBuilding
      ? { propertyName, status: 'building' as const }
      : { propertyName };

    const result = await prisma.environmentLog.findFirst({
      where: whereClause,
      orderBy: { timestamp: 'desc' }
    });

    return result;
  } catch (error) {
    console.error('[LOGGER] Failed to find log by property name:', (error as Error).message);
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
