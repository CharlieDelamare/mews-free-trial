'use client';

import { TrendingUp, TrendingDown, Clock, Users, CreditCard, BarChart3, BedDouble } from 'lucide-react';
import { getTranslations } from '@/lib/roi-calculator/translations';
import type { LanguageCode } from '@/lib/roi-calculator/types/translations';

interface PDFData {
  title?: string;
  hotelName?: string;
  country: string;
  hotelType: string;
  currencySymbol: string;
  totalSavings: number;
  totalTime: number;
  presentationLanguage?: LanguageCode;
  sections: {
    guestExperience?: {
      inputs: {
        reservationsPerMonth: number;
        checkInTime: number;
        checkOutTime: number;
        averageStaffWage: number;
        mewsCheckInTime: number;
        mewsCheckOutTime: number;
        roomAssignmentTime: number;
        averageDailyRate: number;
        onlineCheckInPercentage: number;
        revenueUplift: number;
        directBookingIncrease: number;
        averageCommission: number;
      };
      checkInSavings: {
        annualCheckInTimeSaved: number;
        annualCheckOutTimeSaved: number;
        annualTotalCostSavings: number;
      };
      roomAssignmentSavings: {
        annualTimeSaved: number;
        annualCostSaving: number;
      };
      upsellRevenue: number;
      commissionSaved: number;
      totalTime: number;
      totalSavings: number;
    };
    payment?: {
      inputs: {
        transactionsPerMonth: number;
        secondsPerTransaction: number;
        processingWage: number;
        chargebackRate: number;
        mewsChargebackRate: number;
        reconciliationTimeDaily: number;
        monthlyRevenue: number;
        noShowRate: number;
        noShowWithoutFee: number;
        foreignCurrencyPercent: number;
        multiCurrencyAdoption: number;
        revenueShare: number;
      };
      tokenizationTimeSaved: number;
      tokenizationCostSavings: number;
      chargebackReduction: number;
      reconciliationTimeSaved: number;
      reconciliationCostSavings: number;
      noShowRevenue: number;
      multiCurrencyRevenue: number;
      totalTime: number;
      totalSavings: number;
    };
    rms?: {
      inputs: {
        hotelRevPAR: number;
        numberOfRooms: number;
        numberOfRatePlans: number;
        rateUpdateFrequency: string;
        numberOfChannels: number;
        avgTimeToUpdateRate: number;
        hasRevenueManager: boolean;
        hasExistingRMS: boolean;
        estimatedRevenueUplift: number;
      };
      annualRevenueGain: number;
      annualHoursSaved: number;
      annualLaborCostSavings: number;
      totalTime: number;
      totalSavings: number;
    };
    housekeeping?: {
      roomAssignmentHours: number;
      roomAssignmentCost: number;
      cleaningStatusHours: number;
      cleaningStatusCost: number;
      maintenanceCommHours: number;
      maintenanceCommCost: number;
      taskMgmtHours: number;
      taskMgmtCost: number;
      amenitiesCostSaved: number;
      paperCostSaved: number;
      totalTime: number;
      totalSavings: number;
    };
  };
}

interface PDFTemplateProps {
  data: PDFData;
}

const SLIDE_WIDTH = 1056;
const SLIDE_HEIGHT = 816;

function formatBig(value: number, cs: string): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${cs}${(value / 1_000_000).toFixed(1)}M`;
  return `${cs}${Math.round(value).toLocaleString()}`;
}

const formatMinutes = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  if (minutes >= 1) return `${Math.round(minutes)}m`;
  return `${Math.round(minutes * 60)}s`;
};

/* ── Shared slide wrapper ─────────────────────────────────────────────── */
function Slide({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="slide-page"
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        background: 'linear-gradient(145deg, var(--roi-pdf-bg-dark) 0%, var(--roi-pdf-bg-mid) 40%, var(--roi-pdf-bg-dark) 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Subtle grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }}
      />
      {/* Accent glow */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          right: '-80px',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(179,178,251,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

/* ── Metric card ──────────────────────────────────────────────────────── */
function MetricCard({
  label,
  value,
  accent = '#b3b2fb', // --mews-indigo
  sub,
}: {
  label: string;
  value: string;
  accent?: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: '16px 20px',
        flex: 1,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent, lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

/* ── Lever row ────────────────────────────────────────────────────────── */
function LeverRow({
  label,
  value,
  type,
  equivalent,
  typeLabels,
}: {
  label: string;
  value: string;
  type: 'cost' | 'revenue' | 'time';
  equivalent?: string;
  typeLabels: { cost: string; revenue: string; time: string };
}) {
  const colorMap = {
    cost: { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },    // --roi-pdf-emerald
    revenue: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' }, // --roi-pdf-blue
    time: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },   // --roi-pdf-violet
  };
  const style = colorMap[type];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{value}</span>
        {equivalent && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>({equivalent})</span>
        )}
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: style.color,
            background: style.bg,
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {typeLabels[type]}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */

export default function PDFTemplate({ data }: PDFTemplateProps) {
  const t = getTranslations(data.presentationLanguage ?? 'en');
  const cs = data.currencySymbol;
  const formatCurrency = (v: number) => `${cs}${v.toLocaleString()}`;
  const typeLabels = {
    cost: t.leverResultType.costSaving,
    revenue: t.leverResultType.revenueUplift,
    time: t.leverResultType.timeReclaimed,
  };

  /* ── SlideFooter ──────────────────────────────────────────────────── */
  const SlideFooter = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px 20px',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {t.slideFooter}
      </span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>
        {new Date().toLocaleDateString()}
      </span>
    </div>
  );

  /* ── Compute cost vs revenue split ──────────────────────────────────── */
  let costSavings = 0;
  let revenueUplift = 0;
  const ge = data.sections.guestExperience;
  const pm = data.sections.payment;
  const rm = data.sections.rms;
  const hk = data.sections.housekeeping;
  if (ge) {
    costSavings += ge.commissionSaved + ge.checkInSavings.annualTotalCostSavings + ge.roomAssignmentSavings.annualCostSaving;
    revenueUplift += ge.upsellRevenue;
  }
  if (pm) {
    costSavings += pm.chargebackReduction + pm.tokenizationCostSavings + pm.reconciliationCostSavings;
    revenueUplift += pm.noShowRevenue + pm.multiCurrencyRevenue;
  }
  if (rm) {
    costSavings += rm.annualLaborCostSavings;
    revenueUplift += rm.annualRevenueGain;
  }
  if (hk) {
    costSavings += hk.roomAssignmentCost + hk.cleaningStatusCost + hk.maintenanceCommCost + hk.taskMgmtCost + hk.amenitiesCostSaved + hk.paperCostSaved;
  }

  /* ── Build contributions for waterfall ──────────────────────────────── */
  // PDF-only: literal hex values required — CSS variables break JS string interpolation
  // in gradient strings (e.g. `${color}30` → `var(--x)30` is invalid CSS) and are
  // unreliable in html2canvas off-screen rendering.
  const contributions: { label: string; savings: number; color: string }[] = [];
  if (ge) contributions.push({ label: t.modules.guestExperience, savings: ge.totalSavings, color: '#b3b2fb' }); // --mews-indigo
  if (pm) contributions.push({ label: t.modules.payment, savings: pm.totalSavings, color: '#34d399' });        // --roi-pdf-emerald
  if (rm) contributions.push({ label: t.modules.rms, savings: rm.totalSavings, color: '#a78bfa' });           // --roi-pdf-violet
  if (hk) contributions.push({ label: t.modules.housekeeping, savings: hk.totalSavings, color: '#f59e0b' });

  return (
    <div style={{ width: SLIDE_WIDTH, overflow: 'hidden' }}>
      {/* ═══════════ SLIDE 1: TITLE ═══════════════════════════════════════ */}
      <Slide>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 64px' }}>
          {data.title && (
            <p style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 8, letterSpacing: '-0.01em', textAlign: 'center' }}>
              {data.title}
            </p>
          )}
          <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
            {data.hotelType} &middot; {data.country}
          </p>

          <div style={{ fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 8 }}>
            {formatBig(data.totalSavings, cs)}
          </div>

          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 16 }}>
            {t.labels.totalAnnualImpact}
          </p>

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', maxWidth: 480, textAlign: 'center', lineHeight: 1.6, marginTop: 16 }}>
            {t.narratives.titleSlideNarrative({
              costSavings: formatBig(costSavings, cs),
              revenueUplift: formatBig(revenueUplift, cs),
              totalTime: Math.round(data.totalTime).toLocaleString(),
            })}
          </p>

          {/* Three KPI pills — stacked layout prevents baseline misalignment from mixed font sizes */}
          <div style={{ display: 'flex', gap: 40, marginTop: 48, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingDown style={{ width: 18, height: 18, color: '#34d399', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{formatBig(costSavings, cs)}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.2 }}>{t.labels.costSavings}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingUp style={{ width: 18, height: 18, color: '#60a5fa', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{formatBig(revenueUplift, cs)}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.2 }}>{t.labels.revenueUplift}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock style={{ width: 18, height: 18, color: '#a78bfa', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{Math.round(data.totalTime).toLocaleString()}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.2 }}>{t.labels.hoursReclaimed}</span>
              </div>
            </div>
          </div>
        </div>
        <SlideFooter />
      </Slide>

      {/* ═══════════ SLIDE 2: GUEST EXPERIENCE ════════════════════════════ */}
      {ge && (
        <Slide>
          <div style={{ padding: '40px 48px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: 'rgba(179,178,251,0.15)', borderRadius: 10, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users style={{ width: 22, height: 22, color: '#b3b2fb' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>{t.modules.guestExperience}</h2>
          </div>

          <div style={{ padding: '0 48px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            {/* Top metric row */}
            <div style={{ display: 'flex', gap: 16 }}>
              <MetricCard label={t.labels.annualImpact} value={formatBig(ge.totalSavings, cs)} accent="#b3b2fb" />
              <MetricCard label={t.labels.timeSaved} value={`${ge.totalTime.toLocaleString()} ${t.labels.hrs}`} accent="#fff" sub={t.labels.perYear} />
            </div>

            {/* Lever breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <LeverRow label={t.pdfLevers.checkInAutomation} value={`${(ge.checkInSavings.annualCheckInTimeSaved + ge.checkInSavings.annualCheckOutTimeSaved).toLocaleString()} ${t.labels.hrs}`} type="time" equivalent={`~${formatCurrency(ge.checkInSavings.annualTotalCostSavings)}`} typeLabels={typeLabels} />
              <LeverRow label={t.pdfLevers.roomAssignment} value={`${ge.roomAssignmentSavings.annualTimeSaved.toLocaleString()} ${t.labels.hrs}`} type="time" equivalent={`~${formatCurrency(ge.roomAssignmentSavings.annualCostSaving)}`} typeLabels={typeLabels} />
              <LeverRow label={t.pdfLevers.guestPortalUpselling} value={formatCurrency(ge.upsellRevenue)} type="revenue" typeLabels={typeLabels} />
              <LeverRow label={t.pdfLevers.directBookingCommission} value={formatCurrency(ge.commissionSaved)} type="cost" typeLabels={typeLabels} />
            </div>

            {/* Context note */}
            <div style={{ background: 'rgba(179,178,251,0.06)', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(179,178,251,0.12)', marginTop: 'auto' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: 0 }}>
                {t.narratives.pdfGuestExperienceNarrative({
                  upsellRevenue: ge.upsellRevenue,
                  commissionSaved: ge.commissionSaved,
                  formatCurrency,
                })}
              </p>
            </div>
          </div>
          <SlideFooter />
        </Slide>
      )}

      {/* ═══════════ SLIDE 3: PAYMENT & BILLING ═══════════════════════════ */}
      {pm && (
        <Slide>
          <div style={{ padding: '40px 48px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: 'rgba(52,211,153,0.12)', borderRadius: 10, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard style={{ width: 22, height: 22, color: '#34d399' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>{t.modules.payment}</h2>
          </div>

          <div style={{ padding: '0 48px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <MetricCard label={t.labels.annualImpact} value={formatBig(pm.totalSavings, cs)} accent="#34d399" />
              <MetricCard label={t.labels.timeSaved} value={`${pm.totalTime.toLocaleString()} ${t.labels.hrs}`} accent="#fff" sub={t.labels.perYear} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <LeverRow label={t.pdfLevers.paymentTokenization} value={`${pm.tokenizationTimeSaved.toLocaleString()} ${t.labels.hrs}`} type="time" equivalent={`~${formatCurrency(pm.tokenizationCostSavings)}`} typeLabels={typeLabels} />
              <LeverRow label={t.pdfLevers.chargebackReduction} value={formatCurrency(pm.chargebackReduction)} type="cost" typeLabels={typeLabels} />
              <LeverRow label={t.pdfLevers.autoReconciliation} value={`${pm.reconciliationTimeSaved.toLocaleString()} ${t.labels.hrs}`} type="time" equivalent={`~${formatCurrency(pm.reconciliationCostSavings)}`} typeLabels={typeLabels} />
              <LeverRow label={t.pdfLevers.noShowFeeCapture} value={formatCurrency(pm.noShowRevenue)} type="revenue" typeLabels={typeLabels} />
              <LeverRow label={t.pdfLevers.multiCurrencyRevenue} value={formatCurrency(pm.multiCurrencyRevenue)} type="revenue" typeLabels={typeLabels} />
            </div>

            <div style={{ background: 'rgba(52,211,153,0.06)', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(52,211,153,0.12)', marginTop: 'auto' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: 0 }}>
                {t.narratives.pdfPaymentNarrative({
                  reconciliationCostSavings: pm.reconciliationCostSavings,
                  chargebackReduction: pm.chargebackReduction,
                  chargebackRate: pm.inputs.chargebackRate,
                  mewsChargebackRate: pm.inputs.mewsChargebackRate,
                  noShowRevenue: pm.noShowRevenue,
                  multiCurrencyRevenue: pm.multiCurrencyRevenue,
                  formatCurrency,
                })}
              </p>
            </div>
          </div>
          <SlideFooter />
        </Slide>
      )}

      {/* ═══════════ SLIDE 4: REVENUE MANAGEMENT ══════════════════════════ */}
      {rm && (
        <Slide>
          <div style={{ padding: '40px 48px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: 'rgba(167,139,250,0.12)', borderRadius: 10, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 style={{ width: 22, height: 22, color: '#a78bfa' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>{t.modules.rms}</h2>
          </div>

          <div style={{ padding: '0 48px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <MetricCard label={t.labels.annualRevenueGain} value={formatBig(rm.annualRevenueGain, cs)} accent="#a78bfa" />
              <MetricCard label={t.labels.laborCostSavings} value={formatCurrency(rm.annualLaborCostSavings)} accent="#34d399" />
              <MetricCard label={t.labels.timeSaved} value={`${rm.totalTime.toLocaleString()} ${t.labels.hrs}`} accent="#fff" sub={t.labels.perYear} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <LeverRow label={t.pdfLevers.dynamicPricingUplift} value={formatCurrency(rm.annualRevenueGain)} type="revenue" typeLabels={typeLabels} />
              <LeverRow label={t.pdfLevers.rateUpdateAutomation} value={`${rm.annualHoursSaved.toLocaleString()} ${t.labels.hrs}`} type="time" equivalent={`~${formatCurrency(rm.annualLaborCostSavings)}`} typeLabels={typeLabels} />
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 18px', flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t.labels.revpar}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{formatCurrency(rm.inputs.hotelRevPAR)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 18px', flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t.labels.rooms}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{rm.inputs.numberOfRooms}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 18px', flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t.labels.revenueUpliftPercent}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#a78bfa' }}>{rm.inputs.estimatedRevenueUplift}%</div>
              </div>
            </div>

            <div style={{ background: 'rgba(167,139,250,0.06)', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(167,139,250,0.12)', marginTop: 'auto' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: 0 }}>
                {t.narratives.pdfRmsNarrative({
                  annualRevenueGain: rm.annualRevenueGain,
                  annualHoursSaved: rm.annualHoursSaved,
                  annualLaborCostSavings: rm.annualLaborCostSavings,
                  numberOfRooms: rm.inputs.numberOfRooms,
                  hasRevenueManager: rm.inputs.hasRevenueManager,
                  hasExistingRMS: rm.inputs.hasExistingRMS,
                  formatCurrency,
                })}
              </p>
            </div>
          </div>
          <SlideFooter />
        </Slide>
      )}

      {/* ═══════════ SLIDE 5: HOUSEKEEPING ════════════════════════════════ */}
      {hk && (
        <Slide>
          <div style={{ padding: '40px 48px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: 'rgba(245,158,11,0.12)', borderRadius: 10, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BedDouble style={{ width: 22, height: 22, color: '#f59e0b' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>{t.modules.housekeeping}</h2>
          </div>

          <div style={{ padding: '0 48px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <MetricCard label={t.labels.annualImpact} value={formatBig(hk.totalSavings, cs)} accent="#f59e0b" />
              <MetricCard label={t.labels.timeSaved} value={`${hk.totalTime.toLocaleString()} ${t.labels.hrs}`} accent="#fff" sub={t.labels.perYear} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {hk.roomAssignmentHours > 0 && (
                <LeverRow label={t.pdfLevers.hkRoomAssignmentAutomation} value={`${hk.roomAssignmentHours.toLocaleString()} ${t.labels.hrs}`} type="time" equivalent={`~${formatCurrency(hk.roomAssignmentCost)}`} typeLabels={typeLabels} />
              )}
              {hk.cleaningStatusHours > 0 && (
                <LeverRow label={t.pdfLevers.hkCleaningStatusUpdates} value={`${hk.cleaningStatusHours.toLocaleString()} ${t.labels.hrs}`} type="time" equivalent={`~${formatCurrency(hk.cleaningStatusCost)}`} typeLabels={typeLabels} />
              )}
              {hk.maintenanceCommHours > 0 && (
                <LeverRow label={t.pdfLevers.hkMaintenanceCommunication} value={`${hk.maintenanceCommHours.toLocaleString()} ${t.labels.hrs}`} type="time" equivalent={`~${formatCurrency(hk.maintenanceCommCost)}`} typeLabels={typeLabels} />
              )}
              {hk.taskMgmtHours > 0 && (
                <LeverRow label={t.pdfLevers.hkTaskManagement} value={`${hk.taskMgmtHours.toLocaleString()} ${t.labels.hrs}`} type="time" equivalent={`~${formatCurrency(hk.taskMgmtCost)}`} typeLabels={typeLabels} />
              )}
              {hk.amenitiesCostSaved > 0 && (
                <LeverRow label={t.pdfLevers.hkAmenitiesReduction} value={formatCurrency(hk.amenitiesCostSaved)} type="cost" typeLabels={typeLabels} />
              )}
              {hk.paperCostSaved > 0 && (
                <LeverRow label={`🌿 ${t.pdfLevers.hkPaperElimination}`} value={formatCurrency(hk.paperCostSaved)} type="cost" typeLabels={typeLabels} />
              )}
            </div>

            <div style={{ background: 'rgba(245,158,11,0.06)', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(245,158,11,0.15)', marginTop: 'auto' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: 0 }}>
                {t.narratives.pdfHousekeepingNarrative({
                  totalTime: hk.totalTime,
                  totalSavings: hk.totalSavings,
                  amenitiesCostSaved: hk.amenitiesCostSaved,
                  formatCurrency,
                })}
              </p>
            </div>
          </div>
          <SlideFooter />
        </Slide>
      )}

      {/* ═══════════ SLIDE 6: SUMMARY ═════════════════════════════════════ */}
      <Slide>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 64px' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{t.labels.impactSummary}</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', maxWidth: 480, textAlign: 'center', lineHeight: 1.6, margin: '0 0 36px' }}>
            {t.narratives.summaryNarrative({
              moduleCount: contributions.length,
              costSavings: formatBig(costSavings, cs),
              revenueUplift: formatBig(revenueUplift, cs),
              totalTime: Math.round(data.totalTime).toLocaleString(),
            })}
          </p>

          {/* Waterfall bars */}
          <div style={{ width: '100%', maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {contributions.map((c) => {
              const maxVal = Math.max(...contributions.map((x) => x.savings), 1);
              const width = Math.max((c.savings / maxVal) * 100, 5);
              return (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', width: 160, textAlign: 'right', flexShrink: 0, fontWeight: 500 }}>
                    {c.label}
                  </span>
                  <div style={{ flex: 1, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${width}%`,
                        height: '100%',
                        borderRadius: 8,
                        background: `linear-gradient(90deg, ${c.color}30, ${c.color})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: 12,
                        minWidth: 70,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                        {formatBig(c.savings, cs)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grand total */}
          <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', marginTop: 36, letterSpacing: '-0.02em' }}>
            {formatBig(data.totalSavings, cs)}
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 8 }}>
            {t.labels.totalAnnualImpact}
          </p>

          {/* Bottom KPIs */}
          <div style={{ display: 'flex', gap: 36, marginTop: 28 }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#34d399' }}>{formatBig(costSavings, cs)}</span>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{t.labels.costSavings}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>{formatBig(revenueUplift, cs)}</span>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{t.labels.revenueUplift}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#a78bfa' }}>{Math.round(data.totalTime).toLocaleString()}</span>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{t.labels.hoursReclaimed}</p>
            </div>
          </div>
        </div>
        <SlideFooter />
      </Slide>

      <style>{`
        .slide-page {
          page-break-after: always;
          break-after: page;
        }
        .slide-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        @media print {
          .slide-page {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
