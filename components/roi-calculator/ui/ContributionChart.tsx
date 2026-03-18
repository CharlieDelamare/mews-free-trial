'use client';

import { useState } from 'react';
import type { ModuleContribution } from '@/lib/roi-calculator/types/calculator';

interface ContributionChartProps {
  contributions: ModuleContribution[];
  totalSavings: number;
  currencySymbol: string;
}

export default function ContributionChart({ contributions, totalSavings, currencySymbol }: ContributionChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (totalSavings <= 0 || contributions.length === 0) {
    return (
      <div className="h-10 rounded-xl bg-white/5 flex items-center justify-center">
        <span className="text-xs text-white/30">Enable modules to see contribution breakdown</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-10 rounded-xl overflow-hidden gap-0.5">
        {contributions.map((c, i) => {
          const pct = Math.max(2, (c.savings / totalSavings) * 100);
          const isHovered = hoveredIndex === i;
          return (
            <div
              key={c.key}
              className="relative flex items-center justify-center transition-all duration-300 cursor-default"
              style={{
                width: `${pct}%`,
                minWidth: '24px',
                backgroundColor: c.color,
                opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1,
                transform: isHovered ? 'scaleY(1.08)' : 'scaleY(1)',
                borderRadius: i === 0 ? '12px 2px 2px 12px' : i === contributions.length - 1 ? '2px 12px 12px 2px' : '2px',
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {pct > 12 && (
                <span className="text-[11px] font-bold text-white/90 truncate px-2">
                  {Math.round((c.savings / totalSavings) * 100)}%
                </span>
              )}
              {/* Tooltip */}
              {isHovered && (
                <div
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 px-3 py-2 rounded-lg whitespace-nowrap"
                  style={{
                    background: 'color-mix(in srgb, var(--mews-black) 85%, transparent)',
                    boxShadow: '0 4px 16px color-mix(in srgb, var(--mews-black) 30%, transparent)',
                  }}
                >
                  <p className="text-xs font-bold text-white">{c.label}</p>
                  <p className="text-xs text-white/70">
                    {currencySymbol}{c.savings.toLocaleString()}/yr &middot; {Math.round((c.savings / totalSavings) * 100)}%
                  </p>
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                    style={{ background: 'color-mix(in srgb, var(--mews-black) 85%, transparent)', marginTop: '-4px' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {contributions.map((c) => (
          <div key={c.key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: c.color }} />
            <span className="text-[11px] text-white/60 font-medium">{c.label}</span>
            <span className="text-[11px] text-white/40 tabular-nums">
              {currencySymbol}{c.savings.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
