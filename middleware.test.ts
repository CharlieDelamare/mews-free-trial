import { describe, it, expect } from 'vitest';

// The middleware logic exempts certain paths from auth checks.
// We test the exemption list in isolation (Edge API not available in Vitest).
describe('middleware route exemptions', () => {
  // Keep in sync with EXEMPT_PREFIXES in middleware.ts
  const EXEMPT_PREFIXES = [
    '/api/auth/',
    '/api/webhook/',
    '/api/cleanup-stale-sandboxes/',
    '/api/cleanup-stuck-logs/',
  ];

  function isExempt(pathname: string): boolean {
    return EXEMPT_PREFIXES.some(p => pathname.startsWith(p));
  }

  it('exempts NextAuth callback routes', () => {
    expect(isExempt('/api/auth/callback/google')).toBe(true);
    expect(isExempt('/api/auth/session')).toBe(true);
    expect(isExempt('/api/auth/signin')).toBe(true);
  });

  it('exempts the Mews webhook route', () => {
    expect(isExempt('/api/webhook/access-token')).toBe(true);
  });

  it('exempts cron endpoints', () => {
    expect(isExempt('/api/cleanup-stale-sandboxes/')).toBe(true);
    expect(isExempt('/api/cleanup-stuck-logs/')).toBe(true);
  });

  it('does NOT exempt regular API routes', () => {
    expect(isExempt('/api/create-trial')).toBe(false);
    expect(isExempt('/api/logs')).toBe(false);
    expect(isExempt('/api/debug')).toBe(false);
    expect(isExempt('/api/environments/list')).toBe(false);
    expect(isExempt('/api/roi-presentations')).toBe(false);
    expect(isExempt('/api/store-environment')).toBe(false);
    expect(isExempt('/api/salesforce-accounts')).toBe(false);
  });
});
