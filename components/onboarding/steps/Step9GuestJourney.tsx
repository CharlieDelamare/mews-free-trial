'use client';

import { EditableTable } from '@/components/onboarding/EditableTable';
import type { GuestJourneyAnswers, UserAnswer } from '@/types/onboarding';

const IBE_CARD_OPTIONS = ['AllBookings', 'NonRefOnly', 'None'];
const TWO_FACTOR_OPTIONS = ['Email', 'AuthApp', 'Passkey', 'SSO', 'None'];
const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'de', label: 'German' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'it', label: 'Italian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'cs', label: 'Czech' },
  { code: 'pl', label: 'Polish' },
];
const USER_ROLES = ['Receptionist', 'Manager', 'Accountant', 'Housekeeping', 'Administrator'];

interface Step9GuestJourneyProps {
  answers: GuestJourneyAnswers;
  onChange: (a: GuestJourneyAnswers) => void;
}

export function Step9GuestJourney({ answers, onChange }: Step9GuestJourneyProps) {
  const set = <K extends keyof GuestJourneyAnswers>(key: K, value: GuestJourneyAnswers[K]) =>
    onChange({ ...answers, [key]: value });

  return (
    <div className="max-w-2xl space-y-8">
      <p className="text-sm text-gray-500">
        Configure the online booking engine (IBE), guest-facing legal content, user accounts to
        create, and security settings.
      </p>

      {/* IBE settings */}
      <section className="space-y-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Booking engine (IBE)
        </h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Credit card requirement
          </label>
          <div className="flex gap-2 flex-wrap">
            {IBE_CARD_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set('ibeCardRequirement', opt)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  answers.ibeCardRequirement === opt
                    ? 'bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)] border-[var(--mews-primary-pink)]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--mews-primary-pink)]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Default language">
            <select
              value={answers.ibeLanguage ?? ''}
              onChange={(e) => set('ibeLanguage', e.target.value)}
              className={inputCls}
            >
              <option value="">—</option>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Brand colour (hex)">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={answers.ibeBrandColor ?? ''}
                onChange={(e) => set('ibeBrandColor', e.target.value)}
                placeholder="#FF83DA"
                maxLength={7}
                className={inputCls}
              />
              {answers.ibeBrandColor && /^#[0-9A-Fa-f]{6}$/.test(answers.ibeBrandColor) && (
                <div
                  className="w-8 h-8 rounded-lg border border-gray-200 flex-shrink-0"
                  style={{ backgroundColor: answers.ibeBrandColor }}
                />
              )}
            </div>
          </Field>
        </div>
      </section>

      {/* Legal content */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Legal content
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Terms & Conditions URL">
            <input
              type="url"
              value={answers.termsUrl ?? ''}
              onChange={(e) => set('termsUrl', e.target.value)}
              placeholder="https://hotel.com/terms"
              className={inputCls}
            />
          </Field>
          <Field label="Privacy Policy URL">
            <input
              type="url"
              value={answers.privacyUrl ?? ''}
              onChange={(e) => set('privacyUrl', e.target.value)}
              placeholder="https://hotel.com/privacy"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* Users */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
            Users to create
          </h2>
          <p className="text-xs text-gray-400">
            Staff who need access to Mews. They will receive an invitation email.
          </p>
        </div>
        <EditableTable<UserAnswer>
          rows={(answers.users ?? []) as UserAnswer[]}
          columns={[
            { key: 'firstName', label: 'First name', placeholder: 'Jane' },
            { key: 'lastName', label: 'Last name', placeholder: 'Smith' },
            { key: 'email', label: 'Email', placeholder: 'jane@hotel.com' },
            { key: 'role', label: 'Role', type: 'select', options: USER_ROLES, width: '160px' },
          ]}
          onChange={(rows) => set('users', rows)}
          emptyRow={() => ({ firstName: '', lastName: '', email: '', role: '' })}
          addLabel="Add user"
        />
      </section>

      {/* 2FA method */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Two-factor authentication
        </h2>
        <p className="text-xs text-gray-400">
          Required authentication method for all users on this account.
        </p>
        <div className="flex gap-2 flex-wrap">
          {TWO_FACTOR_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set('twoFactorMethod', opt)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                answers.twoFactorMethod === opt
                  ? 'bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)] border-[var(--mews-primary-pink)]'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--mews-primary-pink)]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
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
