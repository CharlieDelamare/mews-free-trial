'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import ProspectIntake from '@/components/roi-calculator/ProspectIntake';
import { useROICalculator } from '@/hooks/useROICalculator';
import { useConfidence } from '@/hooks/useConfidence';
import { getPriorityInputs } from '@/lib/roi-calculator/utils/priorityInputs';
import { serializeState } from '@/lib/roi-calculator/utils/persistence';
import type { IntakeMode } from '@/lib/roi-calculator/types/confidence';
import type { SharedVariables } from '@/lib/roi-calculator/types/calculator';

export default function PresentationWizard() {
  const router = useRouter();
  const [step, setStep] = useState<'identity' | 'intake'>('identity');
  const [name, setName] = useState('');
  const [salesforceAccountId, setSalesforceAccountId] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [nameError, setNameError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { state, dispatch } = useROICalculator();
  const { config, ui } = state;
  const { currencySymbol } = config;

  const priorityInputs = useMemo(
    () => getPriorityInputs(currencySymbol, config.country, config.hotelType),
    [currencySymbol, config.country, config.hotelType],
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
    if (!name.trim()) {
      setNameError('Hotel or group name is required');
      return;
    }
    setNameError('');
    setStep('intake');
  }

  async function handleIntakeComplete() {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/roi-presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          salesforceAccountId: salesforceAccountId.trim() || undefined,
          createdBy: createdBy.trim() || undefined,
          state: serializeState(state),
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
      <div className="min-h-screen bg-[--mews-linen] flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <h1 className="text-3xl font-bold text-[--mews-night-black] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Build Your Business Case
          </h1>
          <p className="text-[--mews-night-black]/60 mb-8" style={{ fontFamily: 'var(--font-body)' }}>
            Let&apos;s start with a few details about this presentation.
          </p>

          <form onSubmit={handleIdentitySubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[--mews-night-black] mb-1.5" style={{ fontFamily: 'var(--font-body)' }}>
                Hotel or group name <span className="text-[--mews-coral]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Grand Berlin"
                className="w-full px-4 py-3 rounded-xl border border-[--mews-night-black]/15 bg-white text-[--mews-night-black] placeholder:text-[--mews-night-black]/30 focus:outline-none focus:ring-2 focus:ring-[--mews-indigo]"
                style={{ fontFamily: 'var(--font-body)' }}
                autoFocus
              />
              {nameError && <p className="mt-1.5 text-sm text-[--mews-coral]">{nameError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[--mews-night-black] mb-1.5" style={{ fontFamily: 'var(--font-body)' }}>
                Salesforce Account Number <span className="text-[--mews-night-black]/40 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={salesforceAccountId}
                onChange={(e) => setSalesforceAccountId(e.target.value)}
                placeholder="e.g. 0012000001AbCdE"
                className="w-full px-4 py-3 rounded-xl border border-[--mews-night-black]/15 bg-white text-[--mews-night-black] placeholder:text-[--mews-night-black]/30 focus:outline-none focus:ring-2 focus:ring-[--mews-indigo]"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[--mews-night-black] mb-1.5" style={{ fontFamily: 'var(--font-body)' }}>
                Your name <span className="text-[--mews-night-black]/40 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder="e.g. Charlie"
                className="w-full px-4 py-3 rounded-xl border border-[--mews-night-black]/15 bg-white text-[--mews-night-black] placeholder:text-[--mews-night-black]/30 focus:outline-none focus:ring-2 focus:ring-[--mews-indigo]"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[--mews-night-black] text-white font-medium hover:bg-[--mews-deep-blue] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
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
        onClose={() => {}}
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
        country={config.country}
        usState={config.usState}
        hotelType={config.hotelType}
        onCountryChange={(v) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'country', value: v })}
        onUSStateChange={(v) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'usState', value: v })}
        onHotelTypeChange={(v) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'hotelType', value: v })}
        currencySymbol={currencySymbol}
        hasExistingRMS={state.rms.hasExistingRMS}
        onHasExistingRMSChange={(value) =>
          dispatch({ type: 'SET_FIELD', slice: 'rms', field: 'hasExistingRMS', value })
        }
      />
    </>
  );
}
