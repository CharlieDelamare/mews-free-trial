import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractMetadata, serializeState } from '@/lib/roi-calculator/utils/persistence';
import type { CalculatorState } from '@/lib/roi-calculator/types/calculator';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const presentation = await prisma.roiPresentation.findUnique({ where: { id } });
    if (!presentation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, presentation });
  } catch (err) {
    console.error('[ROI] GET /api/roi-presentations/[id] failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to load presentation' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let state: CalculatorState | undefined;
  try {
    ({ state } = await req.json() as { state: CalculatorState });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!state) {
    return NextResponse.json({ success: false, error: 'state is required' }, { status: 400 });
  }

  try {
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
  } catch (err: unknown) {
    const isPrismaNotFound =
      typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2025';
    if (isPrismaNotFound) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    console.error('[ROI] PATCH /api/roi-presentations/[id] failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to save presentation' }, { status: 500 });
  }
}
