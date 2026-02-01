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
  status: 'building' | 'completed' | 'failure';
  errorMessage?: string | null;
  enterpriseId?: string | null;
  requestorEmail?: string | null;
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
      },
    });
    return created;
  } catch (error) {
    console.error('Failed to save environment log:', error);
    throw error;
  }
}

export async function updateEnvironmentLog(enterpriseId: string, updates: {
  status?: 'building' | 'completed' | 'failure';
  errorMessage?: string;
}) {
  try {
    return await prisma.environmentLog.updateMany({
      where: { enterpriseId },
      data: updates,
    });
  } catch (error) {
    console.error('Failed to update environment log:', error);
    throw error;
  }
}

export async function updateEnvironmentLogById(id: string, updates: {
  status?: 'building' | 'completed' | 'failure';
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
    throw error;
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
