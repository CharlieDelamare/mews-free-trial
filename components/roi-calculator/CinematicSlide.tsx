'use client';

import { TrendingDown, TrendingUp, Clock } from 'lucide-react';
import { getModuleNarrative } from '@/lib/roi-calculator/utils/narratives';
import type { LeverDescriptor, ModuleKey, FilteredResults } from '@/lib/roi-calculator/types/calculator';
import type { TranslationDictionary } from '@/lib/roi-calculator/types/translations';

interface TitleSlideProps {
  type: 'title';
  title?: string;
  propertyContext: string;
  totalSavings: number;
  costSavings: number;
  revenueUplift: number;
  totalTime: number;
  currencySymbol: string;
  t: TranslationDictionary;
}

interface ModuleSlideProps {
  type: 'module';
  moduleKey: ModuleKey;
  label: string;
  color: string;
  totalSavings: number;
  levers: LeverDescriptor[];
  currencySymbol: string;
  t: TranslationDictionary;
}

interface SummarySlideProps {
  type: 'summary';
  filteredResults: FilteredResults;
  currencySymbol: string;
  leverDescriptors: Record<ModuleKey, LeverDescriptor[]>;
  t: TranslationDictionary;
}

type CinematicSlideProps = TitleSlideProps | ModuleSlideProps | SummarySlideProps;

function formatBig(value: number, cs: string): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${cs}${(value / 1_000_000).toFixed(1)}M`;
  return `${cs}${Math.round(value).toLocaleString()}`;
}

export default function CinematicSlide(props: CinematicSlideProps) {
  if (props.type === 'title') {
    const { t } = props;
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-16 animate-fade-in w-full">
        {/* Eyebrow / property context */}
        <p
          className="text-xs font-medium uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {props.propertyContext}
        </p>

        {/* Hotel name */}
        {props.title && (
          <h1 className="text-xl font-semibold text-white mb-6 tracking-tight">{props.title}</h1>
        )}

        {/* Hero number */}
        <div
          className="font-extrabold tracking-tight leading-none text-white"
          style={{ fontSize: 'clamp(5rem, 12vw, 8rem)' }}
        >
          {formatBig(props.totalSavings, props.currencySymbol)}
        </div>

        {/* Subtext */}
        <p
          className="mt-4 text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {t.labels.totalAnnualImpact}
        </p>

        {/* Divider */}
        <div
          className="my-8 w-24"
          style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }}
        />

        {/* KPI row */}
        <div className="flex gap-12 justify-center">
          {/* Cost savings */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
              style={{ background: 'color-mix(in srgb, var(--mews-light-green) 12%, transparent)' }}
            >
              ↓
            </div>
            <span
              className="text-2xl font-extrabold tracking-tight tabular-nums"
              style={{ color: 'var(--mews-light-green)' }}
            >
              {formatBig(props.costSavings, props.currencySymbol)}
            </span>
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {t.labels.costSavings}
            </span>
          </div>

          {/* Revenue uplift */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
              style={{ background: 'color-mix(in srgb, var(--mews-primary-pink) 12%, transparent)' }}
            >
              ↑
            </div>
            <span
              className="text-2xl font-extrabold tracking-tight tabular-nums"
              style={{ color: 'var(--mews-primary-pink)' }}
            >
              {formatBig(props.revenueUplift, props.currencySymbol)}
            </span>
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {t.labels.revenueUplift}
            </span>
          </div>

          {/* Hours reclaimed */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
              style={{ background: 'color-mix(in srgb, var(--mews-orange) 12%, transparent)' }}
            >
              ◷
            </div>
            <span
              className="text-2xl font-extrabold tracking-tight tabular-nums"
              style={{ color: 'var(--mews-orange)' }}
            >
              {Math.round(props.totalTime).toLocaleString()}
            </span>
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {t.labels.hoursReclaimed}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (props.type === 'module') {
    const { t } = props;
    const narrative = getModuleNarrative(props.moduleKey, props.levers, props.currencySymbol, t);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-3.5 h-3.5 rounded-full" style={{ background: props.color }} />
          <h2 className="text-xl font-bold text-white">{props.label}</h2>
        </div>
        <div
          className="font-bold tracking-tight leading-none text-white"
          style={{ fontSize: 'clamp(2rem, 7vw, 3.5rem)' }}
        >
          {formatBig(props.totalSavings, props.currencySymbol)}
        </div>
        <p className="text-gray-500 text-xs font-medium mt-2 uppercase tracking-wider">{t.labels.annualImpact}</p>
        {narrative && (
          <p className="text-gray-500 text-[13px] max-w-2xl mt-2 leading-relaxed line-clamp-3">
            {narrative}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3 mt-6 max-w-3xl w-full">
          {props.levers.map((lever) => {
            const leverLabel = t.levers[lever.key as keyof typeof t.levers] || lever.label;
            const formulaSummary = lever.summaryParams && t.formulas[lever.key as keyof typeof t.formulas]
              ? t.formulas[lever.key as keyof typeof t.formulas](lever.summaryParams)
              : lever.summary;
            return (
              <div
                key={lever.key}
                className="p-3 rounded-xl text-left"
                style={{
                  width: 'calc(33.333% - 0.5rem)',
                  minWidth: '160px',
                  background: 'color-mix(in srgb, var(--mews-white) 5%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--mews-white) 8%, transparent)',
                }}
              >
                <p className="text-xs text-gray-400 font-medium truncate">{leverLabel}</p>
                <p className="text-lg font-bold text-white tabular-nums mt-0.5">
                  {lever.resultType === 'timeReclaimed'
                    ? `${Math.round(lever.resultValue).toLocaleString()} ${t.labels.hrs}`
                    : formatBig(lever.resultValue, props.currencySymbol)
                  }
                </p>
                {lever.resultType === 'timeReclaimed' && lever.monetaryEquivalent != null && lever.monetaryEquivalent > 0 && (
                  <p className="text-[10px] text-gray-500">
                    ~{formatBig(lever.monetaryEquivalent, props.currencySymbol)}/yr
                  </p>
                )}
                <p
                  className="text-[9px] font-semibold uppercase tracking-wider mt-0.5"
                  style={{ color: lever.resultType === 'timeReclaimed' ? 'var(--roi-module-gx)' : lever.resultType === 'costSaving' ? 'var(--mews-success)' : 'var(--roi-module-payment)' }}
                >
                  {t.leverResultType[lever.resultType]}
                </p>
                {formulaSummary && (
                  <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed line-clamp-3">
                    {formulaSummary}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Summary slide — horizontal layout: left total + KPIs, right waterfall
  const { t } = props;
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-8 animate-fade-in">
      <div className="flex items-center gap-12 max-w-4xl w-full">
        {/* Left: total + KPIs */}
        <div className="flex-shrink-0 text-center" style={{ minWidth: '240px' }}>
          <h2 className="text-lg font-bold text-white mb-4">{t.labels.impactSummary}</h2>
          <div
            className="font-bold text-white"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}
          >
            {formatBig(props.filteredResults.totalSavings, props.currencySymbol)}
          </div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">{t.labels.totalAnnualImpact}</p>

          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" style={{ color: 'var(--mews-light-green)' }} />
              <span className="text-base font-bold tabular-nums" style={{ color: 'var(--mews-light-green)' }}>{formatBig(props.filteredResults.costSavings, props.currencySymbol)}</span>
              <span className="text-xs text-gray-500">{t.labels.costSavings}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--mews-primary-pink)' }} />
              <span className="text-base font-bold tabular-nums" style={{ color: 'var(--mews-primary-pink)' }}>{formatBig(props.filteredResults.revenueUplift, props.currencySymbol)}</span>
              <span className="text-xs text-gray-500">{t.labels.revenueUplift}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: 'var(--mews-orange)' }} />
              <span className="text-base font-bold tabular-nums" style={{ color: 'var(--mews-orange)' }}>{Math.round(props.filteredResults.totalTime).toLocaleString()}</span>
              <span className="text-xs text-gray-500">{t.labels.hoursReclaimed}</span>
            </div>
          </div>
        </div>

        {/* Right: waterfall bars */}
        <div className="flex-1 space-y-4">
          {props.filteredResults.contributions.map((c) => {
            const maxVal = Math.max(...props.filteredResults.contributions.map((x) => x.savings), 1);
            const width = Math.max((c.savings / maxVal) * 100, 8);
            const maxTime = Math.max(...props.filteredResults.contributions.map((x) => x.time), 1);
            const timeWidth = c.time > 0 ? Math.max((c.time / maxTime) * 100, 8) : 0;
            const levers = (props.leverDescriptors[c.key] || []).filter((l) => l.resultValue > 0);
            const moneyLevers = levers.filter((l) => l.resultType !== 'timeReclaimed');
            const timeLevers = levers.filter((l) => l.resultType === 'timeReclaimed');
            const moduleLabel = t.modules[c.key as keyof typeof t.modules] || c.label;
            return (
              <div key={c.key}>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-40 text-right truncate flex-shrink-0">{moduleLabel}</span>
                  <div className="flex-1 flex flex-col gap-1.5">
                    {/* Monetary bar */}
                    <div className="h-8 rounded-lg overflow-hidden" style={{ background: 'color-mix(in srgb, var(--mews-white) 5%, transparent)' }}>
                      <div
                        className="h-full rounded-lg flex items-center justify-start px-4"
                        style={{
                          width: `${width}%`,
                          background: `linear-gradient(90deg, ${c.color}40, ${c.color})`,
                          minWidth: '80px',
                        }}
                      >
                        <span className="text-sm font-bold text-white whitespace-nowrap">
                          {formatBig(c.savings, props.currencySymbol)}
                        </span>
                      </div>
                    </div>
                    {/* Hours reclaimed bar */}
                    {c.time > 0 && (
                      <div className="h-5 rounded-md overflow-hidden" style={{ background: 'color-mix(in srgb, var(--mews-white) 3%, transparent)' }}>
                        <div
                          className="h-full rounded-md flex items-center justify-start px-3"
                          style={{
                            width: `${timeWidth}%`,
                            background: 'linear-gradient(90deg, color-mix(in srgb, var(--roi-module-gx) 25%, transparent), color-mix(in srgb, var(--roi-module-gx) 70%, transparent))',
                            minWidth: '70px',
                          }}
                        >
                          <span className="text-[11px] font-semibold whitespace-nowrap flex items-center gap-1" style={{ color: 'var(--mews-orange)' }}>
                            <Clock className="w-3 h-3" />
                            {Math.round(c.time).toLocaleString()} {t.labels.hrs}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {levers.length > 0 && (
                  <div className="text-[10px] text-gray-500 ml-[10.75rem] mt-1 leading-relaxed">
                    {moneyLevers.length > 0 && (
                      <p>
                        {moneyLevers.map((l, i) => {
                          const leverLabel = t.levers[l.key as keyof typeof t.levers] || l.label;
                          return (
                            <span key={l.key}>
                              {leverLabel} {formatBig(l.resultValue, props.currencySymbol)}
                              {i < moneyLevers.length - 1 ? ' · ' : ''}
                            </span>
                          );
                        })}
                      </p>
                    )}
                    {timeLevers.length > 0 && (
                      <p style={{ color: 'var(--mews-orange)' }}>
                        {timeLevers.map((l, i) => {
                          const leverLabel = t.levers[l.key as keyof typeof t.levers] || l.label;
                          return (
                            <span key={l.key}>
                              {leverLabel} {Math.round(l.resultValue).toLocaleString()} {t.labels.hrs}
                              {i < timeLevers.length - 1 ? ' · ' : ''}
                            </span>
                          );
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
