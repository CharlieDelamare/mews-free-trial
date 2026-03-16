import type { DoorAssignment, DoorsResult, DoorsProvisionResult } from '@/types/control-centre';

const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews-demo.com';
const CLIENT_TOKEN = process.env.MEWS_CLIENT_TOKEN || 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';

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

function buildAuth(accessToken: string) {
  return { ClientToken: CLIENT_TOKEN, AccessToken: accessToken, Client: 'Mews Sandbox Manager' };
}

export async function getDoorAssignments(accessToken: string): Promise<DoorsResult> {
  const res = await fetch(`${MEWS_API_URL}/api/connector/v1/resourceAccessTokens/getAll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...buildAuth(accessToken),
      IsActive: true,
      Limitation: { Count: 1000 },
    }),
  });

  const data = await res.json();
  const tokens: Array<{
    Id: string;
    ReservationId: string;
    Value: string;
    ValidityStartUtc?: string;
    ValidityEndUtc?: string;
  }> = data.ResourceAccessTokens || [];

  const assignments: DoorAssignment[] = tokens.map(t => ({
    reservationId: t.ReservationId,
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

  // Batch into groups
  const BATCH_SIZE = 10;
  for (let i = 0; i < reservationIds.length; i += BATCH_SIZE) {
    const batch = reservationIds.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async reservationId => {
        const r = await fetch(`${MEWS_API_URL}/api/connector/v1/resourceAccessTokens/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...buildAuth(accessToken),
            ReservationId: reservationId,
            Type: 'PinCode',
          }),
        });
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

  // Fetch all split reservations (Started state, multiple segments)
  const res = await fetch(`${MEWS_API_URL}/api/connector/v1/reservations/getAll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...buildAuth(accessToken),
      States: ['Started'],
      Limitation: { Count: 1000 },
    }),
  });

  const data = await res.json();
  const reservations: Array<{ Id: string }> = data.Reservations || [];

  if (reservations.length === 0) return result;

  const ids = reservations.map(r => r.Id);
  return provisionDoors(accessToken, ids);
}
