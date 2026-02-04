import { NextResponse } from 'next/server';
import { readEnvironmentLogs } from '@/lib/logger';
import { enrichEnvironmentLogs } from '@/lib/log-enrichment';
import { prisma } from '@/lib/prisma';

// Disable caching - this endpoint needs fresh data on every request
export const dynamic = 'force-dynamic';

interface UnifiedLog {
  id: string;
  type: 'environment' | 'reset' | 'demo_filler';
  timestamp: string;
  enterpriseId?: string;
  enterpriseName?: string;
  status: string;
  [key: string]: any; // Allow additional fields
}

export async function GET() {
  try {
    // Fetch all log types in parallel
    const [environmentLogs, resetLogs, demoFillerLogs] = await Promise.all([
      // Fetch environment logs
      readEnvironmentLogs(),

      // Fetch reset operation logs
      prisma.resetOperationLog.findMany({
        orderBy: { startedAt: 'desc' },
      }),

      // Fetch demo filler logs (reservation logs with demo_filler type)
      prisma.reservationCreationLog.findMany({
        where: { operationType: 'demo_filler' },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    // Enrich environment logs with statistics
    const enterpriseIds = environmentLogs
      .map((log) => log.enterpriseId)
      .filter((id): id is string => !!id);

    const [customerLogs, reservationLogs] = await Promise.all([
      prisma.customerCreationLog.findMany({
        where: { enterpriseId: { in: enterpriseIds } },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.reservationCreationLog.findMany({
        where: {
          enterpriseId: { in: enterpriseIds },
          operationType: 'automatic'
        },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    const enrichedEnvironmentLogs = enrichEnvironmentLogs(environmentLogs, customerLogs, reservationLogs);

    // Fetch enterprise names for reset and demo filler logs
    const allEnterpriseIds = [
      ...resetLogs.map(log => log.enterpriseId),
      ...demoFillerLogs.map(log => log.enterpriseId),
    ];
    const uniqueEnterpriseIds = Array.from(new Set(allEnterpriseIds));

    const accessTokens = await prisma.accessToken.findMany({
      where: { enterpriseId: { in: uniqueEnterpriseIds } },
      distinct: ['enterpriseId'],
      orderBy: { receivedAt: 'desc' },
    });

    const enterpriseNameMap = new Map(
      accessTokens.map(token => [token.enterpriseId, token.enterpriseName])
    );

    // Transform reset logs to unified format
    const transformedResetLogs: UnifiedLog[] = resetLogs.map(log => ({
      id: `reset-${log.id}`,
      type: 'reset' as const,
      timestamp: log.startedAt.toISOString(),
      enterpriseId: log.enterpriseId,
      enterpriseName: enterpriseNameMap.get(log.enterpriseId),
      status: log.status,
      currentStep: log.currentStep,
      totalSteps: log.totalSteps,
      completedAt: log.completedAt?.toISOString(),
      errorSummary: log.errorSummary,
      operationDetails: log.operationDetails,
    }));

    // Transform demo filler logs to unified format
    const transformedDemoFillerLogs: UnifiedLog[] = demoFillerLogs.map(log => ({
      id: `demo-filler-${log.id}`,
      type: 'demo_filler' as const,
      timestamp: log.startedAt.toISOString(),
      enterpriseId: log.enterpriseId,
      enterpriseName: enterpriseNameMap.get(log.enterpriseId),
      status: log.status,
      totalReservations: log.totalReservations,
      successCount: log.successCount,
      failureCount: log.failureCount,
      completedAt: log.completedAt?.toISOString(),
      errorSummary: log.errorSummary,
    }));

    // Transform environment logs to unified format
    const transformedEnvironmentLogs: UnifiedLog[] = enrichedEnvironmentLogs.map(log => ({
      ...log,
      id: `environment-${log.id}`,
      type: 'environment' as const,
      timestamp: typeof log.timestamp === 'string' ? log.timestamp : log.timestamp.toISOString(),
    } as any));

    // Combine and sort all logs by timestamp (newest first)
    const allLogs = [
      ...transformedEnvironmentLogs,
      ...transformedResetLogs,
      ...transformedDemoFillerLogs,
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ success: true, logs: allLogs });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
