import { prisma } from '@/lib/prisma';
import { fetchMewsData } from '@/lib/mews-data-service';
import type {
  IbeTheme,
  IbeThemeConfig,
  IbeSearchParams,
  IbeSearchResult,
  IbeBookParams,
  IbeBookResult,
} from '@/types/control-centre';

const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews-demo.com';
const CLIENT_TOKEN = process.env.MEWS_CLIENT_TOKEN || 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';

export const IBE_THEME_CONFIG: Record<IbeTheme, IbeThemeConfig> = {
  luxury: {
    displayName: 'Luxury Retreat',
    markup: 0.25,
    primaryColor: '#1C1D24',
    description: 'Premium experiences for discerning travellers',
  },
  city: {
    displayName: 'City Break',
    markup: 0.10,
    primaryColor: '#172135',
    description: 'Urban escapes in the heart of the city',
  },
  resort: {
    displayName: 'Resort & Spa',
    markup: 0.20,
    primaryColor: '#222B28',
    description: 'Relaxation and wellness in a resort setting',
  },
  conference: {
    displayName: 'Conference & Events',
    markup: 0.15,
    primaryColor: '#2D3748',
    description: 'Professional venues for meetings and events',
  },
  budget: {
    displayName: 'Budget Smart',
    markup: 0.05,
    primaryColor: '#2C5282',
    description: 'Great value stays without compromising quality',
  },
};

export function getIbeThemeConfig(theme: IbeTheme): IbeThemeConfig {
  return IBE_THEME_CONFIG[theme];
}

export function applyMarkup(basePrice: number, theme: IbeTheme): number {
  const { markup } = IBE_THEME_CONFIG[theme];
  return Math.round(basePrice * (1 + markup) * 100) / 100;
}

export async function searchIbeAvailability(
  accessToken: string,
  params: IbeSearchParams
): Promise<IbeSearchResult[]> {
  const mewsData = await fetchMewsData(CLIENT_TOKEN, accessToken, {
    serviceId: params.serviceId,
  });

  const url = `${MEWS_API_URL}/api/connector/v1/services/getAvailability`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      ServiceId: mewsData.serviceId,
      FirstTimeUnitStartUtc: `${params.checkIn}T00:00:00Z`,
      LastTimeUnitStartUtc: `${params.checkOut}T00:00:00Z`,
    }),
  });

  const data = await res.json();
  const categoryAvailabilities: Array<{
    CategoryId: string;
    Availabilities: number[];
  }> = data.CategoryAvailabilities || [];

  const results: IbeSearchResult[] = [];

  for (const rate of mewsData.rates) {
    for (const cat of mewsData.resourceCategories) {
      const avail = categoryAvailabilities.find(
        a => a.CategoryId === cat.id
      );
      if (!avail || avail.Availabilities.every(a => a === 0)) continue;

      const basePrice = Math.floor(Math.random() * 100 + 80); // placeholder pricing
      results.push({
        rateId: rate.id,
        rateName: rate.name,
        basePrice,
        markedUpPrice: applyMarkup(basePrice, params.theme),
        currency: 'EUR',
        resourceCategoryId: cat.id,
        resourceCategoryName: cat.name,
      });
    }
  }

  return results;
}

export async function bookIbeReservation(
  accessToken: string,
  params: IbeBookParams
): Promise<IbeBookResult> {
  // Fetch age category ID for this service
  const mewsData = await fetchMewsData(CLIENT_TOKEN, accessToken, { serviceId: params.serviceId });

  // Create a customer profile first — customers/add requires LastName + OverwriteExisting
  const customerRes = await fetch(`${MEWS_API_URL}/api/connector/v1/customers/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      OverwriteExisting: false,
      FirstName: params.guestFirstName,
      LastName: params.guestLastName,
      Email: params.guestEmail,
    }),
  });
  const customerData = await customerRes.json();
  const customerId: string | undefined = customerData.Customers?.[0]?.Id;
  if (!customerId) {
    return { success: false, error: customerData.Message || 'Failed to create customer' };
  }

  const url = `${MEWS_API_URL}/api/connector/v1/reservations/add`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager',
      ServiceId: params.serviceId,
      Reservations: [
        {
          RateId: params.rateId,
          RequestedCategoryId: params.resourceCategoryId,
          StartUtc: `${params.checkIn}T14:00:00Z`,
          EndUtc: `${params.checkOut}T11:00:00Z`,
          PersonCounts: [{ AgeCategoryId: mewsData.ageCategories.adult, Count: params.guestCount }],
          CustomerId: customerId,
        },
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.Reservations?.[0]) {
    return { success: false, error: data.Message || `HTTP ${res.status}` };
  }

  const reservation = data.Reservations[0];

  // Create IbeSession record
  const session = await prisma.ibeSession.create({
    data: {
      enterpriseId: params.enterpriseId,
      theme: params.theme,
      reservationId: reservation.Id,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guestCount: params.guestCount,
      status: 'booked',
      completedAt: new Date(),
    },
  });

  return {
    success: true,
    reservationId: reservation.Id,
    confirmationNumber: reservation.Number,
    sessionId: session.id,
  };
}
