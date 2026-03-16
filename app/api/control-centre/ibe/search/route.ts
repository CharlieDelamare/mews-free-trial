import { NextRequest, NextResponse } from 'next/server';
import { resolveAccessToken } from '@/lib/reservations';
import { searchIbeAvailability } from '@/lib/control-centre/ibe-service';
import type { IbeSearchParams } from '@/types/control-centre';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as IbeSearchParams;
    if (!body.enterpriseId) return NextResponse.json({ success: false, error: 'enterpriseId is required' }, { status: 400 });

    const { token, error } = await resolveAccessToken(body.enterpriseId);
    if (error || !token) return NextResponse.json({ success: false, error: error || 'Token not found' }, { status: 404 });

    const results = await searchIbeAvailability(token, body);
    return NextResponse.json({ success: true, results });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
