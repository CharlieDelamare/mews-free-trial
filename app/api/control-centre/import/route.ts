import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveAccessToken } from '@/lib/reservations';
import { runInBackground } from '@/lib/background';
import { flushApiCallLogs } from '@/lib/api-call-logger';
import { parseCsvText, chunkArray } from '@/lib/control-centre/csv-parser';
import { fetchMewsData } from '@/lib/mews-data-service';

const CLIENT_TOKEN = process.env.MEWS_CLIENT_TOKEN || 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';
const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews-demo.com';

export async function POST(request: NextRequest) {
  try {
    const { enterpriseId, csvText } = await request.json();
    if (!enterpriseId) return NextResponse.json({ success: false, error: 'enterpriseId is required' }, { status: 400 });
    if (!csvText) return NextResponse.json({ success: false, error: 'csvText is required' }, { status: 400 });

    // Parse and validate CSV in-request
    const { rows, errors } = parseCsvText(csvText);
    if (errors.length > 0) return NextResponse.json({ success: false, validationErrors: errors }, { status: 400 });

    const { token, error } = await resolveAccessToken(enterpriseId);
    if (error || !token) return NextResponse.json({ success: false, error: error || 'Token not found' }, { status: 404 });

    const tokenRecord = await prisma.accessToken.findFirst({ where: { accessToken: token, isEnabled: true }, orderBy: { receivedAt: 'desc' } });
    if (!tokenRecord) return NextResponse.json({ success: false, error: 'Access token not found' }, { status: 404 });

    const log = await prisma.controlCentreLog.create({
      data: { logType: 'import', enterpriseId, status: 'processing', totalItems: rows.length, successCount: 0, failureCount: 0 },
    });

    const work = (async () => {
      try {
        const mewsData = await fetchMewsData(CLIENT_TOKEN, token, { logId: log.id });
        const batches = chunkArray(rows, 166);
        let successCount = 0;
        let failureCount = 0;

        for (const batch of batches) {
          const reservations = batch.map(row => ({
            ServiceId: mewsData.serviceId,
            RateId: mewsData.rates[0]?.id,
            RequestedCategoryId: mewsData.resourceCategories[0]?.id,
            StartUtc: `${row.CheckIn}T14:00:00Z`,
            EndUtc: `${row.CheckOut}T11:00:00Z`,
            PersonCounts: [{ AgeCategoryId: mewsData.ageCategories.adult, Count: row.GuestCount }],
            BookerFirstName: row.GuestFirstName,
            BookerLastName: row.GuestLastName,
          }));

          const res = await fetch(`${MEWS_API_URL}/api/connector/v1/reservations/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ClientToken: CLIENT_TOKEN,
              AccessToken: token,
              Client: 'Mews Sandbox Manager',
              Reservations: reservations,
            }),
          });

          const data = await res.json();
          if (res.ok && data.Reservations) {
            successCount += data.Reservations.length;
            failureCount += batch.length - data.Reservations.length;
          } else {
            failureCount += batch.length;
          }

          await prisma.controlCentreLog.update({
            where: { id: log.id },
            data: { successCount, failureCount },
          });
        }

        await prisma.controlCentreLog.update({
          where: { id: log.id },
          data: { status: 'completed', completedAt: new Date(), successCount, failureCount },
        });
      } catch (err) {
        await prisma.controlCentreLog.update({
          where: { id: log.id },
          data: { status: 'failed', completedAt: new Date(), errorMessage: err instanceof Error ? err.message : 'Unknown error' },
        });
      }
    })().finally(() => flushApiCallLogs().catch(console.error));

    runInBackground(work);

    return NextResponse.json({ success: true, logId: log.id, preview: rows.slice(0, 10) });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
