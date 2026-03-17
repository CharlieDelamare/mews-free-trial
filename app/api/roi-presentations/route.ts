import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractMetadata, serializeState } from '@/lib/roi-calculator/utils/persistence';
import type { PersistedState } from '@/lib/roi-calculator/utils/persistence';

export async function GET() {
  try {
    const presentations = await prisma.roiPresentation.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        country: true,
        hotelType: true,
        numberOfRooms: true,
        totalAnnualSavings: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ success: true, presentations });
  } catch (err) {
    console.error('[ROI] GET /api/roi-presentations failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to load presentations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: { name?: string; salesforceAccountId?: string; createdBy?: string; state?: PersistedState };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, salesforceAccountId, createdBy, state } = body;

  if (!name?.trim()) {
    return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
  }
  if (!state) {
    return NextResponse.json({ success: false, error: 'state is required' }, { status: 400 });
  }

  try {
    // Wizard sends PersistedState (ui already stripped); serializeState is idempotent here.
    const persisted = serializeState(state as Parameters<typeof serializeState>[0]);
    const meta = extractMetadata(persisted);

    const presentation = await prisma.roiPresentation.create({
      data: {
        name: name.trim(),
        salesforceAccountId: salesforceAccountId?.trim() || null,
        createdBy: createdBy?.trim() || null,
        stateJson: persisted as object,
        ...meta,
      },
    });

    return NextResponse.json({ success: true, id: presentation.id });
  } catch (err) {
    console.error('[ROI] POST /api/roi-presentations failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to create presentation' }, { status: 500 });
  }
}
