import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/logs/api-calls/[id]
 *
 * Fetch a single API call log with full request/response bodies.
 * Used when the user expands a specific row in the API logs viewer.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const callId = parseInt(id, 10);

    if (isNaN(callId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const apiCall = await prisma.apiCallLog.findUnique({
      where: { id: callId },
    });

    if (!apiCall) {
      return NextResponse.json(
        { success: false, error: 'API call log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      apiCall: {
        ...apiCall,
        timestamp: apiCall.timestamp.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API-CALL-LOGS] Failed to fetch detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API call detail' },
      { status: 500 }
    );
  }
}
