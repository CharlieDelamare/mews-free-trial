import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveAccessToken } from '@/lib/reservations';
import { runInBackground } from '@/lib/background';
import { flushApiCallLogs } from '@/lib/api-call-logger';
import { provisionDoors } from '@/lib/control-centre/door-service';

export async function POST(request: NextRequest) {
  try {
    const { enterpriseId, reservationIds } = await request.json();
    if (!enterpriseId) return NextResponse.json({ success: false, error: 'enterpriseId is required' }, { status: 400 });
    if (!Array.isArray(reservationIds) || reservationIds.length === 0) {
      return NextResponse.json({ success: false, error: 'reservationIds must be a non-empty array' }, { status: 400 });
    }

    const { token, error } = await resolveAccessToken(enterpriseId);
    if (error || !token) return NextResponse.json({ success: false, error: error || 'Token not found' }, { status: 404 });

    const tokenRecord = await prisma.accessToken.findFirst({ where: { accessToken: token, isEnabled: true }, orderBy: { receivedAt: 'desc' } });
    if (!tokenRecord) return NextResponse.json({ success: false, error: 'Access token not found' }, { status: 404 });

    const log = await prisma.unifiedLog.create({
      data: { logType: 'doors', enterpriseId, status: 'processing', totalItems: reservationIds.length },
    });

    const work = provisionDoors(token, reservationIds)
      .then(result => prisma.unifiedLog.update({
        where: { id: log.id },
        data: { status: 'completed', completedAt: new Date(), successCount: result.successCount, failureCount: result.failureCount },
      }))
      .catch(err => prisma.unifiedLog.update({
        where: { id: log.id },
        data: { status: 'failed', completedAt: new Date(), errorMessage: err instanceof Error ? err.message : 'Unknown error' },
      }))
      .finally(() => flushApiCallLogs().catch(console.error));

    runInBackground(work);

    return NextResponse.json({ success: true, logId: log.id });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
