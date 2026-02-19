import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const logs = await prisma.unifiedLog.findMany({
      where: {
        logType: 'environment',
        salesforceAccountId: { not: null },
      },
      select: {
        salesforceAccountId: true,
        enterpriseId: true,
        propertyName: true,
        customerEmail: true,
        status: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    // Deduplicate by salesforceAccountId, keeping the most recent entry
    const seen = new Set<string>();
    const accounts = logs.filter((log) => {
      const id = log.salesforceAccountId!;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return NextResponse.json({
      success: true,
      total: accounts.length,
      accounts,
    });
  } catch (error) {
    console.error('Error fetching Salesforce account IDs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Salesforce account IDs' },
      { status: 500 }
    );
  }
}
