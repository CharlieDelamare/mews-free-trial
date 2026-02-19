import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const stuckLogs = await prisma.unifiedLog.findMany({
      where: { status: { in: ['building', 'processing'] } },
      select: {
        id: true,
        logType: true,
        status: true,
        propertyName: true,
        enterpriseId: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    if (stuckLogs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck logs found. Nothing to clean up.',
        deleted: { unifiedLogs: 0, apiCallLogs: 0 },
      });
    }

    const ids = stuckLogs.map((l) => l.id);

    const deletedApiCalls = await prisma.apiCallLog.deleteMany({
      where: { unifiedLogId: { in: ids } },
    });

    const deletedLogs = await prisma.unifiedLog.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedLogs.count} stuck log(s).`,
      deleted: {
        unifiedLogs: deletedLogs.count,
        apiCallLogs: deletedApiCalls.count,
      },
      details: stuckLogs,
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
