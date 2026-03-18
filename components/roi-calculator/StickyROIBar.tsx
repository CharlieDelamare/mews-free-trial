'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Clock, FileDown, Monitor, MonitorOff } from 'lucide-react';
import type { FilteredResults } from '@/lib/roi-calculator/types/calculator';

interface StickyROIBarProps {
  filteredResults: FilteredResults;
  currencySymbol: string;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onExportClick: () => void;
  dashboardRef: React.RefObject<HTMLDivElement | null>;
}

export default function StickyROIBar({
  filteredResults,
  currencySymbol,
  demoMode,
  onToggleDemoMode,
  onExportClick,
  dashboardRef,
}: StickyROIBarProps) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const el = dashboardRef.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );

    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [dashboardRef]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        className="mx-auto max-w-5xl px-4"
        style={{
          paddingTop: '8px',
        }}
      >
        <div
          className="flex items-center justify-between gap-4 px-5 py-3 rounded-2xl"
          style={{
            background: 'color-mix(in srgb, var(--roi-navy-dark) 92%, transparent)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px color-mix(in srgb, var(--roi-navy-dark) 40%, transparent), 0 2px 8px color-mix(in srgb, var(--mews-black) 20%, transparent)',
            border: '1px solid color-mix(in srgb, var(--mews-indigo) 15%, transparent)',
          }}
        >
          {/* Left: key metrics */}
          <div className="flex items-center gap-6 overflow-hidden">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span className="text-white font-bold text-sm tabular-nums whitespace-nowrap">
                {currencySymbol}{filteredResults.totalSavings.toLocaleString()}
                <span className="text-white/40 font-normal text-xs ml-1">/yr</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              <span className="text-white/70 text-xs font-medium tabular-nums whitespace-nowrap">
                {filteredResults.totalTime.toLocaleString()} hrs
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-white/40 text-xs whitespace-nowrap">
                {filteredResults.contributions.length} module{filteredResults.contributions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onToggleDemoMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: demoMode ? 'color-mix(in srgb, var(--mews-indigo) 25%, transparent)' : 'color-mix(in srgb, var(--mews-white) 8%, transparent)',
                color: demoMode ? 'var(--roi-savings-highlight)' : 'color-mix(in srgb, var(--mews-white) 60%, transparent)',
                border: `1px solid ${demoMode ? 'color-mix(in srgb, var(--mews-indigo) 40%, transparent)' : 'color-mix(in srgb, var(--mews-white) 10%, transparent)'}`,
              }}
            >
              {demoMode ? <MonitorOff className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{demoMode ? 'Exit Demo' : 'Demo Mode'}</span>
            </button>
            <button
              onClick={onExportClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: 'color-mix(in srgb, var(--mews-white) 8%, transparent)',
                color: 'color-mix(in srgb, var(--mews-white) 60%, transparent)',
                border: '1px solid color-mix(in srgb, var(--mews-white) 10%, transparent)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-white) 15%, transparent)';
                (e.currentTarget as HTMLElement).style.color = 'color-mix(in srgb, var(--mews-white) 85%, transparent)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-white) 8%, transparent)';
                (e.currentTarget as HTMLElement).style.color = 'color-mix(in srgb, var(--mews-white) 60%, transparent)';
              }}
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
