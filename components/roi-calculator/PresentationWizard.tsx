'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import ProspectIntake from '@/components/roi-calculator/ProspectIntake';
import { useROICalculator } from '@/hooks/useROICalculator';
import { useConfidence } from '@/hooks/useConfidence';
import { getPriorityInputs } from '@/lib/roi-calculator/utils/priorityInputs';
import { serializeState } from '@/lib/roi-calculator/utils/persistence';
import { countries, hotelTypes, usStates } from '@/lib/roi-calculator/utils/hotelDefaults';
import type { IntakeMode } from '@/lib/roi-calculator/types/confidence';
import type { SharedVariables, EnabledModules } from '@/lib/roi-calculator/types/calculator';

export default function PresentationWizard() {
  const router = useRouter();
  const [step, setStep] = useState<'identity' | 'intake'>('identity');
  const [name, setName] = useState('');
  const [salesforceAccountId, setSalesforceAccountId] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [selectedModules, setSelectedModules] = useState<EnabledModules>({
    guestExperience: true,
    payment: true,
    rms: true,
    housekeeping: true,
  });
  const [country, setCountry] = useState('');
  const [usState, setUsState] = useState('');
  const [hotelType, setHotelType] = useState('');
  const [nameError, setNameError] = useState('');
  const [countryError, setCountryError] = useState('');
  const [hotelTypeError, setHotelTypeError] = useState('');
  const [modulesError, setModulesError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { state, dispatch } = useROICalculator();
  const { config, ui } = state;
  const { currencySymbol } = config;

  const priorityInputs = useMemo(
    () => getPriorityInputs(currencySymbol, config.country, config.hotelType, selectedModules),
    [currencySymbol, config.country, config.hotelType, selectedModules],
  );

  const {
    confidenceDispatch,
    score,
    getFieldStatus,
    getBenchmarkValue,
    confirmField,
    revertToBenchmark,
  } = useConfidence(priorityInputs);

  const handleRevertFieldToBenchmark = useCallback(
    (key: string) => revertToBenchmark(key),
    [revertToBenchmark],
  );

  function handleIdentitySubmit(e: React.FormEvent) {
    e.preventDefault();
    let hasError = false;
    if (!name.trim()) {
      setNameError('Hotel or group name is required');
      hasError = true;
    } else {
      setNameError('');
    }
    if (!country) {
      setCountryError('Please select a country');
      hasError = true;
    } else {
      setCountryError('');
    }
    if (!hotelType) {
      setHotelTypeError('Please select a property type');
      hasError = true;
    } else {
      setHotelTypeError('');
    }
    if (!selectedModules.guestExperience && !selectedModules.payment && !selectedModules.rms) {
      setModulesError('Please select at least one Mews product');
      hasError = true;
    } else {
      setModulesError('');
    }
    if (hasError) return;
    dispatch({ type: 'SET_FIELD', slice: 'config', field: 'country', value: country });
    dispatch({ type: 'SET_FIELD', slice: 'config', field: 'usState', value: usState });
    dispatch({ type: 'SET_FIELD', slice: 'config', field: 'hotelType', value: hotelType });
    setStep('intake');
  }

  async function handleIntakeComplete() {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const stateToSave = {
        ...state,
        config: { ...state.config, title: name.trim() },
        ui: { ...state.ui, enabledModules: selectedModules },
      };
      const res = await fetch('/api/roi-presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          salesforceAccountId: salesforceAccountId.trim() || undefined,
          createdBy: createdBy.trim() || undefined,
          state: serializeState(stateToSave),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Unknown error');
      router.push(`/roi-calculator/${data.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
      setIsSubmitting(false);
    }
  }

  if (step === 'identity') {
    return (
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-mews-night-black mb-2">Build Your Business Case</h1>
            <p className="text-gray-600">Let&apos;s start with a few details about this presentation.</p>
          </div>

          <form onSubmit={handleIdentitySubmit} className="bg-white rounded-xl border border-neutral-100 shadow-sm p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hotel or group name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Grand Berlin"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mews-primary focus:border-mews-primary"
                autoFocus
              />
              {nameError && <p className="mt-1.5 text-sm text-red-500">{nameError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salesforce Account Number <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={salesforceAccountId}
                onChange={(e) => setSalesforceAccountId(e.target.value)}
                placeholder="e.g. 0012000001AbCdE"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mews-primary focus:border-mews-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your name <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder="e.g. Charlie"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mews-primary focus:border-mews-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                value={country}
                onChange={(e) => { setCountry(e.target.value); setUsState(''); if (countryError) setCountryError(''); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mews-primary focus:border-mews-primary text-sm text-gray-800"
              >
                <option value="">Select a country…</option>
                {countries.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              {countryError && <p className="mt-1.5 text-sm text-red-500">{countryError}</p>}
            </div>

            {country === 'United States' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <select
                  value={usState}
                  onChange={(e) => setUsState(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mews-primary focus:border-mews-primary text-sm text-gray-800"
                >
                  <option value="">All states (national average)</option>
                  {usStates.map((s) => (
                    <option key={s.code} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {hotelTypes.map((ht) => (
                  <button
                    key={ht}
                    type="button"
                    onClick={() => { setHotelType(ht); if (hotelTypeError) setHotelTypeError(''); }}
                    className={[
                      'px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors text-left',
                      hotelType === ht
                        ? 'bg-mews-primary text-mews-night-black border-mews-primary'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {ht}
                  </button>
                ))}
              </div>
              {hotelTypeError && <p className="mt-1.5 text-sm text-red-500">{hotelTypeError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Which Mews products will they be using?
              </label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {(
                  [
                    {
                      key: 'guestExperience' as const,
                      label: 'Guest Experience',
                      description: 'Check-in automation, direct bookings, upsells',
                    },
                    {
                      key: 'payment' as const,
                      label: 'Payments & Billing',
                      description: 'Chargebacks, reconciliation, no-shows',
                    },
                    {
                      key: 'rms' as const,
                      label: 'RMS',
                      description: 'Rate management, channel optimisation',
                    },
                    {
                      key: 'housekeeping' as const,
                      label: 'Housekeeping',
                      description: 'Room assignment, cleaning updates, maintenance coordination',
                    },
                  ] satisfies { key: keyof EnabledModules; label: string; description: string }[] // description kept for future use
                ).map(({ key, label }) => {
                  const isSelected = selectedModules[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedModules((prev) => ({ ...prev, [key]: !prev[key] }));
                        if (modulesError) setModulesError('');
                      }}
                      className={[
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors',
                        isSelected
                          ? 'bg-mews-primary text-mews-night-black border-mews-primary'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors',
                          isSelected ? 'bg-mews-night-black border-mews-night-black' : 'border-gray-300',
                        ].join(' ')}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
              {modulesError && (
                <p className="mt-1.5 text-sm text-red-500">{modulesError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-mews-primary text-mews-night-black font-semibold rounded-lg hover:bg-mews-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <>
      {submitError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[--mews-coral] text-white px-4 py-2 rounded-lg text-sm">
          {submitError}
        </div>
      )}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-white/70 flex items-center justify-center">
          <p className="text-[--mews-night-black]/60 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
            Saving your presentation…
          </p>
        </div>
      )}
      <ProspectIntake
        isOpen={true}
        onClose={() => setStep('identity')}
        fullPage={true}
        onComplete={handleIntakeComplete}
        intakeMode="fast"
        onModeChange={(mode: IntakeMode) =>
          confidenceDispatch({ type: 'SET_INTAKE_MODE', mode })
        }
        priorityInputs={priorityInputs}
        getValue={(slice, field) => {
          const sliceData = state[slice as keyof typeof state] as unknown as Record<string, unknown>;
          return (sliceData?.[field] as number) ?? 0;
        }}
        onValueChange={(slice, field, value) =>
          dispatch({ type: 'SET_FIELD', slice: slice as 'sharedVariables', field: field as keyof SharedVariables, value } as Parameters<typeof dispatch>[0])
        }
        getFieldStatus={getFieldStatus}
        getBenchmarkValue={getBenchmarkValue}
        onConfirmField={confirmField}
        onRevertFieldToBenchmark={handleRevertFieldToBenchmark}
        score={score}
        currencySymbol={currencySymbol}
        hasExistingRMS={state.rms.hasExistingRMS}
        onHasExistingRMSChange={(value) =>
          dispatch({ type: 'SET_FIELD', slice: 'rms', field: 'hasExistingRMS', value })
        }
      />
    </>
  );
}
