'use client';

const statusConfig: Record<string, { badge: string; label: string }> = {
  building: { badge: 'bg-blue-200 text-blue-800', label: '🏗️ Building' },
  processing: { badge: 'bg-yellow-200 text-yellow-800', label: '⏳ Processing' },
  Updating: { badge: 'bg-yellow-200 text-yellow-800', label: '⏳ Processing' },
  completed: { badge: 'bg-green-200 text-green-800', label: '✅ Completed' },
  failed: { badge: 'bg-red-200 text-red-800', label: '❌ Failed' },
  failure: { badge: 'bg-red-200 text-red-800', label: '❌ Failed' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.completed;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}>
      {config.label}
    </span>
  );
}

export function getStatusCardStyle(status: string): string {
  const cardStyles: Record<string, string> = {
    building: 'bg-blue-50 border-blue-200',
    processing: 'bg-yellow-50 border-yellow-200',
    Updating: 'bg-yellow-50 border-yellow-200',
    completed: 'bg-green-50 border-green-200',
    failed: 'bg-red-50 border-red-200',
    failure: 'bg-red-50 border-red-200',
  };
  return cardStyles[status] || cardStyles.completed;
}
