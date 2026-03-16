'use client';

import { TrendingUp, FileDown, Clock, Sparkles, Compass } from 'lucide-react';

interface TotalSavingsProps {
  totalSavings: number;
  totalTime: number;
  currencySymbol: string;
  onExportClick?: () => void;
  onDiscoveryClick?: () => void;
}

export default function TotalSavings({ totalSavings, totalTime, currencySymbol, onExportClick, onDiscoveryClick }: TotalSavingsProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, #002347 0%, var(--mews-night-black) 50%, #004080 100%)',
        boxShadow: '0 8px 32px rgba(0,35,71,0.25), 0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      {/* Decorative background glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 90% 20%, rgba(179,178,251,0.25) 0%, transparent 55%), radial-gradient(ellipse at 10% 80%, rgba(179,178,251,0.12) 0%, transparent 45%)',
        }}
      />
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative p-6 md:p-8">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(179,178,251,0.2)',
                border: '1px solid rgba(179,178,251,0.3)',
              }}
            >
              <TrendingUp className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-white font-bold text-lg">Total Annual ROI</h2>
                <Sparkles className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-white/50 text-xs">Combined impact from all Mews features</p>
            </div>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Time Saved */}
          <div
            className="rounded-xl p-4 md:p-5"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-teal-400/80" />
              <span className="text-white/50 text-xs uppercase tracking-widest font-medium">Time Saved</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-white tabular-nums">
              {totalTime.toLocaleString()}
              <span className="text-lg font-medium text-white/60 ml-1">hrs</span>
            </div>
            <div className="text-white/40 text-xs mt-1">per year</div>
          </div>

          {/* Annual Savings */}
          <div
            className="rounded-xl p-4 md:p-5"
            style={{
              background: 'rgba(179,178,251,0.15)',
              border: '1px solid rgba(179,178,251,0.3)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3.5 h-3.5 rounded-full bg-teal-400/60 flex-shrink-0" />
              <span className="text-teal-300/80 text-xs uppercase tracking-widest font-medium">Annual Savings</span>
            </div>
            <div
              className="text-2xl md:text-3xl font-bold tabular-nums"
              style={{ color: 'var(--roi-savings-highlight)' }}
            >
              {currencySymbol}{' '}
              {totalSavings.toLocaleString()}
            </div>
            <div className="text-teal-400/50 text-xs mt-1">per year</div>
          </div>
        </div>

        {/* Discovery button */}
        {onDiscoveryClick && (
          <button
            onClick={onDiscoveryClick}
            className="w-full group flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 mb-3"
            style={{
              background: 'linear-gradient(135deg, rgba(179,178,251,0.18) 0%, rgba(179,178,251,0.28) 100%)',
              border: '1.5px solid rgba(179,178,251,0.45)',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(179,178,251,0.30) 0%, rgba(179,178,251,0.42) 100%)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(179,178,251,0.70)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(179,178,251,0.30)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(179,178,251,0.18) 0%, rgba(179,178,251,0.28) 100%)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(179,178,251,0.45)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <Compass className="w-5 h-5 text-teal-300 group-hover:rotate-12 transition-transform duration-300" />
            <span>Start Discovery Process</span>
            <span
              className="ml-1 text-xs font-normal px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(179,178,251,0.25)', color: 'rgba(255,255,255,0.80)' }}
            >
              Sandler Style
            </span>
          </button>
        )}

        {/* Export button */}
        {onExportClick && (
          <div className="flex justify-end">
            <button
              onClick={onExportClick}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.85)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.18)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)';
              }}
            >
              <FileDown className="w-4 h-4" />
              Save as PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
