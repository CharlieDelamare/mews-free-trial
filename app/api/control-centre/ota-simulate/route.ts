import { NextRequest, NextResponse } from 'next/server';
import { resolveAccessToken } from '@/lib/reservations';
import { simulateOtaBooking } from '@/lib/control-centre/ota-service';
import type { OtaSimulateParams } from '@/types/control-centre';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as OtaSimulateParams;
    if (!body.enterpriseId) return NextResponse.json({ success: false, error: 'enterpriseId is required' }, { status: 400 });

    const { token, error } = await resolveAccessToken(body.enterpriseId);
    if (error || !token) return NextResponse.json({ success: false, error: error || 'Token not found' }, { status: 404 });

    const result = await simulateOtaBooking(token, body);
    return NextResponse.json({ success: result.success, result, error: result.error });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
