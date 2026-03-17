import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractMetadata, serializeState } from '@/lib/roi-calculator/utils/persistence';
import type { CalculatorState } from '@/lib/roi-calculator/types/calculator';

export async function GET() {
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
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, salesforceAccountId, createdBy, state } = body as {
    name?: string;
    salesforceAccountId?: string;
    createdBy?: string;
    state?: CalculatorState;
  };

  if (!name?.trim()) {
    return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
  }
  if (!state) {
    return NextResponse.json({ success: false, error: 'state is required' }, { status: 400 });
  }

  const persisted = serializeState(state);
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
}
