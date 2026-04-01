'use client';

import { EditableTable } from '@/components/onboarding/EditableTable';
import type { TaxAnswers, AccountingCategory } from '@/types/onboarding';

const CANCELLATION_TAX_TREATMENTS = [
  'Taxable',
  'Exempt',
  'ZeroRated',
];

const CALCULATION_BASES = ['PerPersonPerNight', 'PerRoomPerNight'] as const;

interface Step8TaxesProps {
  answers: TaxAnswers;
  accountingCategories: AccountingCategory[];
  onChange: (a: TaxAnswers) => void;
  onAccountingCategoriesChange: (rows: AccountingCategory[]) => void;
}

export function Step8Taxes({
  answers,
  accountingCategories,
  onChange,
  onAccountingCategoriesChange,
}: Step8TaxesProps) {
  const set = <K extends keyof TaxAnswers>(key: K, value: TaxAnswers[K]) =>
    onChange({ ...answers, [key]: value });

  const cityTax = answers.cityTax ?? { exists: false };

  return (
    <div className="max-w-2xl space-y-8">
      <p className="text-sm text-gray-500">
        Configure city tax, cancellation fee tax treatment, accounting categories, and any
        integration-specific settings like DATEV.
      </p>

      {/* City tax */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">City tax</h2>

        <div className="flex gap-3">
          {['Yes', 'No'].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set('cityTax', { ...cityTax, exists: opt === 'Yes' })}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                (cityTax.exists ? 'Yes' : 'No') === opt
                  ? 'bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)] border-[var(--mews-primary-pink)]'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--mews-primary-pink)]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {cityTax.exists && (
          <div className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tax name">
                <input
                  type="text"
                  value={cityTax.name ?? ''}
                  onChange={(e) => set('cityTax', { ...cityTax, name: e.target.value })}
                  placeholder="e.g. Kurtaxe"
                  className={inputCls}
                />
              </Field>
              <Field label="Amount (per person/room per night)">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={cityTax.amount ?? ''}
                  onChange={(e) => set('cityTax', { ...cityTax, amount: parseFloat(e.target.value) })}
                  placeholder="2.50"
                  className={inputCls}
                />
              </Field>
              <Field label="Calculation basis">
                <select
                  value={cityTax.calculationBase ?? ''}
                  onChange={(e) => set('cityTax', { ...cityTax, calculationBase: e.target.value as typeof CALCULATION_BASES[number] })}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {CALCULATION_BASES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Exemptions (describe who is exempt)">
              <textarea
                value={cityTax.exemptions ?? ''}
                onChange={(e) => set('cityTax', { ...cityTax, exemptions: e.target.value })}
                placeholder="e.g. Children under 18, long-stay guests (>21 nights), business travellers with proof"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mews-primary-pink)] focus:border-transparent placeholder:text-gray-400 resize-none"
              />
            </Field>
          </div>
        )}
      </section>

      {/* Cancellation fee tax treatment */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Cancellation fee tax treatment
        </h2>
        <div className="flex flex-wrap gap-2">
          {CANCELLATION_TAX_TREATMENTS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set('cancellationTaxTreatment', opt)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                answers.cancellationTaxTreatment === opt
                  ? 'bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)] border-[var(--mews-primary-pink)]'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--mews-primary-pink)]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </section>

      {/* Accounting categories */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
            Accounting categories
          </h2>
          <p className="text-xs text-gray-400">
            Review GL codes imported from your file. These are passed through in the export.
          </p>
        </div>
        <EditableTable
          rows={accountingCategories}
          columns={[
            { key: 'name', label: 'Name', placeholder: 'e.g. Room Revenue' },
            { key: 'code', label: 'Code', width: '100px', placeholder: '4000' },
            { key: 'classification', label: 'Classification', width: '160px' },
            { key: 'description', label: 'Description' },
          ]}
          onChange={onAccountingCategoriesChange}
          emptyRow={() => ({ name: '', code: undefined, classification: undefined, description: undefined })}
          addLabel="Add category"
        />
      </section>

      {/* DATEV */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          DATEV integration
        </h2>
        <p className="text-xs text-gray-400">
          Enable if this property exports accounting data to DATEV.
        </p>
        <div className="flex gap-3">
          {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => set('datevEnabled', value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                answers.datevEnabled === value
                  ? 'bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)] border-[var(--mews-primary-pink)]'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--mews-primary-pink)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Payment method → GL mapping */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Payment method → GL account mapping
        </h2>
        <p className="text-xs text-gray-400">
          Describe how each payment method maps to a GL account.
        </p>
        <textarea
          value={answers.paymentMethodPosting ?? ''}
          onChange={(e) => set('paymentMethodPosting', e.target.value)}
          placeholder="e.g. Credit card → 1200, Cash → 1000, Bank transfer → 1800..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mews-primary-pink)] focus:border-transparent placeholder:text-gray-400 resize-none"
        />
      </section>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--mews-primary-pink)] focus:border-transparent placeholder:text-gray-400';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
