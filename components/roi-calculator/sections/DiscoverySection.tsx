'use client';

import { useState } from 'react';
import {
  X, ChevronRight, ChevronLeft, Compass, MessageSquare,
  Lightbulb, ShieldAlert, Building2, TrendingUp, Users,
  Clock, CreditCard, BarChart3, CheckCircle2,
  ChevronDown, ChevronUp, ArrowRight,
} from 'lucide-react';
import type {
  SharedVariables, GuestExperienceInputs,
  PaymentInputs, RMSInputs,
} from '@/lib/roi-calculator/types/calculator';

interface DiscoverySectionProps {
  isOpen: boolean;
  onClose: () => void;
  country: string;
  usState: string;
  hotelType: string;
  onCountryChange: (v: string) => void;
  onUSStateChange: (v: string) => void;
  onHotelTypeChange: (v: string) => void;
  countries: { name: string; currencySymbol: string }[];
  hotelTypes: string[];
  usStates: { name: string; code: string }[];
  sharedVariables: SharedVariables;
  onSharedVariablesChange: <K extends keyof SharedVariables>(field: K, value: SharedVariables[K]) => void;
  guestExperience: GuestExperienceInputs;
  onGuestExperienceChange: <K extends keyof GuestExperienceInputs>(field: K, value: GuestExperienceInputs[K]) => void;
  payment: PaymentInputs;
  onPaymentChange: <K extends keyof PaymentInputs>(field: K, value: PaymentInputs[K]) => void;
  rms: RMSInputs;
  onRMSChange: <K extends keyof RMSInputs>(field: K, value: RMSInputs[K]) => void;
  currencySymbol: string;
}

const TOTAL_STEPS = 6;
const RATE_FREQUENCIES = ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly'];

type QuestionType = 'open' | 'probe' | 'benchmark' | 'quantify';

interface ConversationQuestion {
  type: QuestionType;
  label: string;
  text: string;
}

const TYPE_STYLES: Record<QuestionType, { bg: string; color: string }> = {
  open:      { bg: 'rgba(179,178,251,0.12)',    color: 'var(--mews-indigo)' },
  probe:     { bg: 'rgba(139,92,246,0.12)',   color: '#7C3AED' },
  benchmark: { bg: 'rgba(16,185,129,0.12)',   color: '#059669' },
  quantify:  { bg: 'rgba(249,115,22,0.12)',   color: '#EA580C' },
};

/* ── Styled input helpers ──────────────────────────────────────────── */
function DiscoveryInput({
  label, value, onChange, unit, min = 0, max, step = 1, description, benchmark,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  benchmark?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label}{unit && <span className="font-normal text-gray-400 ml-1">({unit})</span>}
      </label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
        className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 outline-none transition-all duration-150"
        style={{ background: 'rgba(45,44,55,0.04)', border: '1.5px solid rgba(45,44,55,0.15)' }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--mews-indigo)'; e.currentTarget.style.background = 'rgba(179,178,251,0.05)'; }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(45,44,55,0.15)'; e.currentTarget.style.background = 'rgba(45,44,55,0.04)'; }}
      />
      {benchmark && (
        <p className="text-xs flex items-center gap-1" style={{ color: '#059669' }}>
          <span className="font-bold">Benchmark:</span> {benchmark}
        </p>
      )}
    </div>
  );
}

function DiscoverySelect({
  label, value, onChange, options, description,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 outline-none transition-all duration-150 appearance-none"
        style={{
          background: 'rgba(45,44,55,0.04)',
          border: '1.5px solid rgba(45,44,55,0.15)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          backgroundSize: '16px',
          paddingRight: '2.5rem',
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ── Conversation flow card ────────────────────────────────────────── */
function ConversationCard({ questions }: { questions: ConversationQuestion[] }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(179,178,251,0.22)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5"
        style={{ background: 'rgba(179,178,251,0.08)', borderBottom: '1px solid rgba(179,178,251,0.15)' }}
      >
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(179,178,251,0.2)' }}>
          <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--mews-indigo)' }} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--mews-indigo)' }}>
          Conversation Flow
        </p>
        <span className="text-xs text-gray-400 ml-auto">Follow this sequence →</span>
      </div>
      {/* Questions */}
      <div className="divide-y" style={{ borderColor: 'rgba(45,44,55,0.07)' }}>
        {questions.map((q, i) => {
          const style = TYPE_STYLES[q.type];
          return (
            <div key={i} className="flex gap-3 px-4 py-3.5">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap leading-tight"
                  style={{ background: style.bg, color: style.color }}
                >
                  {q.label}
                </span>
                {i < questions.length - 1 && (
                  <ArrowRight className="w-3 h-3 rotate-90 text-gray-300 mt-1" />
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed italic flex-1 pt-0.5">
                &quot;{q.text}&quot;
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Coaching card ─────────────────────────────────────────────────── */
function CoachingCard({ title, points }: { title?: string; points: string[] }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'rgba(0,35,71,0.05)', border: '1px solid rgba(0,35,71,0.12)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(45,44,55,0.12)' }}
        >
          <Lightbulb className="w-4 h-4 text-yellow-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">
            {title ?? 'Sandler Coaching'}
          </p>
          <ul className="space-y-1.5">
            {points.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--mews-indigo)' }} />
                {pt}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── Objection handling card (collapsible) ─────────────────────────── */
function ObjectionCard({ objections }: { objections: { push: string; response: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(245,158,11,0.30)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left transition-colors duration-150"
        style={{ background: open ? 'rgba(245,158,11,0.10)' : 'rgba(245,158,11,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.2)' }}>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Objection Handling</p>
            <p className="text-xs text-amber-500/70 mt-0.5">{objections.length} common pushback{objections.length !== 1 ? 's' : ''} — click to expand</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-amber-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
      </button>
      {open && (
        <div className="divide-y" style={{ borderColor: 'rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.04)' }}>
          {objections.map((obj, i) => (
            <div key={i} className="px-4 py-3.5">
              <p className="text-xs font-bold text-amber-700 mb-1.5">
                They say: <span className="italic font-normal">&quot;{obj.push}&quot;</span>
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-800">You say: </span>{obj.response}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Data entry panel ──────────────────────────────────────────────── */
function DataPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'rgba(45,44,55,0.025)', border: '1px solid rgba(45,44,55,0.09)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-4 rounded-full" style={{ background: 'var(--mews-indigo)' }} />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Record Data</p>
        <p className="text-xs text-gray-400 ml-1">— updates ROI in real time</p>
      </div>
      {children}
    </div>
  );
}

/* ── Progress bar ──────────────────────────────────────────────────── */
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Step {current} of {total}</span>
        <span className="text-xs font-bold" style={{ color: 'var(--mews-indigo)' }}>{pct}% complete</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(45,44,55,0.10)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--mews-night-black), var(--mews-indigo))' }}
        />
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300 cursor-pointer"
            style={{ background: i < current ? 'var(--mews-indigo)' : 'rgba(45,44,55,0.10)' }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Step header ───────────────────────────────────────────────────── */
function StepHeader({ icon, category, title, stepNum }: { icon: React.ReactNode; category: string; title: string; stepNum: number }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #002347, var(--mews-night-black))', boxShadow: '0 4px 12px rgba(0,35,71,0.20)' }}
      >
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'rgba(179,178,251,0.12)', color: 'var(--mews-indigo)' }}>
            Step {stepNum}
          </span>
          <span className="text-xs text-gray-400 font-medium">{category}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Main component                                                      */
/* ════════════════════════════════════════════════════════════════════ */
export default function DiscoverySection({
  isOpen, onClose,
  country, usState, hotelType, onCountryChange, onUSStateChange, onHotelTypeChange,
  countries, hotelTypes, usStates,
  sharedVariables, onSharedVariablesChange,
  guestExperience, onGuestExperienceChange,
  payment, onPaymentChange,
  rms, onRMSChange,
  currencySymbol,
}: DiscoverySectionProps) {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  /* ── STEP 1 ── Property Overview ─────────────────────────────────── */
  const renderStep1 = () => (
    <>
      <StepHeader stepNum={1} category="Property Profile" title="Property Overview" icon={<Building2 className="w-6 h-6 text-teal-300" />} />
      <div className="space-y-4">
        <ConversationCard questions={[
          {
            type: 'open',
            label: 'Open with',
            text: "Before we look at any numbers, help me understand your property a little better. What type of hotel are you running and how many rooms do you have?",
          },
          {
            type: 'probe',
            label: 'Dig deeper',
            text: "When you think about running the property day-to-day — front desk, back office, operations — where does the most friction show up for your team right now?",
          },
          {
            type: 'benchmark',
            label: 'Add context',
            text: "Just so I frame the numbers correctly: a boutique property typically runs 20–60 rooms, a city hotel 80–250, a resort 100–400. Does that match how you'd describe yours?",
          },
          {
            type: 'quantify',
            label: 'Qualify intent',
            text: "And what's driving this conversation for you right now — is there a specific pain point you're trying to solve, or are you evaluating options more broadly?",
          },
        ]} />
        <CoachingCard points={[
          "Don't jump to features. This step is purely about understanding their world — size, context, and what's motivating the conversation.",
          "A 30-room boutique and a 200-room city hotel have very different ROI profiles. Locking in the property type early ensures every number you show them feels credible and specific.",
          "The friction question is your first pain probe. Listen carefully — whatever they say here is your recurring theme for the rest of the discovery.",
          "If they say 'just evaluating,' probe for urgency: 'What would make this feel more pressing?' Sandler: no pain, no sale.",
        ]} />
        <ObjectionCard objections={[
          {
            push: "Why do you need all these details?",
            response: "Great question. Without your actual profile, any savings figure I show you is just an industry average — it might be completely off for your operation. With these basics, every number I give you becomes specific to your property. That's what makes this different from a brochure.",
          },
          {
            push: "We're just in early exploration, not ready to commit to anything.",
            response: "Totally understood — and that's exactly the right time to do this. This isn't a commitment; it's a way to understand what the real opportunity looks like for your property before you make any decision. Let's just see what the numbers say.",
          },
        ]} />
        <DataPanel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DiscoveryInput
              label="Number of Rooms"
              value={sharedVariables.numberOfRooms}
              onChange={(v) => onSharedVariablesChange('numberOfRooms', v)}
              min={1} max={2000} step={1}
              description="Total sellable guest rooms"
              benchmark="Boutique: 20–60 · City Hotel: 80–250 · Resort: 100–400"
            />
            <DiscoverySelect
              label="Hotel Type"
              value={hotelType}
              onChange={onHotelTypeChange}
              options={hotelTypes.map((t) => ({ value: t, label: t }))}
              description="Select the closest match to your property"
            />
            <div className={country === 'United States' ? '' : 'md:col-span-2'}>
              <DiscoverySelect
                label="Country / Market"
                value={country}
                onChange={onCountryChange}
                options={countries.map((c) => ({ value: c.name, label: c.name }))}
                description="Sets currency and applies region-specific benchmarks to every calculation"
              />
            </div>
            {country === 'United States' && (
              <div>
                <DiscoverySelect
                  label="State"
                  value={usState}
                  onChange={onUSStateChange}
                  options={[
                    { value: '', label: 'National average' },
                    ...usStates.map((s) => ({ value: s.name, label: s.name })),
                  ]}
                  description="Tailors benchmarks to your specific state market"
                />
              </div>
            )}
          </div>
        </DataPanel>
      </div>
    </>
  );

  /* ── STEP 2 ── Revenue & Volume ──────────────────────────────────── */
  const renderStep2 = () => {
    const derivedReservations = sharedVariables.reservationsPerMonth;
    const derivedRevenue = sharedVariables.monthlyRevenue;
    return (
    <>
      <StepHeader stepNum={2} category="Financial Baseline" title="Revenue & Booking Volume" icon={<TrendingUp className="w-6 h-6 text-teal-300" />} />
      <div className="space-y-4">
        <ConversationCard questions={[
          {
            type: 'open',
            label: 'Open with',
            text: "Let's talk about the financial side of the property. What does a typical month look like for you — what's your average room rate and how full are you running?",
          },
          {
            type: 'probe',
            label: 'Dig deeper',
            text: "And when guests book — how long do they typically stay? Is it mostly one-nighters, or do you see a good mix of multi-night stays?",
          },
          {
            type: 'benchmark',
            label: 'Benchmark anchor',
            text: "For context: a city hotel typically runs 65–75% occupancy with a 1.5–2 night average stay. A serviced apartment usually sees 60–70% occupancy but stays of 3–5 nights or more. Does that match how you'd describe your property?",
          },
          {
            type: 'quantify',
            label: 'Quantify the scale',
            text: "Just so I have the right scale — with your room count, occupancy rate, and average stay, I can work out your monthly reservation volume and room revenue automatically. Let me pull that together.",
          },
        ]} />
        <CoachingCard points={[
          "These four inputs — ADR, occupancy rate, avg length of stay, and room count — drive the entire model. Reservations/month and monthly revenue are auto-calculated from them, so there's nothing to guess or double-enter.",
          "If they don't know occupancy exactly, anchor with a range: 'Would you say you're running at 60%, 70%, or closer to 80%?' Most GMs can answer that in seconds.",
          "Average length of stay is often overlooked but dramatically affects reservation volume. At 70% occupancy with 50 rooms: a 1-night avg stay = ~1,050 reservations/month; a 3-night avg stay = ~350. Big difference in workload.",
          "Once you have these four numbers, the reservation count and revenue display automatically — share that with the prospect to build confidence in the model.",
        ]} />
        <ObjectionCard objections={[
          {
            push: "I don't have those numbers in front of me.",
            response: "No problem — a ballpark works perfectly here. Is your ADR closer to 80, 120, or 200? And occupancy — would you say you're usually above or below 70%? Even rough estimates give us a credible starting point we can refine together.",
          },
          {
            push: "We don't share financial data.",
            response: "Completely understood — you don't have to share anything you're not comfortable with. What I need is just an order of magnitude: rough ADR and whether you run at high, medium, or low occupancy. That's enough to show you what the ROI could look like for a property at your scale.",
          },
        ]} />
        <DataPanel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DiscoveryInput
              label="Average Daily Rate (ADR)"
              value={sharedVariables.averageDailyRate}
              onChange={(v) => onSharedVariablesChange('averageDailyRate', v)}
              unit={currencySymbol} min={0} max={2000} step={5}
              description="Average room rate charged per night"
              benchmark="Economy: 50–90 · Mid-scale: 100–180 · Upscale: 180–350 · Luxury: 350+"
            />
            <DiscoveryInput
              label="Occupancy Rate"
              value={sharedVariables.occupancyRate}
              onChange={(v) => onSharedVariablesChange('occupancyRate', v)}
              unit="%" min={1} max={100} step={1}
              description="Average % of rooms occupied per night"
              benchmark="Budget: 60–70% · Mid-scale: 65–75% · Upscale: 70–80% · Luxury: 65–75%"
            />
            <DiscoveryInput
              label="Avg Length of Stay"
              value={sharedVariables.avgLengthOfStay}
              onChange={(v) => onSharedVariablesChange('avgLengthOfStay', v)}
              unit="nights" min={0.5} max={14} step={0.1}
              description="Average number of nights per reservation"
              benchmark="City Hotel: 1.5–2n · Boutique: 1.8–2.5n · Serviced Apt: 3–6n · STR: 2–4n"
            />
          </div>

          {/* Auto-derived values */}
          <div className="rounded-xl p-4 mt-1" style={{ background: 'rgba(45,44,55,0.03)', border: '1px solid rgba(45,44,55,0.09)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full" style={{ background: 'var(--mews-indigo)' }} />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Auto-Derived — confirms your inputs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: 'white', border: '1px solid rgba(45,44,55,0.10)' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Reservations / Month</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{derivedReservations.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2 text-xs flex-wrap" style={{ color: '#6b7280' }}>
                  <span className="font-semibold text-gray-700">{sharedVariables.numberOfRooms}</span>
                  <span>rooms</span>
                  <ArrowRight className="w-3 h-3 flex-shrink-0" />
                  <span className="font-semibold text-gray-700">×{sharedVariables.occupancyRate}%</span>
                  <ArrowRight className="w-3 h-3 flex-shrink-0" />
                  <span className="font-semibold text-gray-700">×30d</span>
                  <ArrowRight className="w-3 h-3 flex-shrink-0" />
                  <span className="font-semibold text-gray-700">÷{sharedVariables.avgLengthOfStay}n</span>
                </div>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'white', border: '1px solid rgba(45,44,55,0.10)' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Monthly Room Revenue</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{currencySymbol}{derivedRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2 text-xs flex-wrap" style={{ color: '#6b7280' }}>
                  <span className="font-semibold text-gray-700">{sharedVariables.numberOfRooms}</span>
                  <span>rooms</span>
                  <ArrowRight className="w-3 h-3 flex-shrink-0" />
                  <span className="font-semibold text-gray-700">{currencySymbol}{sharedVariables.averageDailyRate}</span>
                  <ArrowRight className="w-3 h-3 flex-shrink-0" />
                  <span className="font-semibold text-gray-700">×30d</span>
                  <ArrowRight className="w-3 h-3 flex-shrink-0" />
                  <span className="font-semibold text-gray-700">×{sharedVariables.occupancyRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </DataPanel>
      </div>
    </>
    );
  };

  /* ── STEP 3 ── Labor Costs ───────────────────────────────────────── */
  const renderStep3 = () => (
    <>
      <StepHeader stepNum={3} category="Labor & Staffing" title="Staff Costs & Time Allocation" icon={<Users className="w-6 h-6 text-teal-300" />} />
      <div className="space-y-4">
        <ConversationCard questions={[
          {
            type: 'open',
            label: 'Open with',
            text: "Let's talk about your team for a moment. How is your front desk and operations staffing structured — how many people, and what do they spend most of their day doing?",
          },
          {
            type: 'probe',
            label: 'Dig deeper',
            text: "If you had to split your front desk team's day into 'guest-facing time' versus 'administrative tasks' — things like data entry, checking guests in manually, processing payments, reconciling — what would that split look like?",
          },
          {
            type: 'benchmark',
            label: 'Benchmark anchor',
            text: "What we typically see is that front desk staff in traditional PMS environments spend 40–60% of their shift on administrative tasks rather than actual guest interaction. Does that match what you're seeing?",
          },
          {
            type: 'quantify',
            label: 'Quantify the cost',
            text: "And in terms of hourly wage — what's the typical rate for your front desk and operations team? I want to make sure the time savings we calculate translate to real numbers for your payroll, not industry averages.",
          },
        ]} />
        <CoachingCard points={[
          "Labor is the largest operational cost in hospitality — typically 30–35% of total revenue — and the most directly impacted by automation. This is where the most credible ROI lives.",
          "The 'guest-facing vs. administrative split' question is powerful because it's something GMs feel but rarely quantify. Help them see it for the first time.",
          "Don't position this as cutting staff. Position it as redirecting staff. 'Your team does the same number of hours, but 60% of it becomes guest interaction instead of admin work.'",
          "This wage figure feeds every time-saving calculation across all 7 sections — check-in, check-out, reconciliation, and rate management. Getting it right matters.",
        ]} />
        <ObjectionCard objections={[
          {
            push: "We're not looking to reduce headcount.",
            response: "Completely understood — and that's actually the point. None of our clients use this to cut staff. What they do is redeploy that time. When your front desk isn't buried in check-in paperwork, they're upselling, building rapport, preventing complaints before they happen. The savings go to the bottom line; the team's job gets better.",
          },
          {
            push: "Our team is efficient — I don't think we have that much waste.",
            response: "That's great to hear, and I believe you. Let me ask this: on a week where you had 150 check-ins — what did Sunday evening look like for your team? Was it calm and controlled, or were there moments where the process felt like the bottleneck? The efficiency we're talking about shows up most at peak moments.",
          },
        ]} />
        <DataPanel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DiscoveryInput
              label="Average Staff Hourly Wage"
              value={sharedVariables.staffHourlyWage}
              onChange={(v) => onSharedVariablesChange('staffHourlyWage', v)}
              unit={`${currencySymbol}/hr`} min={0} max={200} step={0.5}
              description="Applies to front desk, back office, and operations staff"
              benchmark="Western EU: 14–20/hr · UK: 12–16/hr · US: 16–24/hr · CH: 28–38/hr"
            />
            <div
              className="rounded-xl p-4 flex flex-col justify-center gap-2"
              style={{ background: 'rgba(179,178,251,0.06)', border: '1px solid rgba(179,178,251,0.18)' }}
            >
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--mews-indigo)' }}>Annual labor cost estimate</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencySymbol}{(sharedVariables.staffHourlyWage * 40 * 52).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">per full-time equivalent (40 hrs/wk) — use this to frame the cost of manual tasks</p>
            </div>
          </div>
        </DataPanel>
      </div>
    </>
  );

  /* ── STEP 4 ── Guest Experience ──────────────────────────────────── */
  const renderStep4 = () => (
    <>
      <StepHeader stepNum={4} category="Guest Experience" title="Check-In, Check-Out & Online Adoption" icon={<Clock className="w-6 h-6 text-teal-300" />} />
      <div className="space-y-4">
        <ConversationCard questions={[
          {
            type: 'open',
            label: 'Open with',
            text: "Walk me through what check-in looks like today. When a guest walks up to your front desk, what actually happens — from the moment they arrive to when they get their key?",
          },
          {
            type: 'probe',
            label: 'Paint the peak',
            text: "Now think about a busy Sunday evening — 30 check-ins arriving between 3 and 6 PM. What does that look like for your team and for the guests waiting in line?",
          },
          {
            type: 'benchmark',
            label: 'Benchmark anchor',
            text: "Industry data puts traditional PMS check-in at 4–6 minutes per guest on average. With a modern system like Mews, that drops to under 90 seconds. Where would you say your check-in sits today?",
          },
          {
            type: 'quantify',
            label: 'Quantify online adoption',
            text: "And online or mobile check-in — do you have that today? If so, what percentage of guests actually use it? Most properties without an active digital push see less than 15% adoption even when the option exists.",
          },
        ]} />
        <CoachingCard points={[
          "Check-in time is the single easiest operational inefficiency to visualize. The prospect has lived it. Your job is to help them put a number on what they already know is a problem.",
          "The 'peak Sunday evening' question activates emotional memory — long lines, stressed staff, frustrated guests. That's where the real pain lives, not in the average.",
          "The benchmark anchor (4–6 min vs. 90 sec) is powerful because it's specific enough to be credible and dramatic enough to create urgency. Let the math sink in: at 300 check-ins/month, 3.5 minutes saved = 17.5 hours of front desk time freed per month.",
          "OTA commission is a revenue story, not a cost story — frame it as money already earned being given away. Ask: 'What's your split between direct and OTA bookings right now?'",
        ]} />
        <ObjectionCard objections={[
          {
            push: "Our guests prefer the personal touch at check-in.",
            response: "I hear that a lot, and it's a valid instinct. Here's the thing though — when check-in takes 90 seconds instead of 5 minutes, your staff suddenly has time to actually have a conversation with the guest, recommend the restaurant, offer a room upgrade. Right now, are they doing that, or are they mostly looking at a screen and typing? A faster process creates more personal moments, not fewer.",
          },
          {
            push: "We already offer online check-in.",
            response: "Great — that's a head start. What's your current adoption rate? Most hotels that offer it but don't actively promote it see 10–20% take-up. Hotels that integrate it into the pre-arrival communication flow typically reach 50–70%. There's usually a big gap between 'we have it' and 'we're getting value from it.'",
          },
          {
            push: "Our check-in process is pretty fast already.",
            response: "That's great to hear. How long does a typical check-in take — roughly? Just so we're using your number, not an industry average. If it's already under 2 minutes, that's genuinely impressive. If it's 3–4 minutes, there's still meaningful time and cost to recover — especially at your volume.",
          },
        ]} />
        <DataPanel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DiscoveryInput
              label="Current Check-In Time"
              value={guestExperience.checkInTime}
              onChange={(v) => onGuestExperienceChange('checkInTime', v)}
              unit="min" min={0.5} max={30} step={0.5}
              description="Average time per guest from arrival to key handover"
              benchmark="Industry avg: 4–6 min · With Mews: ~1–1.5 min"
            />
            <DiscoveryInput
              label="Current Check-Out Time"
              value={guestExperience.checkOutTime}
              onChange={(v) => onGuestExperienceChange('checkOutTime', v)}
              unit="min" min={0.5} max={20} step={0.5}
              description="Average time per guest at check-out"
              benchmark="Industry avg: 2–4 min · With Mews: ~0.5–1 min"
            />
            <DiscoveryInput
              label="Online Check-In Adoption"
              value={guestExperience.onlineCheckInPercentage}
              onChange={(v) => onGuestExperienceChange('onlineCheckInPercentage', v)}
              unit="%" min={0} max={100} step={1}
              description="% of guests currently completing check-in online"
              benchmark="Without active promotion: 5–10% · With Mews portal + kiosk: 15–35%"
            />
          </div>
          <div className="pt-3 border-t" style={{ borderColor: 'rgba(45,44,55,0.08)' }}>
            <DiscoveryInput
              label="Average OTA Commission Rate"
              value={guestExperience.averageCommission}
              onChange={(v) => onGuestExperienceChange('averageCommission', v)}
              unit="%" min={0} max={40} step={0.5}
              description="Commission paid to OTAs (Booking.com, Expedia, etc.) on those bookings"
              benchmark="Booking.com: 15–18% · Expedia: 15–25% · Weighted avg across OTAs: 15–20%"
            />
          </div>
        </DataPanel>
      </div>
    </>
  );

  /* ── STEP 5 ── Payment & Billing ─────────────────────────────────── */
  const renderStep5 = () => (
    <>
      <StepHeader stepNum={5} category="Payment Operations" title="Payment, Billing & Revenue Recovery" icon={<CreditCard className="w-6 h-6 text-teal-300" />} />
      <div className="space-y-4">
        <ConversationCard questions={[
          {
            type: 'open',
            label: 'Open with',
            text: "Let's talk about the payment and back-office side. How does your team currently handle payment processing — is it mostly automated, or is there a lot of manual work involved?",
          },
          {
            type: 'probe',
            label: 'Dig into chargebacks',
            text: "What about payment disputes and chargebacks — how often does that come up, and what does the resolution process look like for your team when it happens?",
          },
          {
            type: 'benchmark',
            label: 'Benchmark chargebacks',
            text: "The hospitality industry average chargeback rate is 0.3–0.8% of transactions. Properties running on Mews with tokenized payments typically see 0.1–0.15%. Where do you think you sit today — closer to the industry average or higher?",
          },
          {
            type: 'probe',
            label: 'Probe reconciliation',
            text: "And daily reconciliation — how long does that take your team? For a property your size, we typically see 1.5–3 hours per day on manual reconciliation. Does that feel right for you?",
          },
          {
            type: 'quantify',
            label: 'Quantify no-shows',
            text: "One more: what's your no-show rate, and when a no-show happens, how often do you actually collect a fee? On average, hotels recover fees on fewer than 50% of no-shows — the card either doesn't work or the process breaks down.",
          },
        ]} />
        <CoachingCard points={[
          "Payment pain is 'death by a thousand cuts' — no single issue feels catastrophic, but chargebacks + reconciliation hours + missed no-show fees + failed transactions add up to significant annual losses.",
          "The chargeback benchmark is your most powerful anchor here. If they're at 0.5% and you can show them Mews clients average 0.15%, that's a 70% reduction — quantifiable and compelling.",
          "Reconciliation time is often underestimated. Ask: 'Who does the reconciliation, and what else could they be doing with that 2 hours?' Making it personal makes it real.",
          "No-show fee recovery is almost always lower than they think. Lead with the benchmark (under 50% recovery) and let them confirm or correct it — either way you've surfaced the pain.",
        ]} />
        <ObjectionCard objections={[
          {
            push: "Our payment setup works fine.",
            response: "I'm glad it's working. Let me ask this on a scale of 1–10: how confident are you in your current chargeback prevention? And when your team finishes daily reconciliation — does that feel like a streamlined process, or is it one of those things that just has to get done? 'Fine' is a starting point, not a ceiling.",
          },
          {
            push: "We have very few chargebacks — it's not a big issue.",
            response: "That's actually great — it means you're already managing it well. Just to make sure we're using your number: do you know your chargeback rate as a percentage of transactions? The reason I ask is that even at 0.2–0.3%, the cost per chargeback (staff time, dispute fees, lost revenue) typically runs 2–3x the original transaction value. Even a small rate adds up fast.",
          },
          {
            push: "We always collect no-show fees.",
            response: "That's impressive — most hotels don't. What's your process when the card on file fails? Because the most common breakdown is a card that tokenized fine at booking but has since expired or been replaced. How does your team handle that scenario today?",
          },
        ]} />
        <DataPanel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DiscoveryInput
              label="Current Chargeback Rate"
              value={payment.chargebackRate}
              onChange={(v) => onPaymentChange('chargebackRate', v)}
              unit="%" min={0} max={10} step={0.05}
              description="% of monthly transactions resulting in chargebacks"
              benchmark="Industry avg: 0.3–0.8% · Mews avg: 0.1–0.15%"
            />
            <DiscoveryInput
              label="Daily Reconciliation Time"
              value={payment.reconciliationTimeDaily}
              onChange={(v) => onPaymentChange('reconciliationTimeDaily', v)}
              unit="hrs/day" min={0} max={12} step={0.25}
              description="Hours spent daily on payment reconciliation"
              benchmark="Manual PMS: 1.5–3 hrs/day · With Mews: 15–30 min/day"
            />
            <DiscoveryInput
              label="No-Show Rate"
              value={payment.noShowRate}
              onChange={(v) => onPaymentChange('noShowRate', v)}
              unit="%" min={0} max={20} step={0.5}
              description="% of reservations that result in a no-show"
              benchmark="Industry avg: 2–5% · Higher in OTA-heavy mix"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t" style={{ borderColor: 'rgba(45,44,55,0.08)' }}>
            <DiscoveryInput
              label="No-Shows Without Fee Recovered"
              value={payment.noShowWithoutFee}
              onChange={(v) => onPaymentChange('noShowWithoutFee', v)}
              unit="%" min={0} max={100} step={1}
              description="% of no-shows where no fee is ultimately collected"
              benchmark="Industry avg: 40–60% go unfee'd due to card failure / process breakdown"
            />
            <DiscoveryInput
              label="Foreign Currency Transaction Share"
              value={payment.foreignCurrencyPercent}
              onChange={(v) => onPaymentChange('foreignCurrencyPercent', v)}
              unit="%" min={0} max={100} step={1}
              description="% of guests paying in a currency other than your local currency"
              benchmark="City / tourist hotels: 20–50% · Domestic leisure: 5–15%"
            />
          </div>
        </DataPanel>
      </div>
    </>
  );

  /* ── STEP 6 ── Revenue Management ────────────────────────────────── */
  const renderStep6 = () => (
    <>
      <StepHeader stepNum={6} category="Revenue Management" title="Rate Strategy & Distribution" icon={<BarChart3 className="w-6 h-6 text-teal-300" />} />
      <div className="space-y-4">
        <ConversationCard questions={[
          {
            type: 'open',
            label: 'Open with',
            text: "Let's talk about how you're managing rates and revenue across your channels. When you decide to change a rate — who makes that call, and what does the process look like from decision to it being live?",
          },
          {
            type: 'probe',
            label: 'Map the process',
            text: "How many different rate plans are you maintaining right now, and how many channels are you distributing across? Walk me through what a typical rate update actually involves for your team.",
          },
          {
            type: 'benchmark',
            label: 'Benchmark frequency',
            text: "Most hotels managing rates manually can realistically update pricing weekly or bi-weekly. But demand in your market can shift significantly within 24–48 hours — events, competitor moves, weather. How often are your rates actually changing today, and how quickly can you react to a demand spike?",
          },
          {
            type: 'quantify',
            label: 'Quantify the opportunity',
            text: "If you could update rates every day with zero extra effort — responding to real-time demand — what do you think the impact on your RevPAR would be? Industry data shows hotels moving from manual to automated rate management see a 4–8% RevPAR lift on average. Does that feel conservative or aggressive for your market?",
          },
        ]} />
        <CoachingCard points={[
          "Revenue management is where the largest single ROI opportunity often sits — but it's also the easiest to dismiss because the cost of inaction is invisible. Help them see the invisible cost.",
          "The 'rate plan × channel × update time' math is your most powerful tool: 5 rate plans × 4 channels × 10 min per update = 200 minutes per update cycle. At weekly cadence, that's 170+ hours per year just on rate updates.",
          "If they have a dedicated revenue manager, reframe: 'This isn't about replacing their expertise — it's about giving them the bandwidth to act on it. How much time is your RM spending on execution vs. strategy?'",
          "The 4–8% RevPAR uplift benchmark is well-documented. Anchoring with a conservative end (4%) keeps it credible. Then let the revenue math do the work: 4% on their RevPAR × rooms × 365 = significant number.",
        ]} />
        <ObjectionCard objections={[
          {
            push: "We have a revenue manager who handles all of that.",
            response: "That's great — and I want to give them full credit. Let me ask: how many rate plans and channels are they managing today? And on an average week, how often do rates actually get updated? Our data shows that even experienced revenue managers using manual tools leave 5–8% RevPAR on the table — not because they lack skill, but because there are only so many hours in a day. The question is whether their time is being spent on strategy or execution.",
          },
          {
            push: "We update rates frequently — it's not a problem.",
            response: "That's great — and that puts you ahead of most. Just to make sure I understand: when you say 'frequently,' are we talking daily, or more like a few times a week? And how long does each update cycle take across all your channels and rate plans? Sometimes what feels frequent is actually leaving optimization gaps, especially around event-driven demand spikes.",
          },
          {
            push: "Our RevPAR is already strong — we don't think there's much room.",
            response: "Strong RevPAR is a great starting point, not a ceiling. Here's the question: is your RevPAR strong because of active optimization, or because your market is strong? Because the hotels that typically see the biggest lift from automated RMS are the ones that are already performing well — because they're close enough to optimal that the last 4–6% improvement becomes worth chasing.",
          },
        ]} />
        <DataPanel>
          <div className="mb-4 pb-4 border-b" style={{ borderColor: 'rgba(45,44,55,0.08)' }}>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Do you already have an RMS?</label>
            <p className="text-xs text-gray-500 mb-3">If the property is already using a revenue management system, the incremental value of switching to Mews RMS is significantly lower.</p>
            <div className="flex gap-3">
              <button
                onClick={() => onRMSChange('hasExistingRMS', true)}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors text-sm ${
                  rms.hasExistingRMS
                    ? 'bg-purple-100 border-2 border-purple-300 text-purple-900'
                    : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Yes, we have an RMS
              </button>
              <button
                onClick={() => onRMSChange('hasExistingRMS', false)}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors text-sm ${
                  !rms.hasExistingRMS
                    ? 'bg-purple-100 border-2 border-purple-300 text-purple-900'
                    : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                No RMS today
              </button>
            </div>
            {rms.hasExistingRMS && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <BarChart3 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-purple-800">
                  RMS module has been disabled from the ROI calculation. The prospect already has automated rate management, so the full uplift and time savings don't apply. You can still manually re-enable it with a reduced 2% incremental uplift.
                </p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DiscoveryInput
              label="Current RevPAR"
              value={rms.hotelRevPAR}
              onChange={(v) => onRMSChange('hotelRevPAR', v)}
              unit={currencySymbol} min={0} max={2000} step={5}
              description="Revenue per available room (ADR × occupancy rate)"
              benchmark="RevPAR = ADR × occupancy %. If ADR=150 and occupancy=72%, RevPAR=108"
            />
            <DiscoveryInput
              label="Active Rate Plans"
              value={rms.numberOfRatePlans}
              onChange={(v) => onRMSChange('numberOfRatePlans', v)}
              min={1} max={100} step={1}
              description="Total rate plans currently being managed and distributed"
              benchmark="Typical: 3–8 plans · Complex: 10–25+ plans (corp, package, seasonal, etc.)"
            />
            <DiscoveryInput
              label="Distribution Channels"
              value={rms.numberOfChannels}
              onChange={(v) => onRMSChange('numberOfChannels', v)}
              min={1} max={50} step={1}
              description="Number of active channels (direct, OTAs, GDS, wholesalers)"
              benchmark="Average independent hotel: 3–6 channels · Larger properties: 8–15+"
            />
            <DiscoveryInput
              label="Time per Rate Update"
              value={rms.avgTimeToUpdateRate}
              onChange={(v) => onRMSChange('avgTimeToUpdateRate', v)}
              unit="min" min={1} max={120} step={1}
              description="Minutes to complete one full rate update cycle across all channels"
              benchmark="Manual (channel manager): 5–20 min · Without channel manager: 30–60+ min"
            />
          </div>
          <div className="pt-3 border-t" style={{ borderColor: 'rgba(45,44,55,0.08)' }}>
            <DiscoverySelect
              label="Current Rate Update Frequency"
              value={rms.rateUpdateFrequency}
              onChange={(v) => onRMSChange('rateUpdateFrequency', v)}
              options={RATE_FREQUENCIES.map((f) => ({ value: f, label: f }))}
              description="How often rates are actually updated across all channels today"
            />
          </div>
        </DataPanel>
      </div>
    </>
  );

  const steps: Record<number, () => JSX.Element> = {
    1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4,
    5: renderStep5, 6: renderStep6,
  };

  /* ── Render shell ────────────────────────────────────────────────── */
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'white',
        border: '1.5px solid rgba(179,178,251,0.28)',
        boxShadow: '0 8px 32px rgba(0,35,71,0.12), 0 2px 8px rgba(179,178,251,0.08)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-4 px-6 py-4"
        style={{ background: 'linear-gradient(135deg, #002347 0%, var(--mews-night-black) 50%, #004080 100%)', borderBottom: '1px solid rgba(179,178,251,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(179,178,251,0.2)', border: '1px solid rgba(179,178,251,0.35)' }}>
            <Compass className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base">Discovery Process</h2>
            <p className="text-white/50 text-xs">Sandler-style guided qualification — all data feeds the ROI calculator live</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.18)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
          aria-label="Close discovery"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(45,44,55,0.07)' }}>
        <ProgressBar current={step} total={TOTAL_STEPS} />
      </div>

      {/* Step content */}
      <div className="px-6 py-6 overflow-y-auto" style={{ maxHeight: '68vh' }}>
        {steps[step]?.()}
      </div>

      {/* Footer navigation */}
      <div
        className="flex items-center justify-between gap-4 px-6 py-4"
        style={{ borderTop: '1px solid rgba(45,44,55,0.08)', background: 'rgba(45,44,55,0.02)' }}
      >
        <button
          onClick={goPrev}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'rgba(45,44,55,0.07)', border: '1px solid rgba(45,44,55,0.12)', color: '#374151' }}
          onMouseEnter={(e) => { if (step !== 1) (e.currentTarget as HTMLElement).style.background = 'rgba(45,44,55,0.13)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(45,44,55,0.07)'; }}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="text-center">
          {step === TOTAL_STEPS ? (
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#059669' }}>
              <CheckCircle2 className="w-4 h-4" />
              Discovery complete — ROI updated
            </div>
          ) : (
            <p className="text-xs text-gray-400">{TOTAL_STEPS - step} step{TOTAL_STEPS - step !== 1 ? 's' : ''} remaining</p>
          )}
        </div>

        {step < TOTAL_STEPS ? (
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, var(--mews-night-black), var(--mews-indigo))', color: 'white', boxShadow: '0 4px 12px rgba(179,178,251,0.3)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(179,178,251,0.45)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(179,178,251,0.3)'; }}
          >
            Next Step
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, var(--mews-night-black), var(--mews-indigo))', color: 'white', boxShadow: '0 4px 12px rgba(179,178,251,0.3)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(179,178,251,0.45)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(179,178,251,0.3)'; }}
          >
            <CheckCircle2 className="w-4 h-4" />
            View My ROI
          </button>
        )}
      </div>
    </div>
  );
}
