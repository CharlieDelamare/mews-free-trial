import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveAccessToken } from '@/lib/reservations';
import { runInBackground } from '@/lib/background';
import { flushApiCallLogs } from '@/lib/api-call-logger';
import { morningPrep } from '@/lib/control-centre/operations-service';

export async function POST(request: NextRequest) {
  try {
    const { enterpriseId } = await request.json();
    if (!enterpriseId) return NextResponse.json({ success: false, error: 'enterpriseId is required' }, { status: 400 });

    const { token, error } = await resolveAccessToken(enterpriseId);
    if (error || !token) return NextResponse.json({ success: false, error: error || 'Token not found' }, { status: 404 });

    const tokenRecord = await prisma.accessToken.findFirst({ where: { accessToken: token, isEnabled: true }, orderBy: { receivedAt: 'desc' } });
    if (!tokenRecord) return NextResponse.json({ success: false, error: 'Access token not found' }, { status: 404 });

    const log = await prisma.controlCentreLog.create({
      data: { logType: 'morning_prep', enterpriseId, status: 'processing' },
    });

    const work = morningPrep(token, log.id)
      .then(result => prisma.controlCentreLog.update({
        where: { id: log.id },
        data: { status: 'completed', completedAt: new Date(), successCount: result.successCount, failureCount: result.failureCount },
      }))
      .catch(err => prisma.controlCentreLog.update({
        where: { id: log.id },
        data: { status: 'failed', completedAt: new Date(), errorMessage: err instanceof Error ? err.message : 'Unknown error' },
      }))
      .finally(() => flushApiCallLogs().catch(console.error));

    runInBackground(work);

    return NextResponse.json({ success: true, logId: log.id, message: 'Morning prep started. Check logs for progress.' });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
