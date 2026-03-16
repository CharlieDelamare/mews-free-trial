import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveAccessToken } from '@/lib/reservations';
import { runInBackground } from '@/lib/background';
import { flushApiCallLogs } from '@/lib/api-call-logger';
import { provisionScenario } from '@/lib/control-centre/scenario-service';
import type { ScenarioType } from '@/types/control-centre';

export async function POST(request: NextRequest) {
  try {
    const { enterpriseId, scenarioType } = await request.json() as { enterpriseId: string; scenarioType: ScenarioType };
    if (!enterpriseId) return NextResponse.json({ success: false, error: 'enterpriseId is required' }, { status: 400 });
    if (!scenarioType) return NextResponse.json({ success: false, error: 'scenarioType is required' }, { status: 400 });

    const { token, error } = await resolveAccessToken(enterpriseId);
    if (error || !token) return NextResponse.json({ success: false, error: error || 'Token not found' }, { status: 404 });

    const tokenRecord = await prisma.accessToken.findFirst({ where: { accessToken: token, isEnabled: true }, orderBy: { receivedAt: 'desc' } });
    if (!tokenRecord) return NextResponse.json({ success: false, error: 'Access token not found' }, { status: 404 });

    const log = await prisma.unifiedLog.create({
      data: { logType: 'scenario', enterpriseId, status: 'processing' },
    });

    const work = provisionScenario(token, enterpriseId, tokenRecord.id, scenarioType, log.id)
      .finally(() => flushApiCallLogs().catch(console.error));

    runInBackground(work);

    return NextResponse.json({ success: true, logId: log.id });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
