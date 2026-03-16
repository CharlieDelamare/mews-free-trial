import { loggedFetch } from '@/lib/api-call-logger';
import { fetchBookableServices } from '@/lib/mews-data-service';
import type { DashboardMetrics, RoomStatusSummary } from '@/types/control-centre';

const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews-demo.com';
const CLIENT_TOKEN = process.env.MEWS_CLIENT_TOKEN || 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';

function buildAuth(accessToken: string) {
  return { ClientToken: CLIENT_TOKEN, AccessToken: accessToken, Client: 'Mews Sandbox Manager' };
}

export async function getDashboardMetrics(accessToken: string, logId?: string): Promise<DashboardMetrics> {
  const fetchOpts = (body: object) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...buildAuth(accessToken), ...body }),
  });

  const doFetch = (url: string, body: object) =>
    logId
      ? loggedFetch(url, fetchOpts(body), { unifiedLogId: logId, group: 'setup' })
      : fetch(url, fetchOpts(body));

  // 1. Fetch bookable service IDs (required for versioned reservations endpoint)
  const services = await fetchBookableServices(CLIENT_TOKEN, accessToken);
  const serviceIds = services.map(s => s.id);

  // 2. Room occupancy state
  const occupancyRes = await doFetch(
    `${MEWS_API_URL}/api/connector/v1/resources/getOccupancyState`,
    {}
  );
  const occupancyData = await occupancyRes.json();
  const states: Array<{ State: string }> = occupancyData.ResourceOccupancyStates || [];

  const rooms: RoomStatusSummary = {
    total: states.length,
    clean: states.filter(s => s.State === 'Clean').length,
    dirty: states.filter(s => s.State === 'Dirty').length,
    inspected: states.filter(s => s.State === 'Inspected').length,
    outOfOrder: states.filter(s => s.State === 'OutOfOrder').length,
  };

  // 3. Today's arrivals & departures (versioned endpoint with ServiceIds filter)
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const reservationsUrl = `${MEWS_API_URL}/api/connector/v1/reservations/getAll/2023-06-06`;

  const [arrivalsRes, departuresRes] = await Promise.all([
    doFetch(reservationsUrl, {
      ServiceIds: serviceIds,
      ScheduledStartUtc: {
        StartUtc: todayStart.toISOString(),
        EndUtc: todayEnd.toISOString(),
      },
      States: ['Confirmed'],
      Limitation: { Count: 1000 },
    }),
    doFetch(reservationsUrl, {
      ServiceIds: serviceIds,
      ScheduledEndUtc: {
        StartUtc: todayStart.toISOString(),
        EndUtc: todayEnd.toISOString(),
      },
      States: ['Started'],
      Limitation: { Count: 1000 },
    }),
  ]);

  const arrivalsData = await arrivalsRes.json();
  const departuresData = await departuresRes.json();
  const arrivalsToday: number = (arrivalsData.Reservations || []).length;
  const departuresToday: number = (departuresData.Reservations || []).length;
  const checkedInCount: number = departuresToday; // Started = checked-in

  // 4. Overdue tasks
  const tasksRes = await doFetch(`${MEWS_API_URL}/api/connector/v1/tasks/getAll`, {
    Limitation: { Count: 1000 },
  });
  const tasksData = await tasksRes.json();
  const tasks: Array<{ DeadlineUtc: string | null; State: string }> = tasksData.Tasks || [];
  const nowIso = now.toISOString();
  const overdueTaskCount = tasks.filter(
    t => t.DeadlineUtc && t.DeadlineUtc < nowIso && t.State !== 'Closed'
  ).length;

  return { rooms, arrivalsToday, departuresToday, checkedInCount, overdueTaskCount };
}
