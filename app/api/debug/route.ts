import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug
 * Debug endpoint to check database state and recent logs
 * Query params:
 *   - enterpriseId: Filter by specific enterprise ID
 *   - limit: Number of recent records to return (default: 10)
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get('enterpriseId');
    const rawLimit = parseInt(searchParams.get('limit') ?? '10', 10);
    const limit = isNaN(rawLimit) ? 10 : Math.min(Math.max(1, rawLimit), 100);

    console.log('[DEBUG] Debug endpoint called by:', session.user.email);
    console.log('[DEBUG] Parameters:', { enterpriseId, limit });

    // Get recent environment logs from UnifiedLog
    const unifiedEnvironmentLogs = await prisma.unifiedLog.findMany({
      where: {
        logType: 'environment',
        ...(enterpriseId ? { enterpriseId } : {})
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    // Get recent environment logs from legacy EnvironmentLog
    const environmentLogs = await prisma.environmentLog.findMany({
      where: enterpriseId ? { enterpriseId } : undefined,
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    // Get recent access tokens
    const accessTokens = await prisma.accessToken.findMany({
      where: enterpriseId ? { enterpriseId } : undefined,
      orderBy: { receivedAt: 'desc' },
      take: limit
    });

    // Get count of logs by status
    const logStatusCounts = await prisma.environmentLog.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    // Get logs with missing enterprise IDs
    const logsWithoutEnterpriseId = await prisma.environmentLog.count({
      where: {
        enterpriseId: null
      }
    });

    // Get logs that are stuck in "building" status
    const buildingLogs = await prisma.environmentLog.findMany({
      where: {
        status: 'building'
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    // Find orphaned logs (building status but access token exists)
    const orphanedLogs = [];
    for (const log of buildingLogs) {
      if (log.enterpriseId) {
        const hasToken = await prisma.accessToken.findFirst({
          where: { enterpriseId: log.enterpriseId }
        });
        if (hasToken) {
          orphanedLogs.push({
            log: {
              id: log.id,
              propertyName: log.propertyName,
              enterpriseId: log.enterpriseId,
              status: log.status,
              timestamp: log.timestamp
            },
            token: {
              id: hasToken.id,
              receivedAt: hasToken.receivedAt,
              action: hasToken.action
            }
          });
        }
      }
    }

    const summary = {
      totalUnifiedLogs: await prisma.unifiedLog.count({ where: { logType: 'environment' } }),
      totalLegacyEnvironmentLogs: await prisma.environmentLog.count(),
      totalAccessTokens: await prisma.accessToken.count(),
      logsWithoutEnterpriseId,
      logStatusCounts: logStatusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      buildingLogsCount: buildingLogs.length,
      orphanedLogsCount: orphanedLogs.length
    };

    return NextResponse.json({
      summary,
      recentUnifiedEnvironmentLogs: unifiedEnvironmentLogs.map(log => ({
        id: log.id,
        propertyName: log.propertyName,
        customerEmail: log.customerEmail,
        enterpriseId: log.enterpriseId,
        status: log.status,
        timestamp: log.timestamp,
        requestorEmail: log.requestorEmail
      })),
      recentLegacyEnvironmentLogs: environmentLogs.map(log => ({
        id: log.id,
        propertyName: log.propertyName,
        customerEmail: log.customerEmail,
        enterpriseId: log.enterpriseId,
        status: log.status,
        timestamp: log.timestamp,
        requestorEmail: log.requestorEmail
      })),
      recentAccessTokens: accessTokens.map(token => ({
        id: token.id,
        enterpriseId: token.enterpriseId,
        enterpriseName: token.enterpriseName,
        action: token.action,
        isEnabled: token.isEnabled,
        receivedAt: token.receivedAt,
        createdUtc: token.createdUtc
      })),
      buildingLogs: buildingLogs.map(log => ({
        id: log.id,
        propertyName: log.propertyName,
        enterpriseId: log.enterpriseId,
        status: log.status,
        timestamp: log.timestamp
      })),
      orphanedLogs
    });

  } catch (error) {
    console.error('[DEBUG] Error in debug endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
