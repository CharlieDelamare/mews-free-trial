import type { OtaSimulateParams, OtaSimulateResult } from '@/types/control-centre';
import { fetchMewsData } from '@/lib/mews-data-service';
import { getMewsApiUrl } from '@/lib/config';
import { loggedFetch } from '@/lib/api-call-logger';
import { buildMewsAuth } from '@/lib/mews-api';

const MEWS_API_URL = getMewsApiUrl();

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
    const mewsData = await fetchMewsData(buildMewsAuth(accessToken).ClientToken, accessToken);
    const rate = mewsData.rates[0];
    const category = mewsData.resourceCategories[0];

    if (!rate || !category) {
      return { success: false, channel: params.channel, error: 'No rates or categories available' };
    }

    // Create a customer first — required by reservations/add
    const customerRes = await loggedFetch(`${MEWS_API_URL}/api/connector/v1/customers/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...buildMewsAuth(accessToken),
        OverwriteExisting: false,
        LastName: `${OTA_SOURCE_NAMES[params.channel] || params.channel} Guest`,
      }),
    }, { unifiedLogId: 'control-centre', group: 'customers' });
    const customerData = await customerRes.json();
    const customerId: string | undefined = customerData.Customers?.[0]?.Id;
    if (!customerId) {
      return { success: false, channel: params.channel, error: customerData.Message || 'Failed to create customer' };
    }

    const url = `${MEWS_API_URL}/api/connector/v1/reservations/add`;
    const res = await loggedFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...buildMewsAuth(accessToken),
        ServiceId: mewsData.serviceId,
        Reservations: [
          {
            RateId: rate.id,
            RequestedCategoryId: category.id,
            StartUtc: `${params.checkIn}T14:00:00Z`,
            EndUtc: `${params.checkOut}T11:00:00Z`,
            PersonCounts: [{ AgeCategoryId: mewsData.ageCategories.adult, Count: params.guestCount }],
            ChannelName: OTA_SOURCE_NAMES[params.channel] || params.channel,
            CustomerId: customerId,
          },
        ],
      }),
    }, { unifiedLogId: 'control-centre', group: 'reservations' });

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
