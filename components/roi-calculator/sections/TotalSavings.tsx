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
        background: 'linear-gradient(135deg, var(--roi-navy-dark) 0%, var(--mews-night-black) 50%, var(--roi-navy-mid) 100%)',
        boxShadow: '0 8px 32px color-mix(in srgb, var(--roi-navy-dark) 25%, transparent), 0 2px 8px color-mix(in srgb, var(--mews-black) 15%, transparent)',
      }}
    >
      {/* Decorative background glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 90% 20%, color-mix(in srgb, var(--mews-indigo) 25%, transparent) 0%, transparent 55%), radial-gradient(ellipse at 10% 80%, color-mix(in srgb, var(--mews-indigo) 12%, transparent) 0%, transparent 45%)',
        }}
      />
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(color-mix(in srgb, var(--mews-white) 50%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--mews-white) 50%, transparent) 1px, transparent 1px)',
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
                background: 'color-mix(in srgb, var(--mews-indigo) 20%, transparent)',
                border: '1px solid color-mix(in srgb, var(--mews-indigo) 30%, transparent)',
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
              background: 'color-mix(in srgb, var(--mews-white) 6%, transparent)',
              border: '1px solid color-mix(in srgb, var(--mews-white) 10%, transparent)',
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
              background: 'color-mix(in srgb, var(--mews-indigo) 15%, transparent)',
              border: '1px solid color-mix(in srgb, var(--mews-indigo) 30%, transparent)',
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
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--mews-indigo) 18%, transparent) 0%, color-mix(in srgb, var(--mews-indigo) 28%, transparent) 100%)',
              border: '1.5px solid color-mix(in srgb, var(--mews-indigo) 45%, transparent)',
              color: 'var(--roi-white)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, color-mix(in srgb, var(--mews-indigo) 30%, transparent) 0%, color-mix(in srgb, var(--mews-indigo) 42%, transparent) 100%)';
              (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--mews-indigo) 70%, transparent)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px color-mix(in srgb, var(--mews-indigo) 30%, transparent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, color-mix(in srgb, var(--mews-indigo) 18%, transparent) 0%, color-mix(in srgb, var(--mews-indigo) 28%, transparent) 100%)';
              (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--mews-indigo) 45%, transparent)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <Compass className="w-5 h-5 text-teal-300 group-hover:rotate-12 transition-transform duration-300" />
            <span>Start Discovery Process</span>
            <span
              className="ml-1 text-xs font-normal px-2 py-0.5 rounded-full"
              style={{ background: 'color-mix(in srgb, var(--mews-indigo) 25%, transparent)', color: 'color-mix(in srgb, var(--mews-white) 80%, transparent)' }}
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
                background: 'color-mix(in srgb, var(--mews-white) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--mews-white) 18%, transparent)',
                color: 'color-mix(in srgb, var(--mews-white) 85%, transparent)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-white) 18%, transparent)';
                (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--mews-white) 30%, transparent)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-white) 10%, transparent)';
                (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--mews-white) 18%, transparent)';
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
