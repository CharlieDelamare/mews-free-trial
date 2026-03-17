import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractMetadata, serializeState } from '@/lib/roi-calculator/utils/persistence';
import type { CalculatorState } from '@/lib/roi-calculator/types/calculator';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const presentation = await prisma.roiPresentation.findUnique({ where: { id } });
  if (!presentation) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, presentation });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { state } = await req.json() as { state: CalculatorState };

  if (!state) {
    return NextResponse.json({ success: false, error: 'state is required' }, { status: 400 });
  }

  const persisted = serializeState(state);
  const meta = extractMetadata(persisted);

  await prisma.roiPresentation.update({
    where: { id },
    data: {
      stateJson: persisted as object,
      ...meta,
    },
  });

  return NextResponse.json({ success: true });
}
