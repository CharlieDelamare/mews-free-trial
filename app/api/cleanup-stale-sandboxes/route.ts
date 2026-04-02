import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMewsClientToken, getMewsApiUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';
// Allow up to 5 minutes for large numbers of sandboxes
export const maxDuration = 300;

interface CheckResult {
  enterpriseId: string;
  enterpriseName: string;
  tokenCount: number;
  status: 'active' | 'stale' | 'error';
  reason?: string;
}

/**
 * Checks a single sandbox by calling configuration/get.
 * Returns true if the sandbox is still active, false if it's stale/gone.
 */
async function checkSandboxActive(
  accessToken: string,
  enterpriseId: string
): Promise<{ active: boolean; reason?: string }> {
  try {
    const url = `${getMewsApiUrl()}/api/connector/v1/configuration/get`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: getMewsClientToken(),
        AccessToken: accessToken,
        Client: 'Mews Sandbox Manager',
      }),
      signal: AbortSignal.timeout(15000), // 15s per request
    });

    if (response.ok) {
      return { active: true };
    }

    // Non-2xx means the sandbox is gone or token is invalid
    let errorDetail = `HTTP ${response.status}`;
    try {
      const body = await response.text();
      // Mews returns JSON error details
      const parsed = JSON.parse(body);
      if (parsed.Message) errorDetail = parsed.Message;
      else if (parsed.message) errorDetail = parsed.message;
    } catch {
      // body wasn't JSON, use status code
    }

    return { active: false, reason: errorDetail };
  } catch (err) {
    // Network timeout or connection error — don't delete, treat as unknown
    const message = err instanceof Error ? err.message : String(err);
    return { active: true, reason: `Network error (skipped): ${message}` };
  }
}

/**
 * GET /api/cleanup-stale-sandboxes
 *
 * Invoked by the Vercel cron job (weekly). Verifies CRON_SECRET before running.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return runCleanup(request);
}

/**
 * POST /api/cleanup-stale-sandboxes
 *
 * Checks every sandbox in the AccessToken table by calling configuration/get.
 * Removes AccessToken records for any sandbox that returns an error, indicating
 * the sandbox no longer exists in the Mews demo system.
 *
 * Query params:
 *   dryRun=true  — report stale sandboxes without deleting them
 */
export async function POST(request: Request) {
  return runCleanup(request);
}

async function runCleanup(request: Request) {
  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get('dryRun') === 'true';

  try {
    // Fetch all enabled tokens, grouped by enterpriseId
    const allTokens = await prisma.accessToken.findMany({
      where: { isEnabled: true },
      orderBy: { receivedAt: 'desc' },
    });

    if (allTokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sandboxes found in the database.',
        checked: 0,
        stale: 0,
        deleted: 0,
        results: [],
      });
    }

    // Deduplicate: one token per enterprise (most recent, already sorted desc)
    const enterpriseMap = new Map<
      string,
      { token: string; name: string; tokenIds: number[] }
    >();
    for (const row of allTokens) {
      if (!enterpriseMap.has(row.enterpriseId)) {
        enterpriseMap.set(row.enterpriseId, {
          token: row.accessToken,
          name: row.enterpriseName,
          tokenIds: [],
        });
      }
      enterpriseMap.get(row.enterpriseId)!.tokenIds.push(row.id);
    }

    const enterprises = Array.from(enterpriseMap.entries());
    console.log(
      `[CLEANUP-STALE] Checking ${enterprises.length} unique enterprise(s) from ${allTokens.length} total token(s)...`
    );

    const results: CheckResult[] = [];
    const staleEnterpriseIds: string[] = [];

    // Check each enterprise sequentially with a small delay to be respectful
    for (const [enterpriseId, { token, name, tokenIds }] of enterprises) {
      const { active, reason } = await checkSandboxActive(token, enterpriseId);

      if (active) {
        results.push({
          enterpriseId,
          enterpriseName: name,
          tokenCount: tokenIds.length,
          status: reason ? 'error' : 'active',
          reason,
        });
      } else {
        results.push({
          enterpriseId,
          enterpriseName: name,
          tokenCount: tokenIds.length,
          status: 'stale',
          reason,
        });
        staleEnterpriseIds.push(enterpriseId);
      }

      // Small delay between API calls to avoid rate limiting
      await new Promise((res) => setTimeout(res, 150));
    }

    const staleCount = staleEnterpriseIds.length;
    console.log(
      `[CLEANUP-STALE] Found ${staleCount} stale sandbox(es) out of ${enterprises.length} checked.`
    );

    let deletedTokenCount = 0;

    if (!dryRun && staleCount > 0) {
      const deleted = await prisma.accessToken.deleteMany({
        where: { enterpriseId: { in: staleEnterpriseIds } },
      });
      deletedTokenCount = deleted.count;
      console.log(
        `[CLEANUP-STALE] Deleted ${deletedTokenCount} AccessToken record(s) for ${staleCount} stale enterprise(s).`
      );
    }

    const staleResults = results.filter((r) => r.status === 'stale');
    const activeResults = results.filter((r) => r.status === 'active');
    const skippedResults = results.filter((r) => r.status === 'error');

    return NextResponse.json({
      success: true,
      dryRun,
      message: dryRun
        ? `Dry run complete. Found ${staleCount} stale sandbox(es) — nothing was deleted.`
        : `Cleanup complete. Removed ${staleCount} stale sandbox(es) (${deletedTokenCount} token record(s) deleted).`,
      checked: enterprises.length,
      stale: staleCount,
      deleted: dryRun ? 0 : deletedTokenCount,
      skipped: skippedResults.length,
      results: {
        stale: staleResults,
        active: activeResults,
        skipped: skippedResults,
      },
    });
  } catch (error) {
    console.error('[CLEANUP-STALE] Failed:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
