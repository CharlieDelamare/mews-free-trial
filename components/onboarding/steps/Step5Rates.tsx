'use client';

import { EditableTable } from '@/components/onboarding/EditableTable';
import type { RateGroup, BaseRate, DerivedRate, RatePrice, ParametersData } from '@/types/onboarding';

interface Step5RatesProps {
  rateGroups: RateGroup[];
  baseRates: BaseRate[];
  derivedRates: DerivedRate[];
  ratePrices: RatePrice[];
  parameters: ParametersData;
  onChange: (update: Partial<{
    rateGroups: RateGroup[];
    baseRates: BaseRate[];
    derivedRates: DerivedRate[];
    ratePrices: RatePrice[];
  }>) => void;
}

export function Step5Rates({
  rateGroups,
  baseRates,
  derivedRates,
  ratePrices,
  parameters,
  onChange,
}: Step5RatesProps) {
  const rateGroupNames = rateGroups.map((r) => r.name).filter(Boolean);
  const baseRateNames = baseRates.map((r) => r.name).filter(Boolean);

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-500">
        Review your rate structure. Rate groups contain base rates; derived rates inherit from a
        base rate with adjustments. Rate prices define the actual amounts by date range.
      </p>

      <Section title="Rate groups" count={rateGroups.length} hint="Groups of rates by segment (e.g. Public, Corporate, OTA)">
        <EditableTable
          rows={rateGroups}
          columns={[
            { key: 'name', label: 'Name', placeholder: 'e.g. Public' },
            { key: 'rateType', label: 'Rate type', type: 'select', options: parameters.rateTypes, width: '160px' },
            { key: 'description', label: 'Description' },
          ]}
          onChange={(rows) => onChange({ rateGroups: rows })}
          emptyRow={() => ({ name: '', rateType: undefined, description: undefined })}
          addLabel="Add rate group"
        />
      </Section>

      <Section title="Base rates" count={baseRates.length} hint="The primary rates within each group">
        <EditableTable
          rows={baseRates}
          columns={[
            { key: 'name', label: 'Rate name', placeholder: 'e.g. Flexible Rate' },
            { key: 'rateGroupName', label: 'Rate group', type: 'select', options: rateGroupNames, width: '180px' },
            { key: 'isEnabled', label: 'Enabled', type: 'boolean', width: '70px' },
            { key: 'description', label: 'Description' },
          ]}
          onChange={(rows) => onChange({ baseRates: rows })}
          emptyRow={() => ({ name: '', rateGroupName: undefined, isEnabled: true, description: undefined })}
          addLabel="Add base rate"
        />
      </Section>

      <Section title="Derived rates" count={derivedRates.length} hint="Rates that inherit from a base rate with a fixed or percentage adjustment">
        <EditableTable
          rows={derivedRates}
          columns={[
            { key: 'name', label: 'Rate name', placeholder: 'e.g. Non-refundable -10%' },
            { key: 'baseRateName', label: 'Base rate', type: 'select', options: baseRateNames, width: '200px' },
            { key: 'adjustment', label: 'Adjustment', placeholder: 'e.g. -10%', width: '120px' },
            { key: 'description', label: 'Description' },
          ]}
          onChange={(rows) => onChange({ derivedRates: rows })}
          emptyRow={() => ({ name: '', baseRateName: undefined, adjustment: undefined, description: undefined })}
          addLabel="Add derived rate"
        />
      </Section>

      <Section title="Rate prices" count={ratePrices.length} hint="Starting prices by date range for each base rate">
        <EditableTable
          rows={ratePrices}
          columns={[
            { key: 'baseRateName', label: 'Base rate', type: 'select', options: baseRateNames, width: '200px' },
            { key: 'startDate', label: 'From', placeholder: 'YYYY-MM-DD', width: '120px' },
            { key: 'endDate', label: 'To', placeholder: 'YYYY-MM-DD', width: '120px' },
            { key: 'value', label: 'Amount', type: 'number', width: '90px' },
            { key: 'currencyCode', label: 'Currency', width: '80px', placeholder: 'EUR' },
          ]}
          onChange={(rows) => onChange({ ratePrices: rows })}
          emptyRow={() => ({ baseRateName: undefined, startDate: undefined, endDate: undefined, value: undefined, currencyCode: undefined })}
          addLabel="Add price"
        />
      </Section>

    </div>
  );
}

function Section({ title, count, hint, children }: { title: string; count: number; hint: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{count}</span>
        </div>
        <p className="text-xs text-gray-400">{hint}</p>
      </div>
      {children}
    </section>
  );
}
