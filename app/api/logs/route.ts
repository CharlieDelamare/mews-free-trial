import { NextResponse } from 'next/server';
import { readEnvironmentLogs } from '@/lib/logger';
import { enrichEnvironmentLogs } from '@/lib/log-enrichment';
import { prisma } from '@/lib/prisma';

// Disable caching - this endpoint needs fresh data on every request
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch base environment logs
    const logs = await readEnvironmentLogs();

    // Extract enterprise IDs to fetch related statistics
    const enterpriseIds = logs
      .map((log) => log.enterpriseId)
      .filter((id): id is string => !!id);

    // Fetch customer and reservation creation logs in parallel
    const [customerLogs, reservationLogs] = await Promise.all([
      prisma.customerCreationLog.findMany({
        where: { enterpriseId: { in: enterpriseIds } },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.reservationCreationLog.findMany({
        where: { enterpriseId: { in: enterpriseIds } },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    // Enrich logs with statistics
    const enrichedLogs = enrichEnvironmentLogs(logs, customerLogs, reservationLogs);

    return NextResponse.json({ success: true, logs: enrichedLogs });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
