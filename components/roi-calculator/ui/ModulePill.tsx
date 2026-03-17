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
      className="inline-flex items-center rounded-2xl border-2 bg-white transition-all duration-200"
      style={{
        borderColor: isActive ? color : enabled ? color + '40' : '#e5e7eb',
        boxShadow: isActive ? `0 2px 12px ${color}30` : 'none',
        opacity: enabled ? 1 : 0.55,
      }}
    >
      {/* ── Toggle switch — its own button, no nesting tricks ── */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={`${enabled ? 'Disable' : 'Enable'} ${label}`}
        className="flex-shrink-0 w-10 h-6 rounded-full mx-2 my-2 relative transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ background: enabled ? color : '#d1d5db' }}
      >
        <span
          className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: enabled ? 'translateX(18px)' : 'translateX(3px)' }}
        />
      </button>

      {/* ── Label + value — separate button for detail expand ── */}
      <button
        type="button"
        onClick={onSelect}
        className="flex items-center gap-2 pr-3 py-2 focus:outline-none"
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
        <span className="text-sm font-bold text-gray-800 whitespace-nowrap">{label}</span>
        {enabled && savings > 0 && (
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color }}
          >
            {formatShort(savings, currencySymbol)}
          </span>
        )}
      </button>
    </div>
  );
}
