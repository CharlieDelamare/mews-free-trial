'use client';

const statusConfig: Record<string, { badge: string; emoji: string; text: string }> = {
  building: { badge: 'bg-info-100 text-info-700', emoji: '🏗️', text: 'Building' },
  processing: { badge: 'bg-warning-50 text-warning-700', emoji: '⏳', text: 'Processing' },
  Updating: { badge: 'bg-warning-50 text-warning-700', emoji: '⏳', text: 'Processing' },
  completed: { badge: 'bg-success-100 text-success-700', emoji: '✅', text: 'Completed' },
  failed: { badge: 'bg-error-50 text-error-700', emoji: '❌', text: 'Failed' },
  failure: { badge: 'bg-error-50 text-error-700', emoji: '❌', text: 'Failed' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.completed;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}>
      <span aria-hidden="true">{config.emoji}</span> {config.text}
    </span>
  );
}

export function getStatusCardStyle(status: string): string {
  const cardStyles: Record<string, string> = {
    building: 'bg-info-50 border-info-100',
    processing: 'bg-warning-50 border-warning-100',
    Updating: 'bg-warning-50 border-warning-100',
    completed: 'bg-success-50 border-success-100',
    failed: 'bg-error-50 border-error-100',
    failure: 'bg-error-50 border-error-100',
  };
  return cardStyles[status] || cardStyles.completed;
}
