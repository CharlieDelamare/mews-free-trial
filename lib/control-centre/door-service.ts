import { fetchBookableServices } from '@/lib/mews-data-service';
import { getMewsApiUrl } from '@/lib/config';
import { loggedFetch } from '@/lib/api-call-logger';
import { buildMewsAuth } from '@/lib/mews-api';
import type { DoorAssignment, DoorsResult, DoorsProvisionResult } from '@/types/control-centre';

const MEWS_API_URL = getMewsApiUrl();

// Hardcoded room mappings for the TradeShow property
export const DOOR_ROOM_MAPPING: Record<string, string> = {
  '0201': 'Room 0201',
  '0202': 'Room 0202',
  '0203': 'Room 0203',
  '0204': 'Room 0204',
  '0205': 'Room 0205',
  '0206': 'Room 0206',
  '0207': 'Room 0207',
  '0208': 'Room 0208',
  '0209': 'Room 0209',
  '0210': 'Room 0210',
  '0211': 'Room 0211',
  '0212': 'Room 0212',
};

export async function getDoorAssignments(accessToken: string): Promise<DoorsResult> {
  const res = await loggedFetch(`${MEWS_API_URL}/api/connector/v1/resourceAccessTokens/getAll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...buildMewsAuth(accessToken),
      ActivityStates: ['Active'],
      Limitation: { Count: 1000 },
    }),
  }, { unifiedLogId: 'control-centre', group: 'rooms' });

  const data = await res.json();
  const tokens: Array<{
    Id: string;
    ServiceOrderId: string;
    Value: string;
    ValidityStartUtc?: string;
    ValidityEndUtc?: string;
  }> = data.ResourceAccessTokens || [];

  const assignments: DoorAssignment[] = tokens.map(t => ({
    reservationId: t.ServiceOrderId,
    guestName: '',
    roomName: '',
    tokenId: t.Id,
    tokenValue: t.Value,
    validFrom: t.ValidityStartUtc,
    validTo: t.ValidityEndUtc,
  }));

  return { assignments };
}

export async function provisionDoors(
  accessToken: string,
  reservationIds: string[]
): Promise<DoorsProvisionResult> {
  const result: DoorsProvisionResult = { successCount: 0, failureCount: 0, errors: [] };

  // Fetch reservation details to get validity dates
  const services = await fetchBookableServices(buildMewsAuth(accessToken).ClientToken, accessToken);
  const serviceIds = services.map(s => s.id);

  const resRes = await loggedFetch(`${MEWS_API_URL}/api/connector/v1/reservations/getAll/2023-06-06`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...buildMewsAuth(accessToken),
      ServiceIds: serviceIds,
      States: ['Confirmed', 'Started'],
      Limitation: { Count: 1000 },
    }),
  }, { unifiedLogId: 'control-centre', group: 'reservations' });
  const resData = await resRes.json();
  const reservations: Array<{ Id: string; ScheduledStartUtc: string; ScheduledEndUtc: string }> =
    resData.Reservations || [];
  const reservationMap = new Map(reservations.map(r => [r.Id, r]));

  // Batch into groups
  const BATCH_SIZE = 10;
  for (let i = 0; i < reservationIds.length; i += BATCH_SIZE) {
    const batch = reservationIds.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async reservationId => {
        const reservation = reservationMap.get(reservationId);
        const now = new Date();
        const validityStart = reservation?.ScheduledStartUtc ?? now.toISOString();
        const validityEnd = reservation?.ScheduledEndUtc
          ?? new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();

        // Generate a random 4-digit PIN
        const pin = String(Math.floor(1000 + Math.random() * 9000));

        const r = await loggedFetch(`${MEWS_API_URL}/api/connector/v1/resourceAccessTokens/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...buildMewsAuth(accessToken),
            ResourceAccessTokenParameters: [{
              ServiceOrderId: reservationId,
              Type: 'PinCode',
              Value: pin,
              ValidityStartUtc: validityStart,
              ValidityEndUtc: validityEnd,
              Permissions: {
                Bed: { Value: false },
                Room: { Value: true },
                Floor: { Value: false },
                Building: { Value: false },
              },
            }],
          }),
        }, { unifiedLogId: 'control-centre', group: 'rooms' });
        if (r.ok) result.successCount++;
        else {
          result.failureCount++;
          result.errors.push(`Failed to provision door for reservation ${reservationId}`);
        }
      })
    );
  }

  return result;
}

export async function recoverSplitDoors(accessToken: string): Promise<DoorsProvisionResult> {
  const result: DoorsProvisionResult = { successCount: 0, failureCount: 0, errors: [] };

  // Fetch service IDs required by the versioned reservations endpoint
  const services = await fetchBookableServices(buildMewsAuth(accessToken).ClientToken, accessToken);
  const serviceIds = services.map(s => s.id);

  // Fetch all started reservations using the versioned endpoint
  const res = await loggedFetch(`${MEWS_API_URL}/api/connector/v1/reservations/getAll/2023-06-06`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...buildMewsAuth(accessToken),
      ServiceIds: serviceIds,
      States: ['Started'],
      Limitation: { Count: 1000 },
    }),
  }, { unifiedLogId: 'control-centre', group: 'reservations' });

  const data = await res.json();
  const reservations: Array<{ Id: string }> = data.Reservations || [];

  if (reservations.length === 0) return result;

  const ids = reservations.map(r => r.Id);
  return provisionDoors(accessToken, ids);
}
