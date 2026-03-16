import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const logId = request.nextUrl.searchParams.get('logId');
    if (!logId) return NextResponse.json({ success: false, error: 'logId is required' }, { status: 400 });

    const log = await prisma.controlCentreLog.findUnique({ where: { id: logId } });
    if (!log) return NextResponse.json({ success: false, error: 'Log not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      status: log.status,
      totalItems: log.totalItems,
      successCount: log.successCount,
      failureCount: log.failureCount,
      errorMessage: log.errorMessage,
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
