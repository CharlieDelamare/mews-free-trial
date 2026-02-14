import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/logs/api-calls?logId=X&group=Y&limit=N&offset=N
 *
 * Fetch API call logs for a specific unified log entry.
 * Returns call summaries (without request/response bodies) and group stats.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unifiedLogId = searchParams.get('logId');
    const group = searchParams.get('group');
    const limit = Math.min(parseInt(searchParams.get('limit') || '2000', 10), 2000);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!unifiedLogId) {
      return NextResponse.json(
        { success: false, error: 'logId query parameter is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { unifiedLogId };
    if (group) where.group = group;

    const [apiCalls, total] = await Promise.all([
      prisma.apiCallLog.findMany({
        where,
        orderBy: { timestamp: 'asc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          timestamp: true,
          endpoint: true,
          method: true,
          group: true,
          statusCode: true,
          durationMs: true,
          success: true,
          errorMessage: true,
          metadata: true,
          // Exclude requestBody and responseBody for lightweight list
        },
      }),
      prisma.apiCallLog.count({ where }),
    ]);

    // Group summary stats
    const groupSummary = await prisma.apiCallLog.groupBy({
      by: ['group'],
      where: { unifiedLogId },
      _count: { id: true },
      _avg: { durationMs: true },
      _sum: { durationMs: true },
    });

    const [successCount, failureCount] = await Promise.all([
      prisma.apiCallLog.count({ where: { unifiedLogId, success: true } }),
      prisma.apiCallLog.count({ where: { unifiedLogId, success: false } }),
    ]);

    return NextResponse.json({
      success: true,
      apiCalls: apiCalls.map(call => ({
        ...call,
        timestamp: call.timestamp.toISOString(),
      })),
      total,
      successCount,
      failureCount,
      groups: groupSummary.map(g => ({
        group: g.group,
        count: g._count.id,
        avgDurationMs: Math.round(g._avg.durationMs || 0),
        totalDurationMs: g._sum.durationMs || 0,
      })),
    });
  } catch (error) {
    console.error('[API-CALL-LOGS] Failed to fetch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API call logs' },
      { status: 500 }
    );
  }
}
