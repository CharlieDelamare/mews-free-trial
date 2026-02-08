import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Environment {
  enterpriseId: string;
  enterpriseName: string;
  propertyName?: string;
  type: 'trial' | 'manual';
  status?: string;
  customerEmail?: string;
  createdAt: Date;
  accessTokenId: number;
}

export async function GET() {
  try {
    // Fetch all enabled access tokens
    const accessTokens = await prisma.accessToken.findMany({
      where: { isEnabled: true },
      orderBy: { receivedAt: 'desc' }
    });

    // Fetch all environment logs from UnifiedLog table
    const environmentLogs = await prisma.unifiedLog.findMany({
      where: { logType: 'environment' },
      orderBy: { timestamp: 'desc' }
    });

    // Create a map of enterpriseId -> EnvironmentLog for quick lookup
    const logMap = new Map<string, typeof environmentLogs[0]>();
    environmentLogs.forEach(log => {
      if (log.enterpriseId && !logMap.has(log.enterpriseId)) {
        logMap.set(log.enterpriseId, log);
      }
    });

    // Combine access tokens with their corresponding environment logs
    const environments: Environment[] = accessTokens.map(token => {
      const log = logMap.get(token.enterpriseId);

      return {
        enterpriseId: token.enterpriseId,
        enterpriseName: token.enterpriseName,
        propertyName: log?.propertyName ?? undefined,
        type: log ? 'trial' : 'manual',
        status: log?.status ?? undefined,
        customerEmail: log?.customerEmail ?? undefined,
        createdAt: token.receivedAt,
        accessTokenId: token.id
      };
    });

    return NextResponse.json({
      success: true,
      environments
    });
  } catch (error) {
    console.error('Error fetching environments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sandboxes' },
      { status: 500 }
    );
  }
}
