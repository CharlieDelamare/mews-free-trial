'use client';

import type { PolicyAnswers, CancellationPolicyAnswer, RateGroup } from '@/types/onboarding';

const PAYMENT_METHODS = ['Visa', 'Mastercard', 'Amex', 'SEPA', 'Bank Transfer', 'Cash'];
const AUTO_CHARGE_OPTIONS = ['AtBooking', 'AtCancellationDeadline', 'OnArrival', 'Manual'];
const PENALTY_TYPES = ['None', 'FirstNight', 'FullStay', 'Percentage'] as const;

interface Step7PoliciesProps {
  answers: PolicyAnswers;
  rateGroups: RateGroup[];
  onChange: (a: PolicyAnswers) => void;
}

export function Step7Policies({ answers, rateGroups, onChange }: Step7PoliciesProps) {
  const set = <K extends keyof PolicyAnswers>(key: K, value: PolicyAnswers[K]) =>
    onChange({ ...answers, [key]: value });

  // Ensure there's a cancellation policy entry for each rate group
  const policies: CancellationPolicyAnswer[] = rateGroups.map((rg) => {
    const existing = (answers.cancellationPolicies ?? []).find(
      (cp) => cp.rateGroupName === rg.name,
    );
    return existing ?? { rateGroupName: rg.name };
  });

  const updatePolicy = (index: number, update: Partial<CancellationPolicyAnswer>) => {
    const next = policies.map((p, i) => (i === index ? { ...p, ...update } : p));
    set('cancellationPolicies', next);
  };

  const togglePaymentMethod = (method: string) => {
    const current = answers.acceptedPaymentMethods ?? [];
    const next = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];
    set('acceptedPaymentMethods', next);
  };

  return (
    <div className="max-w-2xl space-y-8">
      <p className="text-sm text-gray-500">
        Define cancellation policies per rate group, auto-charge rules, and payment methods. This
        information is used to generate the push payloads for the new Mews API endpoints.
      </p>

      {/* Cancellation policies per rate group */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Cancellation policies
        </h2>
        {rateGroups.length === 0 && (
          <p className="text-sm text-gray-400 italic">
            No rate groups found. Complete Step 5 first.
          </p>
        )}
        {policies.map((policy, i) => (
          <div key={policy.rateGroupName} className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white">
            <p className="text-sm font-semibold text-gray-800">{policy.rateGroupName}</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Free cancellation window (hours)
                </label>
                <input
                  type="number"
                  min={0}
                  value={policy.freeCancellationHours ?? ''}
                  onChange={(e) => updatePolicy(i, { freeCancellationHours: Number(e.target.value) })}
                  placeholder="e.g. 48"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Penalty type
                </label>
                <select
                  value={policy.penaltyType ?? ''}
                  onChange={(e) => updatePolicy(i, { penaltyType: e.target.value as CancellationPolicyAnswer['penaltyType'] })}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {PENALTY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {policy.penaltyType === 'Percentage' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Penalty value (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={policy.penaltyValue ?? ''}
                    onChange={(e) => updatePolicy(i, { penaltyValue: Number(e.target.value) })}
                    placeholder="100"
                    className={inputCls}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Description (shown to guest)
              </label>
              <textarea
                value={policy.description ?? ''}
                onChange={(e) => updatePolicy(i, { description: e.target.value })}
                placeholder="e.g. Free cancellation up to 48 hours before arrival. After that, first night charged."
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mews-primary-pink)] focus:border-transparent placeholder:text-gray-400 resize-none"
              />
            </div>
          </div>
        ))}
      </section>

      {/* Auto-charge rule */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Auto-charge rule
        </h2>
        <p className="text-xs text-gray-400">When should Mews automatically charge the guest&apos;s payment?</p>
        <div className="flex flex-wrap gap-2">
          {AUTO_CHARGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set('autoChargeRule', opt)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                answers.autoChargeRule === opt
                  ? 'bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)] border-[var(--mews-primary-pink)]'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--mews-primary-pink)]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </section>

      {/* OTA payment flow */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          OTA payment flow
        </h2>
        <p className="text-xs text-gray-400">Describe how each OTA handles payment (VCC, bank transfer, on-site).</p>
        <textarea
          value={answers.otaPaymentFlow ?? ''}
          onChange={(e) => set('otaPaymentFlow', e.target.value)}
          placeholder="e.g. Booking.com: VCC charged on arrival. Expedia: bank transfer after checkout..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mews-primary-pink)] focus:border-transparent placeholder:text-gray-400 resize-none"
        />
      </section>

      {/* Accepted payment methods */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Accepted payment methods
        </h2>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((method) => {
            const selected = (answers.acceptedPaymentMethods ?? []).includes(method);
            return (
              <button
                key={method}
                type="button"
                onClick={() => togglePaymentMethod(method)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  selected
                    ? 'bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)] border-[var(--mews-primary-pink)]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--mews-primary-pink)]'
                }`}
              >
                {method}
              </button>
            );
          })}
        </div>
      </section>

      {/* Deposit handling */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Deposit handling
        </h2>
        <div className="flex gap-3">
          {['Yes', 'No'].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set('depositHandling', opt)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                answers.depositHandling === opt
                  ? 'bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)] border-[var(--mews-primary-pink)]'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--mews-primary-pink)]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {answers.depositHandling === 'Yes' && (
          <textarea
            value={answers.depositDetails ?? ''}
            onChange={(e) => set('depositDetails', e.target.value)}
            placeholder="Describe the deposit amount, when it is collected, and how it is reconciled..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mews-primary-pink)] focus:border-transparent placeholder:text-gray-400 resize-none"
          />
        )}
      </section>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--mews-primary-pink)] focus:border-transparent placeholder:text-gray-400';
