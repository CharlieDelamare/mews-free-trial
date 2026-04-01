'use client';

import type { GeneralQuestionsData, ParametersData } from '@/types/onboarding';

interface Step2PropertyProps {
  data: GeneralQuestionsData;
  parameters: ParametersData;
  onChange: (data: GeneralQuestionsData) => void;
}

export function Step2Property({ data, parameters, onChange }: Step2PropertyProps) {
  const set = (key: keyof GeneralQuestionsData, value: string) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="max-w-2xl space-y-8">
      <p className="text-sm text-gray-500">
        Review and complete your property&apos;s basic information. These fields map directly to the
        General Questions sheet in your import file.
      </p>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Identity</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Property name" required>
            <input
              type="text"
              value={data.name ?? ''}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Hotel Sauerbrey"
              className={inputCls}
            />
          </Field>
          <Field label="Property type">
            <select value={data.type ?? ''} onChange={(e) => set('type', e.target.value)} className={inputCls}>
              <option value="">—</option>
              {parameters.propertyTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Chain name">
            <input
              type="text"
              value={data.chainName ?? ''}
              onChange={(e) => set('chainName', e.target.value)}
              placeholder="e.g. Sauerbrey Group"
              className={inputCls}
            />
          </Field>
          <Field label="Pricing mode">
            <select value={data.pricingMode ?? ''} onChange={(e) => set('pricingMode', e.target.value)} className={inputCls}>
              <option value="">—</option>
              {parameters.pricingModes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input type="email" value={data.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="info@hotel.com" className={inputCls} />
          </Field>
          <Field label="Telephone">
            <input type="tel" value={data.telephone ?? ''} onChange={(e) => set('telephone', e.target.value)} placeholder="+49 123 456 789" className={inputCls} />
          </Field>
          <Field label="Website URL" className="col-span-2">
            <input type="url" value={data.websiteUrl ?? ''} onChange={(e) => set('websiteUrl', e.target.value)} placeholder="https://hotel.com" className={inputCls} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Address</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Address line 1" className="col-span-2">
            <input type="text" value={data.addressLine1 ?? ''} onChange={(e) => set('addressLine1', e.target.value)} placeholder="123 Main Street" className={inputCls} />
          </Field>
          <Field label="Address line 2" className="col-span-2">
            <input type="text" value={data.addressLine2 ?? ''} onChange={(e) => set('addressLine2', e.target.value)} placeholder="Suite 4" className={inputCls} />
          </Field>
          <Field label="City">
            <input type="text" value={data.city ?? ''} onChange={(e) => set('city', e.target.value)} placeholder="Berlin" className={inputCls} />
          </Field>
          <Field label="Postal code">
            <input type="text" value={data.postalCode ?? ''} onChange={(e) => set('postalCode', e.target.value)} placeholder="10115" className={inputCls} />
          </Field>
          <Field label="Country">
            <select value={data.countryCode ?? ''} onChange={(e) => set('countryCode', e.target.value)} className={inputCls}>
              <option value="">—</option>
              {parameters.countryCodes.map((c) => (
                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
          </Field>
          <Field label="Currency">
            <input type="text" value={data.currency ?? ''} onChange={(e) => set('currency', e.target.value)} placeholder="EUR" className={inputCls} maxLength={3} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Operations</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Check-in time">
            <input type="time" value={data.checkInTime ?? ''} onChange={(e) => set('checkInTime', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Check-out time">
            <input type="time" value={data.checkOutTime ?? ''} onChange={(e) => set('checkOutTime', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Timezone" className="col-span-2">
            <input type="text" value={data.timeZoneId ?? ''} onChange={(e) => set('timeZoneId', e.target.value)} placeholder="Europe/Berlin" className={inputCls} />
          </Field>
        </div>
      </section>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--mews-primary-pink)] focus:border-transparent placeholder:text-gray-400';

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
        {required && <span className="text-[var(--mews-primary-pink)] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
