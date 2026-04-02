'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  Building2,
  Clock,
  CreditCard,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  X,
} from 'lucide-react';
import SmartField from '@/components/roi-calculator/ui/SmartField';
import type { PriorityInput } from '@/lib/roi-calculator/types/confidence';
import type { ConfidenceStatus, IntakeMode, ConfidenceScore } from '@/lib/roi-calculator/types/confidence';
import { CONFIDENCE_LABELS } from '@/lib/roi-calculator/utils/confidenceScoring';
import { INPUT_GROUPS } from '@/lib/roi-calculator/utils/priorityInputs';

const GROUP_ICONS: Record<string, React.ReactNode> = {
  property: <Building2 className="w-5 h-5" />,
  operations: <Clock className="w-5 h-5" />,
  payments: <CreditCard className="w-5 h-5" />,
  revenue: <TrendingUp className="w-5 h-5" />,
  rms: <BarChart3 className="w-5 h-5" />,
};

interface ProspectIntakeProps {
  isOpen: boolean;
  onClose: () => void;
  intakeMode: IntakeMode;
  onModeChange: (mode: IntakeMode) => void;
  priorityInputs: PriorityInput[];
  getValue: (slice: string, field: string) => number;
  onValueChange: (slice: string, field: string, value: number) => void;
  getFieldStatus: (key: string) => ConfidenceStatus;
  getBenchmarkValue: (key: string) => number | undefined;
  onConfirmField: (key: string) => void;
  onRevertFieldToBenchmark: (key: string) => void;
  score: ConfidenceScore;
  currencySymbol: string;
  // RMS existing system
  hasExistingRMS: boolean;
  onHasExistingRMSChange: (value: boolean) => void;
  // Completion callback
  onComplete: () => void;
  // Render as full page instead of modal
  fullPage?: boolean;
}

export default function ProspectIntake({
  isOpen,
  onClose,
  intakeMode,
  onModeChange,
  priorityInputs,
  getValue,
  onValueChange,
  getFieldStatus,
  getBenchmarkValue,
  onConfirmField,
  onRevertFieldToBenchmark,
  score,
  currencySymbol,
  hasExistingRMS,
  onHasExistingRMSChange,
  onComplete,
  fullPage = false,
}: ProspectIntakeProps) {
  // ── Group inputs by category (exclude validation-only inputs from wizard) ──
  const groups = useMemo(() => {
    const grouped: Record<string, PriorityInput[]> = {};
    for (const input of priorityInputs) {
      if (input.validationOnly) continue;
      if (!grouped[input.group]) grouped[input.group] = [];
      grouped[input.group].push(input);
    }
    return grouped;
  }, [priorityInputs]);

  const groupKeys = useMemo(() => Object.keys(groups), [groups]);

  // Steps: 0..N-1 = one per input group, N = review
  const totalSteps = groupKeys.length + 1; // groups + review
  const [currentStep, setCurrentStep] = useState(0);

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
  }, [currentStep, totalSteps]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleComplete = () => {
    onComplete();
    // Don't call onClose() — the parent handles the transition via
    // its loading overlay and router.push(). Calling onClose() would
    // flash the user back to the initial wizard step.
  };

  // Count confirmed/adjusted in current group
  const currentGroupKey = currentStep < groupKeys.length ? groupKeys[currentStep] : null;
  const currentGroupInputs = currentGroupKey ? groups[currentGroupKey] : [];

  const stepProgress = ((currentStep + 1) / totalSteps) * 100;

  if (!isOpen) return null;

  const panel = (
    <div className={`w-full bg-mews-linen flex flex-col overflow-hidden ${fullPage ? 'h-[calc(100vh-3.5rem)]' : 'max-w-4xl max-h-[90vh] mx-4 relative rounded-2xl shadow-2xl'}`}>
        {/* Header */}
        <div className={`px-6 pt-5 pb-5 border-b border-gray-200 bg-mews-linen flex-none ${fullPage ? 'max-w-4xl w-full mx-auto' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Build Your Business Case</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Validate key assumptions with the prospect for a stronger ROI
              </p>
            </div>
            {!fullPage && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${stepProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-400">Step {currentStep + 1} of {totalSteps}</span>
            <span className="text-xs text-gray-400">
              {score.confirmedCount} of {score.totalTracked} confirmed
            </span>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 px-6 py-5 overflow-y-auto ${fullPage ? 'max-w-4xl w-full mx-auto' : ''}`}>
          {/* Steps 0..N-1: Input groups */}
          {currentStep < groupKeys.length && currentGroupKey && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                  {GROUP_ICONS[currentGroupKey]}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">
                    {INPUT_GROUPS[currentGroupKey as keyof typeof INPUT_GROUPS]?.label}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {INPUT_GROUPS[currentGroupKey as keyof typeof INPUT_GROUPS]?.description}
                  </p>
                </div>
              </div>

              {/* Special: "Do you already have an RMS?" question for the RMS group */}
              {currentGroupKey === 'rms' && (
                <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800">Do you already have an RMS?</label>
                    <p className="text-xs text-gray-500 mt-0.5">If yes, the RMS module will be excluded from the ROI since they already have automated rate management.</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onHasExistingRMSChange(true)}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        hasExistingRMS
                          ? 'bg-purple-600 text-white border-2 border-purple-600'
                          : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Yes, we have an RMS
                    </button>
                    <button
                      onClick={() => onHasExistingRMSChange(false)}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        !hasExistingRMS
                          ? 'bg-purple-600 text-white border-2 border-purple-600'
                          : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      No RMS today
                    </button>
                  </div>
                  {hasExistingRMS && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-100/60 border border-purple-200">
                      <BarChart3 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-purple-800">
                        RMS module disabled — the prospect is already using an RMS today.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!(currentGroupKey === 'rms' && hasExistingRMS) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentGroupInputs.map((input) => (
                    <SmartField
                      key={input.key}
                      label={input.label}
                      question={input.question}
                      value={getValue(input.slice, input.field)}
                      benchmarkValue={getBenchmarkValue(input.key) ?? getValue(input.slice, input.field)}
                      benchmarkLabel={input.benchmarkLabel}
                      status={getFieldStatus(input.key)}
                      unit={input.unit}
                      min={input.min}
                      max={input.max}
                      step={input.step}
                      onChange={(v) => onValueChange(input.slice, input.field, v)}
                      onConfirm={() => onConfirmField(input.key)}
                      onRevertToBenchmark={() => onRevertFieldToBenchmark(input.key)}
                      showQuestion={intakeMode === 'validated'}
                      benchmarkSourceInfo={input.benchmarkSourceInfo}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Final Step: Review & Confidence Summary */}
          {currentStep === totalSteps - 1 && (
            <div className="space-y-5">
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-gray-900">Your Input Summary</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Review the inputs behind your ROI estimate
                </p>
              </div>

              {/* Confidence meter */}
              <div
                className="rounded-xl border p-4"
                style={{
                  borderColor: CONFIDENCE_LABELS[score.level].color + '30',
                  backgroundColor: CONFIDENCE_LABELS[score.level].bgColor,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CONFIDENCE_LABELS[score.level].color }}
                    />
                    <span className="text-sm font-semibold" style={{ color: CONFIDENCE_LABELS[score.level].color }}>
                      {CONFIDENCE_LABELS[score.level].label}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{score.overall}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${score.overall}%`,
                      backgroundColor: CONFIDENCE_LABELS[score.level].color,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  {CONFIDENCE_LABELS[score.level].description}
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-emerald-700">{score.confirmedCount}</div>
                  <div className="text-xs text-emerald-600">Confirmed</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-amber-700">{score.benchmarkCount}</div>
                  <div className="text-xs text-amber-600">Estimated</div>
                </div>
              </div>

              {/* All inputs in compact form */}
              <div className="space-y-4">
                {groupKeys.map((gk) => {
                  if (gk === 'rms' && hasExistingRMS) {
                    return (
                      <div key={gk}>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          {INPUT_GROUPS[gk as keyof typeof INPUT_GROUPS]?.label}
                        </h4>
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-100/60 border border-purple-200">
                          <BarChart3 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-purple-800">
                            RMS module disabled — the prospect is already using an RMS today.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={gk}>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {INPUT_GROUPS[gk as keyof typeof INPUT_GROUPS]?.label}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {groups[gk].map((input) => (
                          <SmartField
                            key={input.key}
                            label={input.label}
                            value={getValue(input.slice, input.field)}
                            benchmarkValue={getBenchmarkValue(input.key) ?? getValue(input.slice, input.field)}
                            benchmarkLabel={input.benchmarkLabel}
                            status={getFieldStatus(input.key)}
                            unit={input.unit}
                            min={input.min}
                            max={input.max}
                            step={input.step}
                            onChange={(v) => onValueChange(input.slice, input.field, v)}
                            onConfirm={() => onConfirmField(input.key)}
                            onRevertToBenchmark={() => onRevertFieldToBenchmark(input.key)}
                            benchmarkSourceInfo={input.benchmarkSourceInfo}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Unvalidated callout */}
              {score.unvalidatedFields.length > 0 && (
                <div className="bg-amber-50/60 border border-amber-100 rounded-lg px-4 py-3">
                  <p className="text-sm font-medium text-amber-800 mb-1">
                    {score.unvalidatedFields.length} input{score.unvalidatedFields.length > 1 ? 's' : ''} still using benchmark estimates
                  </p>
                  <ul className="text-xs text-amber-700 space-y-0.5">
                    {score.unvalidatedFields.slice(0, 5).map((f) => (
                      <li key={f.key} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        {f.label}
                        {f.importance === 'critical' && (
                          <span className="ml-1 text-amber-800 font-semibold">(high impact)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className={`flex-none border-t border-gray-100 bg-mews-linen ${fullPage ? '' : 'bg-gray-50/50'}`}>
          <div className={`flex items-center justify-between px-6 py-4 ${fullPage ? 'max-w-4xl mx-auto' : ''}`}>
            <button
              onClick={currentStep === 0 ? onClose : goPrev}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </button>

            <div className="flex items-center gap-2">
              {/* Main next / finish button */}
              {currentStep < totalSteps - 1 ? (
                <button
                  onClick={goNext}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg transition-colors bg-mews-primary text-mews-night-black hover:bg-mews-primary-hover"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  See My ROI
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
  );

  if (fullPage) {
    return panel;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      {panel}
    </div>
  );
}
