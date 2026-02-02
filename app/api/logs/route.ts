import { NextResponse } from 'next/server';
import { readEnvironmentLogs } from '@/lib/logger';

// Disable caching - this endpoint needs fresh data on every request
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await readEnvironmentLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
