import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pushOnboardingSession } from '@/lib/onboarding-push';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const session = await prisma.onboardingSession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }
    if (!session.enterpriseId || !session.accessTokenId) {
      return NextResponse.json(
        { success: false, error: 'Environment not yet linked. Complete Export step first.' },
        { status: 400 },
      );
    }

    // Fetch the access token for this session
    const tokenRecord = await prisma.accessToken.findFirst({
      where: { id: session.accessTokenId },
    });
    if (!tokenRecord) {
      return NextResponse.json({ success: false, error: 'Access token not found' }, { status: 400 });
    }

    const results = await pushOnboardingSession(session, tokenRecord.accessToken);

    const allSucceeded = results.every((r) => r.status !== 'failed');
    if (allSucceeded) {
      await prisma.onboardingSession.update({
        where: { id },
        data: { status: 'pushed' },
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error('[Onboarding] POST push failed:', err);
    return NextResponse.json({ success: false, error: 'Push failed' }, { status: 500 });
  }
}
