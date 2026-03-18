'use client';

import { TrendingDown, TrendingUp, Clock, ChevronRight } from 'lucide-react';

interface LeverCardProps {
  label: string;
  value: number;
  currencySymbol: string;
  resultType: 'costSaving' | 'revenueUplift' | 'timeReclaimed';
  monetaryEquivalent?: number;
  isExpanded: boolean;
  onClick: () => void;
}

export default function LeverCard({
  label,
  value,
  currencySymbol,
  resultType,
  monetaryEquivalent,
  isExpanded,
  onClick,
}: LeverCardProps) {
  const isTime = resultType === 'timeReclaimed';
  const isCost = resultType === 'costSaving';

  const Icon = isTime ? Clock : isCost ? TrendingDown : TrendingUp;
  const accentColor = isTime ? 'var(--roi-module-gx)' : isCost ? 'var(--mews-success)' : 'var(--roi-module-payment)';
  const tagLabel = isTime ? 'time reclaimed' : isCost ? 'cost saving' : 'revenue uplift';

  const formatted = isTime
    ? `${Math.round(value).toLocaleString()} hrs`
    : Math.abs(value) >= 1000
      ? `${currencySymbol}${Math.round(value).toLocaleString()}`
      : `${currencySymbol}${Math.round(value)}`;

  const equivFormatted = monetaryEquivalent && monetaryEquivalent > 0
    ? `~${currencySymbol}${Math.round(monetaryEquivalent).toLocaleString()}/yr equivalent`
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl transition-all duration-200 group"
      style={{
        background: isExpanded ? `${accentColor}08` : 'color-mix(in srgb, var(--mews-white) 80%, transparent)',
        border: `1px solid ${isExpanded ? `${accentColor}30` : 'color-mix(in srgb, var(--mews-charcoal) 6%, transparent)'}`,
        boxShadow: isExpanded ? `0 2px 8px ${accentColor}10` : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isExpanded) {
          (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}25`;
          (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-white) 95%, transparent)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isExpanded) {
          (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--mews-charcoal) 6%, transparent)';
          (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-white) 80%, transparent)';
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-700 truncate">{label}</p>
          <p className="text-lg font-bold text-gray-900 tabular-nums mt-0.5">{formatted}</p>
          {equivFormatted && (
            <p className="text-[10px] text-gray-400 mt-0.5">{equivFormatted}</p>
          )}
          <div className="flex items-center gap-1 mt-1">
            <Icon className="w-3 h-3" style={{ color: accentColor }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accentColor }}>
              {tagLabel}
            </span>
          </div>
        </div>
        <ChevronRight
          className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-all duration-200 flex-shrink-0 mt-1"
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
      </div>
    </button>
  );
}
