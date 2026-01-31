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
  status: 'success' | 'failure';
  errorMessage?: string | null;
}

export async function saveEnvironmentLog(log: Omit<EnvironmentLog, 'id' | 'timestamp'>) {
  try {
    await prisma.environmentLog.create({
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
      },
    });
  } catch (error) {
    console.error('Failed to save environment log:', error);
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
