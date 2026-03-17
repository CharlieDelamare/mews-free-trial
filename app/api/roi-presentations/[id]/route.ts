import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractMetadata } from '@/lib/roi-calculator/utils/persistence';
import type { PersistedState } from '@/lib/roi-calculator/utils/persistence';

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
  const { state } = await req.json() as { state: PersistedState };

  const meta = extractMetadata(state);

  await prisma.roiPresentation.update({
    where: { id },
    data: {
      stateJson: state as object,
      ...meta,
    },
  });

  return NextResponse.json({ success: true });
}
