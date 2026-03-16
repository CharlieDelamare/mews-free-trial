'use client';

import type { ModuleKey } from '@/lib/roi-calculator/types/calculator';

interface ModulePillProps {
  moduleKey: ModuleKey;
  label: string;
  color: string;
  savings: number;
  currencySymbol: string;
  enabled: boolean;
  isActive: boolean;
  onToggle: () => void;
  onSelect: () => void;
}

function formatShort(value: number, cs: string): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${cs}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${cs}${Math.round(value / 1_000)}k`;
  if (abs >= 1_000) return `${cs}${(value / 1_000).toFixed(1)}k`;
  return `${cs}${Math.round(value)}`;
}

export default function ModulePill({
  label,
  color,
  savings,
  currencySymbol,
  enabled,
  isActive,
  onToggle,
  onSelect,
}: ModulePillProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer select-none"
      style={{
        background: isActive
          ? 'rgba(255,255,255,0.95)'
          : enabled
            ? 'rgba(255,255,255,0.7)'
            : 'rgba(255,255,255,0.4)',
        border: isActive
          ? `2px solid ${color}`
          : '2px solid transparent',
        boxShadow: isActive
          ? `0 2px 12px ${color}25`
          : 'none',
        opacity: enabled ? 1 : 0.5,
      }}
      onClick={onSelect}
    >
      {/* Toggle switch */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="relative flex-shrink-0 w-8 h-[18px] rounded-full transition-colors duration-200"
        style={{
          background: enabled ? color : 'var(--roi-neutral-border)',
        }}
        aria-label={`Toggle ${label}`}
      >
        <span
          className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{
            transform: enabled ? 'translateX(16px)' : 'translateX(2px)',
          }}
        />
      </button>

      {/* Label + value */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
        <span className="text-sm font-semibold text-gray-700 truncate">{label}</span>
        {enabled && (
          <span className="text-xs font-bold text-gray-500 tabular-nums flex-shrink-0">
            {formatShort(savings, currencySymbol)}
          </span>
        )}
      </div>
    </div>
  );
}
