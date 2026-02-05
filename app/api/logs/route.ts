import { NextResponse } from 'next/server';
import { getUnifiedLogsWithEnterpriseNames } from '@/lib/unified-logger';
import type { UnifiedLog } from '@/types/unified-log';

// Disable caching - this endpoint needs fresh data on every request
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all logs from unified table with enterprise name enrichment
    const logs = await getUnifiedLogsWithEnterpriseNames();

    // Transform logs to API response format
    const transformedLogs = logs.map(log => ({
      ...log,
      // Ensure timestamp is ISO string
      timestamp: typeof log.timestamp === 'string'
        ? log.timestamp
        : log.timestamp.toISOString(),
      // Ensure completedAt is ISO string if present
      completedAt: log.completedAt
        ? (typeof log.completedAt === 'string'
            ? log.completedAt
            : log.completedAt.toISOString())
        : null,
      // Add type field for backwards compatibility with frontend
      type: log.logType,
    }));

    return NextResponse.json({ success: true, logs: transformedLogs });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
