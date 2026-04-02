// components/roi-calculator/ExecSummaryPDFTemplate.tsx
// PDF-only rendering component — never shown in the UI.
// Rendered off-screen at 794px width; captured by html2canvas at scale:2.

'use client';

import { getModuleNarrativeHTML } from '@/lib/roi-calculator/utils/narratives';
import type { LeverDescriptor, ModuleKey } from '@/lib/roi-calculator/types/calculator';
import type { TranslationDictionary } from '@/lib/roi-calculator/types/translations';

interface ExecSummaryPDFTemplateProps {
  title: string;
  propertyContext: string;
  date: string;
  totalSavings: number;
  costSavings: number;
  revenueUplift: number;
  totalTime: number;
  currencySymbol: string;
  enabledModuleKeys: ModuleKey[];
  leverDescriptors: Record<ModuleKey, LeverDescriptor[]>;
  t: TranslationDictionary;
}

function fmt(value: number, cs: string): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${cs}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${cs}${Math.round(value / 1_000)}k`;
  return `${cs}${Math.round(value).toLocaleString()}`;
}

export default function ExecSummaryPDFTemplate({
  title,
  propertyContext,
  date,
  totalSavings,
  costSavings,
  revenueUplift,
  totalTime,
  currencySymbol,
  enabledModuleKeys,
  leverDescriptors,
  t,
}: ExecSummaryPDFTemplateProps) {
  const hotelName = title || 'Your property';
  const formattedTotal = `${currencySymbol}${Math.round(totalSavings).toLocaleString()}`;

  return (
    <div
      style={{
        width: '794px',
        minHeight: '1123px',
        background: '#fff',
        fontFamily: "'Inter', -apple-system, sans-serif",
        color: '#1C1D24',
        overflow: 'hidden',
      }}
    >
      {/* Dark header */}
      <div
        style={{
          background: '#1C1D24',
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#FF83DA', letterSpacing: '-0.5px' }}>
          mews
        </div>
        <div style={{ textAlign: 'right', fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' }}>
          ROI Business Case<br />
          {hotelName} · {date}<br />
          {propertyContext}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '28px 32px' }}>
        {/* Headline */}
        <div
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: '#1C1D24',
            lineHeight: 1.3,
            marginBottom: '20px',
            letterSpacing: '-0.4px',
          }}
        >
          {hotelName} generates{' '}
          <span style={{ color: '#FF83DA' }}>{formattedTotal}/year</span>
          {' '}in total impact with Mews
        </div>

        {/* Two-column layout: narratives + sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '24px' }}>
          {/* Narrative paragraphs — one per enabled module */}
          <div>
            {enabledModuleKeys.map((moduleKey) => {
              const html = getModuleNarrativeHTML(moduleKey, leverDescriptors[moduleKey] ?? [], currencySymbol, t);
              if (!html) return null;
              return (
                <p
                  key={moduleKey}
                  style={{ fontSize: '11px', lineHeight: '1.75', color: '#444', marginBottom: '12px' }}
                  // Safe: html is generated from translation template literals, no user input
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            })}
          </div>

          {/* Sidebar — pink left border, key numbers */}
          <div style={{ borderLeft: '3px solid #FF83DA', paddingLeft: '16px', paddingTop: '2px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: '#1C1D24' }}>
                {fmt(totalSavings, currencySymbol)}
              </div>
              <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginTop: '2px' }}>
                {t.labels.totalAnnualImpact}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#D1F9D6' }}>
                {fmt(costSavings, currencySymbol)}
              </div>
              <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginTop: '2px' }}>
                {t.labels.costSavings}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FF83DA' }}>
                {fmt(revenueUplift, currencySymbol)}
              </div>
              <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginTop: '2px' }}>
                {t.labels.revenueUplift}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FF5303' }}>
                {Math.round(totalTime).toLocaleString()}
              </div>
              <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginTop: '2px' }}>
                {t.labels.hoursReclaimed}
              </div>
            </div>
          </div>
        </div>

        {/* Dark footer bar */}
        <div
          style={{
            background: '#1C1D24',
            borderRadius: '8px',
            padding: '14px 20px',
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)' }}>
              {t.labels.totalAnnualImpact}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#FF83DA' }}>
              {fmt(totalSavings, currencySymbol)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)' }}>
              {t.labels.costSavings}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              {fmt(costSavings, currencySymbol)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)' }}>
              {t.labels.revenueUplift}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              {fmt(revenueUplift, currencySymbol)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)' }}>
              {t.labels.hoursReclaimed}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#FF5303' }}>
              {Math.round(totalTime).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
