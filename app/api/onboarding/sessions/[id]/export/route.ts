import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildOnboardingExcel } from '@/lib/onboarding-excel';
import type { ExcelData } from '@/types/onboarding';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const session = await prisma.onboardingSession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }
    if (!session.excelData) {
      return NextResponse.json({ success: false, error: 'No Excel data to export' }, { status: 400 });
    }

    const excelData = session.excelData as unknown as ExcelData;
    const buffer = buildOnboardingExcel(excelData);

    // Transition status from draft → exported (but don't downgrade if already pushed)
    if (session.status === 'draft') {
      await prisma.onboardingSession.update({
        where: { id },
        data: { status: 'exported' },
      });
    }

    const filename = session.propertyName
      ? `${session.propertyName.replace(/[^a-z0-9]/gi, '_')}_onboarding.xlsx`
      : `onboarding_${id}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (err) {
    console.error('[Onboarding] GET export failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to export Excel' }, { status: 500 });
  }
}
