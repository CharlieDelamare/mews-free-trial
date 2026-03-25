import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractMetadata } from '@/lib/roi-calculator/utils/persistence';
import type { PersistedState } from '@/lib/roi-calculator/utils/persistence';

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

  let state: PersistedState | undefined;
  try {
    ({ state } = await req.json() as { state: PersistedState });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!state) {
    return NextResponse.json({ success: false, error: 'state is required' }, { status: 400 });
  }

  try {
    const persisted = state;
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
