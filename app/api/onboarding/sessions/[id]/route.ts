import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ExcelData, OnboardingAnswers } from '@/types/onboarding';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const session = await prisma.onboardingSession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, session });
  } catch (err) {
    console.error('[Onboarding] GET session failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to load session' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: {
    currentStep?: number;
    propertyName?: string;
    excelData?: ExcelData;
    answers?: OnboardingAnswers;
    status?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const existing = await prisma.onboardingSession.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const updated = await prisma.onboardingSession.update({
      where: { id },
      data: {
        ...(body.currentStep !== undefined && { currentStep: body.currentStep }),
        ...(body.propertyName !== undefined && { propertyName: body.propertyName }),
        ...(body.excelData !== undefined && { excelData: body.excelData as object }),
        ...(body.answers !== undefined && { answers: body.answers as object }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (err) {
    console.error('[Onboarding] PUT session failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.onboardingSession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Onboarding] DELETE session failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete session' }, { status: 500 });
  }
}
