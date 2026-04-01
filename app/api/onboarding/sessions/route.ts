import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseOnboardingExcel, summariseExcelData } from '@/lib/onboarding-excel';

export async function GET() {
  try {
    const sessions = await prisma.onboardingSession.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        propertyName: true,
        status: true,
        currentStep: true,
        createdBy: true,
        enterpriseId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ success: true, sessions });
  } catch (err) {
    console.error('[Onboarding] GET /api/onboarding/sessions failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to load sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? '';

    // File upload path
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const createdBy = formData.get('createdBy') as string | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'file is required' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const excelData = parseOnboardingExcel(buffer);
      const summary = summariseExcelData(excelData);

      const session = await prisma.onboardingSession.create({
        data: {
          propertyName: summary.propertyName ?? null,
          status: 'draft',
          currentStep: 0,
          createdBy: createdBy ?? null,
          excelData: excelData as object,
        },
      });

      return NextResponse.json({ success: true, session, summary });
    }

    // Empty session path (Start without file)
    const body = await req.json().catch(() => ({})) as { createdBy?: string };
    const session = await prisma.onboardingSession.create({
      data: {
        propertyName: null,
        status: 'draft',
        currentStep: 0,
        createdBy: body.createdBy ?? null,
      },
    });

    return NextResponse.json({ success: true, session, summary: null });
  } catch (err) {
    console.error('[Onboarding] POST /api/onboarding/sessions failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to create session' }, { status: 500 });
  }
}
