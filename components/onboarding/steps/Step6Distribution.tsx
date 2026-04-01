'use client';

import type { DistributionAnswers } from '@/types/onboarding';

const CHANNELS = [
  'Booking.com',
  'Expedia',
  'Airbnb',
  'Channel Manager',
  'Own website (IBE)',
  'Google Hotel Ads',
  'Other',
];

interface Step6DistributionProps {
  answers: DistributionAnswers;
  onChange: (a: DistributionAnswers) => void;
}

export function Step6Distribution({ answers, onChange }: Step6DistributionProps) {
  const set = <K extends keyof DistributionAnswers>(key: K, value: DistributionAnswers[K]) =>
    onChange({ ...answers, [key]: value });

  const toggleChannel = (channel: string) => {
    const current = answers.channels ?? [];
    const next = current.includes(channel)
      ? current.filter((c) => c !== channel)
      : [...current, channel];
    set('channels', next);
  };

  return (
    <div className="max-w-2xl space-y-8">
      <p className="text-sm text-gray-500">
        These answers inform how Mews should be configured for distribution. They will be compiled
        into the push payload once the relevant API endpoints are available.
      </p>

      <QASection title="Which channels / OTAs will this property use?">
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((ch) => {
            const selected = (answers.channels ?? []).includes(ch);
            return (
              <button
                key={ch}
                type="button"
                onClick={() => toggleChannel(ch)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  selected
                    ? 'bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)] border-[var(--mews-primary-pink)]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--mews-primary-pink)] hover:text-[var(--mews-night-black)]'
                }`}
              >
                {ch}
              </button>
            );
          })}
        </div>
      </QASection>

      <QASection title="Describe the OTA landscape — which channels are most important and why?">
        <Textarea
          value={answers.otaLandscape ?? ''}
          onChange={(v) => set('otaLandscape', v)}
          placeholder="e.g. Booking.com is primary (60% of OTA bookings). Expedia used for US market only..."
        />
      </QASection>

      <QASection title="How should inventory and rates be mirrored across channels?">
        <Textarea
          value={answers.inventoryMirroring ?? ''}
          onChange={(v) => set('inventoryMirroring', v)}
          placeholder="e.g. All channels mirror full inventory. Booking.com has a -10% BAR rate via derived rate..."
        />
      </QASection>

      <QASection title="Who owns each OTA account? (Hotel or chain-level?)">
        <Textarea
          value={answers.accountOwnership ?? ''}
          onChange={(v) => set('accountOwnership', v)}
          placeholder="e.g. Booking.com account managed by property. Expedia account managed centrally by chain..."
        />
      </QASection>

      <QASection title="How are taxes and breakfast handled on each OTA?">
        <Textarea
          value={answers.taxAndBreakfastHandling ?? ''}
          onChange={(v) => set('taxAndBreakfastHandling', v)}
          placeholder="e.g. Booking.com: tax included, breakfast excluded. Expedia: net rates, tax on top..."
        />
      </QASection>

      <QASection title="Which rates map to which OTA channels?">
        <Textarea
          value={answers.channelMapping ?? ''}
          onChange={(v) => set('channelMapping', v)}
          placeholder="e.g. Booking.com → BAR rate. Own website → Best Available + Breakfast package..."
        />
      </QASection>

      <QASection title="Should existing channel reservations be imported into Mews?">
        <div className="flex gap-3">
          {(['Yes', 'No', 'Partial'] as const).map((opt) => {
            const value = opt === 'Yes' ? true : opt === 'No' ? false : null;
            const selected = answers.importChannelReservations === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => set('importChannelReservations', value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  selected
                    ? 'bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)] border-[var(--mews-primary-pink)]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--mews-primary-pink)]'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </QASection>
    </div>
  );
}

function QASection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{title}</label>
      {children}
    </div>
  );
}

function Textarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--mews-primary-pink)] focus:border-transparent placeholder:text-gray-400 resize-none"
    />
  );
}
