'use client';

import type { DashboardMetrics } from '@/types/control-centre';

interface Props {
  metrics: DashboardMetrics | null;
  loading: boolean;
}

export default function DashboardTab({ metrics, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <p className="text-neutral-500 text-sm">Select a property to view dashboard metrics.</p>
    );
  }

  const stats = [
    { label: 'Arrivals Today', value: metrics.arrivalsToday, color: 'text-blue-600' },
    { label: 'Departures Today', value: metrics.departuresToday, color: 'text-orange-600' },
    { label: 'Checked In', value: metrics.checkedInCount, color: 'text-green-600' },
    { label: 'Overdue Tasks', value: metrics.overdueTaskCount, color: metrics.overdueTaskCount > 0 ? 'text-red-600' : 'text-gray-600' },
  ];

  return (
    <div className="space-y-6">
      {metrics.overdueTaskCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-red-500 text-lg">⚠</span>
          <p className="text-sm text-red-700 font-medium">
            {metrics.overdueTaskCount} overdue task{metrics.overdueTaskCount !== 1 ? 's' : ''} require attention
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-neutral-700 mb-4">Room Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: metrics.rooms.total, bg: 'bg-neutral-100' },
            { label: 'Clean', value: metrics.rooms.clean, bg: 'bg-green-100' },
            { label: 'Dirty', value: metrics.rooms.dirty, bg: 'bg-red-100' },
            { label: 'Inspected', value: metrics.rooms.inspected, bg: 'bg-blue-100' },
            { label: 'Out of Order', value: metrics.rooms.outOfOrder, bg: 'bg-yellow-100' },
          ].map(item => (
            <div key={item.label} className={`${item.bg} rounded-lg p-3 text-center`}>
              <p className="text-xs text-neutral-600 mb-1">{item.label}</p>
              <p className="text-2xl font-bold text-mews-night-black">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
