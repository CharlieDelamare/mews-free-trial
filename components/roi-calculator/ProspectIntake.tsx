'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Clock,
  CreditCard,
  TrendingUp,
  BarChart3,
  BedDouble,
  CheckCircle2,
  X,
} from 'lucide-react';
import SmartField from '@/components/roi-calculator/ui/SmartField';
import type { PriorityInput } from '@/lib/roi-calculator/types/confidence';
import type { ConfidenceStatus, IntakeMode, ConfidenceScore } from '@/lib/roi-calculator/types/confidence';
import type { EnabledModules } from '@/lib/roi-calculator/types/calculator';
import { CONFIDENCE_LABELS } from '@/lib/roi-calculator/utils/confidenceScoring';
import { INPUT_GROUPS } from '@/lib/roi-calculator/utils/priorityInputs';

// Static wizard step definitions — always 4 content steps + 1 review
const WIZARD_STEPS = [
  {
    key: 'property_ops_revenue' as const,
    groups: ['property', 'operations', 'revenue'] as const,
    label: 'Property & Operations',
    description: 'Hotel basics, operations and revenue streams',
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    key: 'payments' as const,
    groups: ['payments'] as const,
    label: 'Payments',
    description: 'Payment processing and reconciliation',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    key: 'rms' as const,
    groups: ['rms'] as const,
    label: 'Revenue Management',
    description: 'Rate plans, channels, and pricing frequency',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    key: 'housekeeping' as const,
    groups: ['housekeeping'] as const,
    label: 'Housekeeping',
    description: 'Room cleaning times and amenity costs',
    icon: <BedDouble className="w-5 h-5" />,
  },
] as const;

type WizardStepKey = (typeof WIZARD_STEPS)[number]['key'];

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
  // Housekeeping existing app
  hasExistingHousekeepingApp: boolean;
  onHasExistingHousekeepingAppChange: (value: boolean) => void;
  // Completion callback
  onComplete: () => void;
  // Render as full page instead of modal
  fullPage?: boolean;
  // When provided, hides steps for disabled modules (dashboard mode)
  enabledModules?: EnabledModules;
}

export default function ProspectIntake({
  isOpen,
  onClose,
  intakeMode,
  priorityInputs,
  getValue,
  onValueChange,
  getFieldStatus,
  getBenchmarkValue,
  onConfirmField,
  onRevertFieldToBenchmark,
  score,
  hasExistingRMS,
  onHasExistingRMSChange,
  hasExistingHousekeepingApp,
  onHasExistingHousekeepingAppChange,
  onComplete,
  fullPage = false,
  enabledModules,
}: ProspectIntakeProps) {
  // Group inputs by category (exclude validation-only inputs from wizard)
  const groups = useMemo(() => {
    const grouped: Record<string, PriorityInput[]> = {};
    for (const input of priorityInputs) {
      if (input.validationOnly) continue;
      if (!grouped[input.group]) grouped[input.group] = [];
      grouped[input.group].push(input);
    }
    return grouped;
  }, [priorityInputs]);

  // When enabledModules is provided (dashboard mode), filter out steps for disabled modules
  const activeSteps = useMemo(() => {
    if (!enabledModules) return WIZARD_STEPS;
    return WIZARD_STEPS.filter((step) => {
      if (step.key === 'rms') return enabledModules.rms;
      if (step.key === 'housekeeping') return enabledModules.housekeeping;
      return true;
    });
  }, [enabledModules]);

  // Total steps = active content steps + 1 review
  const totalSteps = activeSteps.length + 1;
  const [currentStep, setCurrentStep] = useState(0);

  const isReviewStep = currentStep === totalSteps - 1;
  const currentStepDef = !isReviewStep ? activeSteps[currentStep] : null;

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
  }, [currentStep, totalSteps]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleComplete = () => {
    onComplete();
  };

  const stepProgress = ((currentStep + 1) / totalSteps) * 100;

  if (!isOpen) return null;

  // ── Helpers ──────────────────────────────────────────────────────────

  function renderInputGrid(inputs: PriorityInput[], compact = false) {
    if (inputs.length === 0) return null;
    return (
      <div className={compact ? 'grid grid-cols-1 md:grid-cols-2 gap-1.5' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
        {inputs.map((input) => (
          <SmartField
            key={input.key}
            label={input.label}
            question={compact ? undefined : input.question}
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
            showQuestion={!compact && intakeMode === 'validated'}
            benchmarkSourceInfo={input.benchmarkSourceInfo}
            compact={compact}
          />
        ))}
      </div>
    );
  }

  function renderRMSToggle() {
    return (
      <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-800">Do you already have an RMS?</label>
          <p className="text-xs text-gray-500 mt-0.5">
            If yes, the RMS module will be excluded from the ROI since they already have automated rate management.
          </p>
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
    );
  }

  function renderHousekeepingToggle() {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-800">Do you already use a housekeeping app?</label>
          <p className="text-xs text-gray-500 mt-0.5">
            If yes, the Housekeeping module will be excluded from the ROI since they already have a housekeeping app.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onHasExistingHousekeepingAppChange(true)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              hasExistingHousekeepingApp
                ? 'bg-amber-600 text-white border-2 border-amber-600'
                : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            Yes, we use a housekeeping app
          </button>
          <button
            onClick={() => onHasExistingHousekeepingAppChange(false)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              !hasExistingHousekeepingApp
                ? 'bg-amber-600 text-white border-2 border-amber-600'
                : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            No, we don&apos;t use a housekeeping app
          </button>
        </div>
        {hasExistingHousekeepingApp && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-100/60 border border-amber-200">
            <BedDouble className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              Housekeeping module disabled — the prospect is already using a housekeeping app.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Step content ──────────────────────────────────────────────────────

  function renderStepContent(stepDef: (typeof WIZARD_STEPS)[number]) {
    if (stepDef.key === 'property_ops_revenue') {
      // Multi-group step: show sub-headers for each group
      const groupsInStep = stepDef.groups.filter((g) => groups[g]?.length);
      return (
        <div className="space-y-6">
          {groupsInStep.map((gk) => {
            const groupInputs = groups[gk] ?? [];
            const groupMeta = INPUT_GROUPS[gk as keyof typeof INPUT_GROUPS];
            return (
              <div key={gk}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {groupMeta?.label}
                </h4>
                {renderInputGrid(groupInputs)}
              </div>
            );
          })}
        </div>
      );
    }

    if (stepDef.key === 'rms') {
      return (
        <div className="space-y-4">
          {renderRMSToggle()}
          {!hasExistingRMS && renderInputGrid(groups['rms'] ?? [])}
        </div>
      );
    }

    if (stepDef.key === 'housekeeping') {
      return (
        <div className="space-y-4">
          {renderHousekeepingToggle()}
          {!hasExistingHousekeepingApp && renderInputGrid(groups['housekeeping'] ?? [])}
        </div>
      );
    }

    // Single-group step (payments)
    const gk = stepDef.groups[0];
    return renderInputGrid(groups[gk] ?? []);
  }

  // ── Review step content ───────────────────────────────────────────────

  function renderReviewSection(stepDef: (typeof WIZARD_STEPS)[number]) {
    const isDisabled =
      (stepDef.key === 'rms' && hasExistingRMS) ||
      (stepDef.key === 'housekeeping' && hasExistingHousekeepingApp);

    const disabledMessage =
      stepDef.key === 'rms'
        ? 'RMS module excluded — the prospect is already using an RMS today.'
        : 'Housekeeping module excluded — the prospect is already using a housekeeping app.';

    const disabledIcon =
      stepDef.key === 'rms'
        ? <BarChart3 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
        : <BedDouble className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />;

    const disabledBannerClass =
      stepDef.key === 'rms'
        ? 'flex items-start gap-2 p-3 rounded-lg bg-purple-50/60 border border-purple-200'
        : 'flex items-start gap-2 p-3 rounded-lg bg-amber-50/60 border border-amber-200';

    const disabledTextClass =
      stepDef.key === 'rms' ? 'text-xs text-purple-800' : 'text-xs text-amber-800';

    if (isDisabled) {
      return (
        <div key={stepDef.key}>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {stepDef.label}
          </h4>
          <div className={disabledBannerClass}>
            {disabledIcon}
            <p className={disabledTextClass}>{disabledMessage}</p>
          </div>
        </div>
      );
    }

    // Multi-group step
    if (stepDef.groups.length > 1) {
      const groupsWithInputs = (stepDef.groups as readonly string[]).filter((g) => groups[g]?.length);
      return (
        <div key={stepDef.key}>
          {groupsWithInputs.map((gk) => {
            const groupInputs = groups[gk] ?? [];
            const groupMeta = INPUT_GROUPS[gk as keyof typeof INPUT_GROUPS];
            return (
              <div key={gk} className="mb-3 last:mb-0">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {groupMeta?.label}
                </h4>
                {renderInputGrid(groupInputs, true)}
              </div>
            );
          })}
        </div>
      );
    }

    // Single-group step
    const gk = stepDef.groups[0];
    const stepInputs = groups[gk] ?? [];
    return (
      <div key={stepDef.key}>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {stepDef.label}
        </h4>
        {renderInputGrid(stepInputs, true)}
      </div>
    );
  }

  // ── Panel ─────────────────────────────────────────────────────────────

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

        {/* Content steps 0–3 */}
        {!isReviewStep && currentStepDef && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                {currentStepDef.icon}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">{currentStepDef.label}</h3>
                <p className="text-sm text-gray-500">{currentStepDef.description}</p>
              </div>
            </div>

            {renderStepContent(currentStepDef)}
          </div>
        )}

        {/* Final Step: Review & Confidence Summary */}
        {isReviewStep && (
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

            {/* All inputs grouped by wizard step */}
            <div className="space-y-4">
              {activeSteps.map((stepDef) => renderReviewSection(stepDef))}
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
            {!isReviewStep ? (
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
