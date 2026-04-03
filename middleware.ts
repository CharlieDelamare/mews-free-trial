import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Paths that bypass session auth.
 * - /api/auth/   — NextAuth's own callback and session routes
 * - /api/webhook/ — Mews webhook, handles its own WEBHOOK_SECRET verification
 * - /api/cleanup-* — Cron jobs, use CRON_SECRET header auth
 */
const EXEMPT_PREFIXES = [
  '/api/auth/',
  '/api/webhook/',
  '/api/cleanup-stale-sandboxes',
  '/api/cleanup-stuck-logs',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (EXEMPT_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
