'use client';

import { EditableTable } from '@/components/onboarding/EditableTable';
import type { AccountingCategory, BusinessSegment, Department } from '@/types/onboarding';

interface Step5AccountingProps {
  accountingCategories: AccountingCategory[];
  businessSegments: BusinessSegment[];
  departments: Department[];
  onChange: (update: Partial<{
    accountingCategories: AccountingCategory[];
    businessSegments: BusinessSegment[];
    departments: Department[];
  }>) => void;
}

export function Step5Accounting({
  accountingCategories,
  businessSegments,
  departments,
  onChange,
}: Step5AccountingProps) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-500">
        Review your accounting categories (GL codes) and organisational structure. These are used
        for posting, reporting, and task routing in Mews.
      </p>

      <Section
        title="Accounting categories"
        count={accountingCategories.length}
        hint="GL codes for revenue posting (e.g. Room Revenue → 4000)"
      >
        <EditableTable
          rows={accountingCategories}
          columns={[
            { key: 'name', label: 'Name', placeholder: 'e.g. Room Revenue' },
            { key: 'code', label: 'Code', width: '100px', placeholder: '4000' },
            { key: 'classification', label: 'Classification', width: '160px' },
            { key: 'description', label: 'Description' },
          ]}
          onChange={(rows) => onChange({ accountingCategories: rows })}
          emptyRow={() => ({ name: '', code: undefined, classification: undefined, description: undefined })}
          addLabel="Add category"
        />
      </Section>

      <div className="grid grid-cols-2 gap-6">
        <Section
          title="Business segments"
          count={businessSegments.length}
          hint="Customer segments for reporting (e.g. Leisure, Corporate)"
        >
          <EditableTable
            rows={businessSegments}
            columns={[
              { key: 'name', label: 'Name', placeholder: 'e.g. Leisure' },
              { key: 'description', label: 'Description' },
            ]}
            onChange={(rows) => onChange({ businessSegments: rows })}
            emptyRow={() => ({ name: '', description: undefined })}
            addLabel="Add segment"
          />
        </Section>

        <Section
          title="Departments"
          count={departments.length}
          hint="Internal departments for task routing (e.g. Front Desk)"
        >
          <EditableTable
            rows={departments}
            columns={[
              { key: 'name', label: 'Name', placeholder: 'e.g. Front Desk' },
              { key: 'description', label: 'Description' },
            ]}
            onChange={(rows) => onChange({ departments: rows })}
            emptyRow={() => ({ name: '', description: undefined })}
            addLabel="Add department"
          />
        </Section>
      </div>
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
