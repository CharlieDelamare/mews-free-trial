'use client';

import { ChevronRight, Users, CreditCard, TrendingUp } from 'lucide-react';
import type { ModuleKey } from '@/lib/roi-calculator/types/calculator';

const MODULE_ICONS: Record<ModuleKey, React.ElementType> = {
  guestExperience: Users,
  payment: CreditCard,
  rms: TrendingUp,
};

interface ModuleCardProps {
  moduleKey: ModuleKey;
  label: string;
  description: string;
  color: string;
  enabled: boolean;
  isActiveDetail: boolean;
  savings: number;
  time: number;
  currencySymbol: string;
  demoMode: boolean;
  onToggle: () => void;
  onViewDetails: () => void;
}

export default function ModuleCard({
  moduleKey,
  label,
  description,
  color,
  enabled,
  isActiveDetail,
  savings,
  time,
  currencySymbol,
  demoMode,
  onToggle,
  onViewDetails,
}: ModuleCardProps) {
  const Icon = MODULE_ICONS[moduleKey];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: enabled ? 'var(--mews-white)' : 'color-mix(in srgb, var(--mews-white) 50%, transparent)',
        border: isActiveDetail
          ? `2px solid ${color}`
          : `1px solid ${enabled ? 'color-mix(in srgb, var(--mews-charcoal) 8%, transparent)' : 'color-mix(in srgb, var(--mews-charcoal) 4%, transparent)'}`,
        boxShadow: isActiveDetail
          ? `0 4px 20px ${color}20, 0 2px 8px color-mix(in srgb, var(--mews-black) 6%, transparent)`
          : enabled
            ? '0 1px 4px color-mix(in srgb, var(--mews-black) 4%, transparent), 0 4px 16px color-mix(in srgb, var(--mews-charcoal) 5%, transparent)'
            : 'none',
        opacity: enabled ? 1 : 0.55,
        filter: enabled ? 'none' : 'grayscale(0.4)',
      }}
    >
      <div className="p-5">
        {/* Header row: icon + title + toggle */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}15`, border: `1px solid ${color}25` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate">{label}</h3>
              {!demoMode && (
                <p className="text-xs text-gray-400 truncate">{description}</p>
              )}
            </div>
          </div>

          {/* Toggle switch */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200 relative"
            style={{
              background: enabled ? color : 'color-mix(in srgb, var(--mews-charcoal) 12%, transparent)',
              boxShadow: enabled ? `0 2px 8px ${color}40` : 'none',
            }}
            aria-label={`${enabled ? 'Disable' : 'Enable'} ${label}`}
          >
            <div
              className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all duration-200"
              style={{
                left: enabled ? '22px' : '2px',
                boxShadow: '0 1px 3px color-mix(in srgb, var(--mews-black) 15%, transparent)',
              }}
            />
          </button>
        </div>

        {/* Metrics */}
        <div className="flex items-baseline gap-4 mb-4">
          <div>
            <span
              className={`font-bold tabular-nums ${demoMode ? 'text-2xl' : 'text-xl'}`}
              style={{ color: enabled ? color : 'var(--roi-gray-400)' }}
            >
              {currencySymbol}{savings.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 ml-1">/yr</span>
          </div>
          <div className="text-xs text-gray-400 tabular-nums">
            {time.toLocaleString()} hrs saved
          </div>
        </div>

        {/* View details button */}
        {enabled && !demoMode && (
          <button
            onClick={onViewDetails}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group"
            style={{
              background: isActiveDetail ? `${color}10` : 'color-mix(in srgb, var(--mews-charcoal) 3%, transparent)',
              color: isActiveDetail ? color : 'var(--roi-gray-500)',
              border: `1px solid ${isActiveDetail ? `${color}30` : 'color-mix(in srgb, var(--mews-charcoal) 6%, transparent)'}`,
            }}
            onMouseEnter={(e) => {
              if (!isActiveDetail) {
                (e.currentTarget as HTMLElement).style.background = `${color}08`;
                (e.currentTarget as HTMLElement).style.borderColor = `${color}20`;
                (e.currentTarget as HTMLElement).style.color = color;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActiveDetail) {
                (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-charcoal) 3%, transparent)';
                (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--mews-charcoal) 6%, transparent)';
                (e.currentTarget as HTMLElement).style.color = 'var(--roi-gray-500)';
              }
            }}
          >
            {isActiveDetail ? 'Hide Details' : 'View Details'}
            <ChevronRight
              className="w-3.5 h-3.5 transition-transform duration-200"
              style={{ transform: isActiveDetail ? 'rotate(90deg)' : 'rotate(0deg)' }}
            />
          </button>
        )}
      </div>
    </div>
  );
}
