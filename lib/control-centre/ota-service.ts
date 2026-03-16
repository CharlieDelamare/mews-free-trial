import type { OtaSimulateParams, OtaSimulateResult } from '@/types/control-centre';
import { fetchMewsData } from '@/lib/mews-data-service';

const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews-demo.com';
const CLIENT_TOKEN = process.env.MEWS_CLIENT_TOKEN || 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';

const OTA_SOURCE_NAMES: Record<string, string> = {
  booking_com: 'Booking.com',
  expedia: 'Expedia',
  airbnb: 'Airbnb',
  agoda: 'Agoda',
  direct: 'Direct',
};

export async function simulateOtaBooking(
  accessToken: string,
  params: OtaSimulateParams
): Promise<OtaSimulateResult> {
  try {
    const mewsData = await fetchMewsData(CLIENT_TOKEN, accessToken);
    const rate = mewsData.rates[0];
    const category = mewsData.resourceCategories[0];

    if (!rate || !category) {
      return { success: false, channel: params.channel, error: 'No rates or categories available' };
    }

    const url = `${MEWS_API_URL}/api/connector/v1/reservations/add`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: CLIENT_TOKEN,
        AccessToken: accessToken,
        Client: 'Mews Sandbox Manager',
        ServiceId: mewsData.serviceId,
        Reservations: [
          {
            RateId: rate.id,
            RequestedCategoryId: category.id,
            StartUtc: `${params.checkIn}T14:00:00Z`,
            EndUtc: `${params.checkOut}T11:00:00Z`,
            PersonCounts: [{ AgeCategoryId: mewsData.ageCategories.adult, Count: params.guestCount }],
            ChannelName: OTA_SOURCE_NAMES[params.channel] || params.channel,
          },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.Reservations?.[0]) {
      return { success: false, channel: params.channel, error: data.Message || `HTTP ${res.status}` };
    }

    return {
      success: true,
      channel: params.channel,
      reservationId: data.Reservations[0].Id,
    };
  } catch (error) {
    return {
      success: false,
      channel: params.channel,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
