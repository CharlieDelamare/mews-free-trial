'use client';

import { useState } from 'react';
import { TrendingDown, TrendingUp, Clock, ChevronDown } from 'lucide-react';
import type { ModuleContribution, ModuleKey, LeverDescriptor } from '@/lib/roi-calculator/types/calculator';

interface HeroNumberProps {
  totalSavings: number;
  costSavings: number;
  revenueUplift: number;
  totalTime: number;
  currencySymbol: string;
  contributions: ModuleContribution[];
  leverDescriptors: Record<ModuleKey, LeverDescriptor[]>;
}

function formatCompact(value: number, cs: string): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${cs}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${cs}${Math.round(value).toLocaleString()}`;
  return `${cs}${Math.round(value)}`;
}

type ExpandedMetric = 'cost' | 'revenue' | 'time' | null;

export default function HeroNumber({
  totalSavings,
  costSavings,
  revenueUplift,
  totalTime,
  currencySymbol,
  contributions,
  leverDescriptors,
}: HeroNumberProps) {
  const [expanded, setExpanded] = useState<ExpandedMetric>(null);

  const toggle = (metric: 'cost' | 'revenue' | 'time') => {
    setExpanded((prev) => (prev === metric ? null : metric));
  };

  // Collect all levers across enabled modules, filtered by type
  const getLeversForType = (type: 'costSaving' | 'revenueUplift' | 'timeReclaimed') => {
    const result: { lever: LeverDescriptor; color: string }[] = [];
    for (const c of contributions) {
      const levers = leverDescriptors[c.key] || [];
      for (const lever of levers) {
        if (lever.resultType === type && lever.resultValue > 0) {
          result.push({ lever, color: c.color });
        }
      }
    }
    return result;
  };

  const costLevers = getLeversForType('costSaving');
  const revenueLevers = getLeversForType('revenueUplift');
  const timeLevers = getLeversForType('timeReclaimed');

  // Helper to render an expandable metric section
  const renderExpandableSection = (
    metric: 'cost' | 'revenue' | 'time',
    levers: { lever: LeverDescriptor; color: string }[],
    icon: React.ReactNode,
    bgStyle: string,
    label: string,
    valueDisplay: React.ReactNode,
  ) => (
    <div className="flex flex-col items-start">
      <div
        className={`flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors duration-150 ${
          levers.length > 0 ? 'cursor-pointer hover:bg-gray-50/80' : ''
        }`}
        onClick={() => levers.length > 0 && toggle(metric)}
        role={levers.length > 0 ? 'button' : undefined}
        tabIndex={levers.length > 0 ? 0 : undefined}
        onKeyDown={(e) => {
          if (levers.length > 0 && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            toggle(metric);
          }
        }}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center`} style={{ background: bgStyle }}>
          {icon}
        </div>
        <div className="text-left">
          {valueDisplay}
          <span className="text-xs text-gray-400 ml-1.5">{label}</span>
        </div>
        {levers.length > 0 && (
          <ChevronDown
            className={`w-3 h-3 text-gray-300 transition-transform duration-300 ${
              expanded === metric ? 'rotate-180' : ''
            }`}
          />
        )}
      </div>
      {/* Expandable breakdown */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out w-full"
        style={{
          maxHeight: expanded === metric ? `${levers.length * 28 + 12}px` : '0px',
          opacity: expanded === metric ? 1 : 0,
        }}
      >
        <div className="pl-9 pt-1.5 space-y-1">
          {levers.map(({ lever, color }) => (
            <div key={lever.key} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-gray-500">{lever.label}</span>
              <span className="text-[11px] font-semibold text-gray-600 ml-auto tabular-nums">
                {lever.resultType === 'timeReclaimed'
                  ? `${Math.round(lever.resultValue).toLocaleString()} hrs`
                  : formatCompact(lever.resultValue, currencySymbol)
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="text-center py-6 md:py-10">
      {/* Main number */}
      <div
        className="font-bold tracking-tight leading-none gradient-text-teal"
        style={{ fontSize: 'clamp(3rem, 8vw, 4.5rem)' }}
      >
        {formatCompact(totalSavings, currencySymbol)}
      </div>
      <p className="text-gray-400 text-sm font-medium mt-2 tracking-wide uppercase">
        total annual impact
      </p>

      {/* Secondary stats */}
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mt-6">
        {renderExpandableSection(
          'cost',
          costLevers,
          <TrendingDown className="w-3.5 h-3.5 text-[#15803d]" />,
          '#D1F9D6',
          'cost savings',
          <span className="text-base font-bold text-gray-800 tabular-nums">{formatCompact(costSavings, currencySymbol)}</span>,
        )}

        {renderExpandableSection(
          'revenue',
          revenueLevers,
          <TrendingUp className="w-3.5 h-3.5 text-[#6d28d9]" />,
          '#F7E1F7',
          'revenue uplift',
          <span className="text-base font-bold text-gray-800 tabular-nums">{formatCompact(revenueUplift, currencySymbol)}</span>,
        )}

        {renderExpandableSection(
          'time',
          timeLevers,
          <Clock className="w-3.5 h-3.5 text-[#3f6212]" />,
          '#E8FF5B',
          'hours reclaimed',
          <span className="text-base font-bold text-gray-800 tabular-nums">{Math.round(totalTime).toLocaleString()}</span>,
        )}
      </div>
    </div>
  );
}
