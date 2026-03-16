'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ModuleContribution, ModuleKey, LeverDescriptor } from '@/lib/roi-calculator/types/calculator';

interface WaterfallChartProps {
  contributions: ModuleContribution[];
  totalSavings: number;
  currencySymbol: string;
  leverDescriptors: Record<ModuleKey, LeverDescriptor[]>;
}

function formatValue(value: number, cs: string): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${cs}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${cs}${Math.round(value / 1_000).toLocaleString()}k`;
  return `${cs}${Math.round(value)}`;
}

export default function WaterfallChart({
  contributions,
  totalSavings,
  currencySymbol,
  leverDescriptors,
}: WaterfallChartProps) {
  const [expandedKey, setExpandedKey] = useState<ModuleKey | null>(null);

  if (contributions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Enable modules to see the impact breakdown
      </div>
    );
  }

  const maxValue = Math.max(...contributions.map((c) => c.savings), 1);

  const toggle = (key: ModuleKey) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  return (
    <div
      className="rounded-2xl p-5 md:p-6"
      style={{
        background: 'rgba(28,29,36,0.03)',
        border: '1px solid rgba(28,29,36,0.06)',
      }}
    >
      <div className="space-y-3">
        {contributions.map((c) => {
          const widthPercent = Math.max((c.savings / maxValue) * 100, 2);
          const levers = (leverDescriptors[c.key] || []).filter((l) => l.resultValue > 0);
          const isExpanded = expandedKey === c.key;
          const hasLevers = levers.length > 0;

          return (
            <div key={c.key}>
              {/* Clickable bar row */}
              <div
                className={`flex items-center gap-3 rounded-lg px-1 py-0.5 transition-colors duration-150 ${
                  hasLevers ? 'cursor-pointer hover:bg-gray-50/80' : ''
                }`}
                onClick={() => hasLevers && toggle(c.key)}
                onKeyDown={(e) => {
                  if (hasLevers && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    toggle(c.key);
                  }
                }}
                role={hasLevers ? 'button' : undefined}
                tabIndex={hasLevers ? 0 : undefined}
              >
                <span className="text-xs font-semibold text-gray-500 w-28 md:w-36 text-right truncate">
                  {c.label}
                </span>
                <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ background: 'rgba(28,29,36,0.04)' }}>
                  <div
                    className="h-full rounded-lg transition-all duration-700 ease-out flex items-center justify-end px-2"
                    style={{
                      width: `${widthPercent}%`,
                      background: `linear-gradient(90deg, ${c.color}20, ${c.color}90)`,
                      minWidth: '40px',
                    }}
                  >
                    <span
                      className="text-xs font-bold whitespace-nowrap"
                      style={{ color: c.color }}
                    >
                      {formatValue(c.savings, currencySymbol)}
                    </span>
                  </div>
                </div>
                {hasLevers && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-300 transition-transform duration-300 flex-shrink-0 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </div>

              {/* Expandable breakdown panel */}
              <div
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{
                  maxHeight: isExpanded ? `${levers.length * 80 + 24}px` : '0px',
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div className="ml-[7.5rem] md:ml-[9.75rem] mr-6 mt-1.5 mb-1 rounded-lg bg-gray-50/60 p-3 space-y-2.5">
                  {levers.map((lever) => (
                    <div key={lever.key}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="text-xs font-semibold text-gray-600 flex-1">
                          {lever.label}
                        </span>
                        <span
                          className="text-xs font-bold tabular-nums flex-shrink-0"
                          style={{ color: c.color }}
                        >
                          {lever.resultType === 'timeReclaimed'
                            ? `${Math.round(lever.resultValue).toLocaleString()} hrs`
                            : formatValue(lever.resultValue, currencySymbol)
                          }
                        </span>
                        {lever.resultType === 'timeReclaimed' && lever.monetaryEquivalent != null && lever.monetaryEquivalent > 0 && (
                          <span className="text-[10px] text-gray-400 tabular-nums flex-shrink-0">
                            (~{formatValue(lever.monetaryEquivalent, currencySymbol)})
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            lever.resultType === 'timeReclaimed'
                              ? 'bg-violet-50 text-violet-600'
                              : lever.resultType === 'costSaving'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {lever.resultType === 'timeReclaimed' ? 'Time Reclaimed' : lever.resultType === 'costSaving' ? 'Cost Saving' : 'Revenue'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 ml-3.5 leading-relaxed">
                        {lever.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Total divider + total */}
        <div className="flex items-center gap-3 pt-2" style={{ borderTop: '2px solid rgba(28,29,36,0.08)' }}>
          <span className="text-xs font-bold text-gray-700 w-28 md:w-36 text-right">
            Total
          </span>
          <div className="flex-1">
            <span className="text-base font-bold text-gray-800 tabular-nums">
              {formatValue(totalSavings, currencySymbol)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
