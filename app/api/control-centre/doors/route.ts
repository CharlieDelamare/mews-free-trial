import { NextRequest, NextResponse } from 'next/server';
import { resolveAccessToken } from '@/lib/reservations';
import { getDoorAssignments } from '@/lib/control-centre/door-service';

export async function GET(request: NextRequest) {
  try {
    const enterpriseId = request.nextUrl.searchParams.get('enterpriseId');
    if (!enterpriseId) return NextResponse.json({ success: false, error: 'enterpriseId is required' }, { status: 400 });

    const { token, error } = await resolveAccessToken(enterpriseId);
    if (error || !token) return NextResponse.json({ success: false, error: error || 'Token not found' }, { status: 404 });

    const result = await getDoorAssignments(token);
    return NextResponse.json({ success: true, result });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
