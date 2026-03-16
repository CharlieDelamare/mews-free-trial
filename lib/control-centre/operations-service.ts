import { loggedFetch } from '@/lib/api-call-logger';
import { fetchBookableServices } from '@/lib/mews-data-service';
import type { OperationResult } from '@/types/control-centre';

const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews-demo.com';
const CLIENT_TOKEN = process.env.MEWS_CLIENT_TOKEN || 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';

function buildAuth(accessToken: string) {
  return { ClientToken: CLIENT_TOKEN, AccessToken: accessToken, Client: 'Mews Sandbox Manager' };
}

function postFetch(accessToken: string, logId?: string) {
  return (url: string, payload: object) => {
    const opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...buildAuth(accessToken), ...payload }),
    };
    return logId
      ? loggedFetch(url, opts, { unifiedLogId: logId, group: 'setup' })
      : fetch(url, opts);
  };
}

export async function inspectAllRooms(accessToken: string, logId?: string): Promise<OperationResult> {
  const doFetch = postFetch(accessToken, logId);
  const result: OperationResult = { successCount: 0, failureCount: 0, errors: [] };

  const res = await doFetch(`${MEWS_API_URL}/api/connector/v1/resources/getAll`, {
    States: ['Dirty', 'Clean'],
    Limitation: { Count: 1000 },
  });
  const data = await res.json();
  // Filter to Space discriminator only — excludes beds/objects within rooms
  const toInspect: Array<{ Id: string }> = (data.Resources || []).filter(
    (r: { Data?: { Discriminator?: string } }) => r.Data?.Discriminator === 'Space'
  );

  await Promise.allSettled(
    toInspect.map(async s => {
      const r = await doFetch(`${MEWS_API_URL}/api/connector/v1/resources/update`, {
        ResourceUpdates: [{ ResourceId: s.Id, State: 'Inspected' }],
      });
      if (r.ok) {
        result.successCount++;
      } else {
        result.failureCount++;
        result.errors.push(`Failed to inspect room ${s.Id}`);
      }
    })
  );

  return result;
}

export async function morningPrep(accessToken: string, logId?: string): Promise<OperationResult> {
  const doFetch = postFetch(accessToken, logId);
  const result: OperationResult = { successCount: 0, failureCount: 0, errors: [] };

  // Fetch bookable service IDs (required for versioned reservations endpoint)
  const services = await fetchBookableServices(CLIENT_TOKEN, accessToken);
  const serviceIds = services.map(s => s.id);

  // Fix check-in/check-out times for today's reservations
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const arrivalsRes = await doFetch(`${MEWS_API_URL}/api/connector/v1/reservations/getAll/2023-06-06`, {
    ServiceIds: serviceIds,
    ScheduledStartUtc: { StartUtc: todayStart.toISOString(), EndUtc: todayEnd.toISOString() },
    States: ['Confirmed', 'Started'],
    Limitation: { Count: 1000 },
  });
  const arrivalsData = await arrivalsRes.json();
  const reservations: Array<{ Id: string; ScheduledStartUtc: string; ScheduledEndUtc: string }> =
    arrivalsData.Reservations || [];

  // Fix times to 07:30 check-in / 06:00 check-out
  const dateStr = now.toISOString().split('T')[0];
  const checkInTime = `${dateStr}T07:30:00Z`;
  const checkOutTime = new Date(now);
  checkOutTime.setDate(checkOutTime.getDate() + 1);
  const checkOutStr = checkOutTime.toISOString().split('T')[0];
  const checkOutTimeStr = `${checkOutStr}T06:00:00Z`;

  await Promise.allSettled(
    reservations.map(async r => {
      const updateRes = await doFetch(`${MEWS_API_URL}/api/connector/v1/reservations/updateInterval`, {
        ReservationId: r.Id,
        StartUtc: checkInTime,
        EndUtc: checkOutTimeStr,
        SendEmail: false,
      });
      if (updateRes.ok) result.successCount++;
      else {
        result.failureCount++;
        result.errors.push(`Failed to update interval for ${r.Id}`);
      }
    })
  );

  // Then inspect all rooms
  const inspectResult = await inspectAllRooms(accessToken, logId);
  result.successCount += inspectResult.successCount;
  result.failureCount += inspectResult.failureCount;
  result.errors.push(...inspectResult.errors);

  return result;
}

export async function closeOverdueTasks(accessToken: string, logId?: string): Promise<OperationResult> {
  const doFetch = postFetch(accessToken, logId);
  const result: OperationResult = { successCount: 0, failureCount: 0, errors: [] };

  const tasksRes = await doFetch(`${MEWS_API_URL}/api/connector/v1/tasks/getAll`, {
    Limitation: { Count: 1000 },
  });
  const tasksData = await tasksRes.json();
  const now = new Date().toISOString();
  const overdue = (tasksData.Tasks || []).filter(
    (t: { DeadlineUtc: string | null; State: string }) =>
      t.DeadlineUtc && t.DeadlineUtc < now && t.State !== 'Closed'
  );

  await Promise.allSettled(
    overdue.map(async (t: { Id: string }) => {
      const r = await doFetch(`${MEWS_API_URL}/api/connector/v1/tasks/update`, {
        TaskId: t.Id,
        State: 'Closed',
      });
      if (r.ok) result.successCount++;
      else {
        result.failureCount++;
        result.errors.push(`Failed to close task ${t.Id}`);
      }
    })
  );

  return result;
}

export async function autoCheckout(accessToken: string, logId?: string): Promise<OperationResult> {
  const doFetch = postFetch(accessToken, logId);
  const result: OperationResult = { successCount: 0, failureCount: 0, errors: [] };

  // Fetch bookable service IDs (required for versioned reservations endpoint)
  const services = await fetchBookableServices(CLIENT_TOKEN, accessToken);
  const serviceIds = services.map(s => s.id);

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const res = await doFetch(`${MEWS_API_URL}/api/connector/v1/reservations/getAll/2023-06-06`, {
    ServiceIds: serviceIds,
    ScheduledEndUtc: { StartUtc: todayStart.toISOString(), EndUtc: todayEnd.toISOString() },
    States: ['Started'],
    Limitation: { Count: 1000 },
  });
  const data = await res.json();
  const reservations: Array<{ Id: string }> = data.Reservations || [];

  await Promise.allSettled(
    reservations.map(async r => {
      const processRes = await doFetch(`${MEWS_API_URL}/api/connector/v1/reservations/process`, {
        ReservationIds: [r.Id],
        SendEmail: false,
      });
      if (processRes.ok) result.successCount++;
      else {
        result.failureCount++;
        result.errors.push(`Failed to check out reservation ${r.Id}`);
      }
    })
  );

  return result;
}
