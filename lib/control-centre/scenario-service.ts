import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';
import { fetchMewsData } from '@/lib/mews-data-service';
import { createReservationsForEnvironment } from '@/lib/reservation-service';
import type { ScenarioType, ScenarioConfig } from '@/types/control-centre';

const CLIENT_TOKEN = process.env.MEWS_CLIENT_TOKEN || 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';

export const SCENARIO_CONFIG: Record<ScenarioType, ScenarioConfig> = {
  individual: {
    guestCount: 20,
    dateSpreadDays: 30,
    priceRangeMin: 80,
    priceRangeMax: 200,
    label: 'Individual Travellers',
    description: 'Solo and couple bookings, mix of leisure and business',
  },
  groups: {
    guestCount: 40,
    dateSpreadDays: 14,
    priceRangeMin: 60,
    priceRangeMax: 150,
    label: 'Group Bookings',
    description: 'Multi-room group blocks with shared billing',
  },
  hostel: {
    guestCount: 50,
    dateSpreadDays: 21,
    priceRangeMin: 20,
    priceRangeMax: 60,
    label: 'Hostel / Dorm',
    description: 'Dorm-style bookings with high volume, short stays',
  },
  long_stay: {
    guestCount: 10,
    dateSpreadDays: 90,
    priceRangeMin: 50,
    priceRangeMax: 120,
    label: 'Long Stay',
    description: 'Extended stays of 7+ nights',
  },
  packages: {
    guestCount: 15,
    dateSpreadDays: 45,
    priceRangeMin: 150,
    priceRangeMax: 350,
    label: 'Packages',
    description: 'Room + extras packages with products',
  },
  multi_service: {
    guestCount: 25,
    dateSpreadDays: 30,
    priceRangeMin: 100,
    priceRangeMax: 250,
    label: 'Multi-Service',
    description: 'Bookings spanning multiple bookable services',
  },
};

export async function provisionScenario(
  accessToken: string,
  enterpriseId: string,
  accessTokenId: number,
  scenarioType: ScenarioType,
  logId: string
): Promise<void> {
  const config = SCENARIO_CONFIG[scenarioType];

  try {
    await prisma.unifiedLog.update({
      where: { id: logId },
      data: { status: 'processing', totalItems: config.guestCount },
    });

    const mewsData = await fetchMewsData(CLIENT_TOKEN, accessToken, { logId });

    const now = new Date();
    const result = await createReservationsForEnvironment(
      accessToken,
      enterpriseId,
      accessTokenId,
      {
        // No logId — avoids UnifiedLog stat updates which expect an environment log ID
        reservationCount: config.guestCount,
        mewsData,
        dateRange: { start: now, end: addDays(now, config.dateSpreadDays) },
      }
    );

    await prisma.unifiedLog.update({
      where: { id: logId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        successCount: result?.successCount ?? config.guestCount,
        failureCount: result?.failureCount ?? 0,
        operationDetails: { scenarioType, config, serviceId: mewsData.serviceId },
      },
    });
  } catch (error) {
    await prisma.unifiedLog.update({
      where: { id: logId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}
