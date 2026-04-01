'use client';

import { WIZARD_STEPS } from '@/types/onboarding';

interface WizardShellProps {
  currentStep: number;
  sessionId: string;
  isSaving: boolean;
  lastSaved: Date | null;
  onBack: () => void;
  onNext: () => void;
  onStepClick?: (index: number) => void;
  isNextDisabled?: boolean;
  isLastStep?: boolean;
  children: React.ReactNode;
}

export function WizardShell({
  currentStep,
  isSaving,
  lastSaved,
  onBack,
  onNext,
  onStepClick,
  isNextDisabled = false,
  isLastStep = false,
  children,
}: WizardShellProps) {
  const step = WIZARD_STEPS[currentStep] ?? WIZARD_STEPS[0];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-[var(--mews-cream)]">
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className="w-52 flex-shrink-0 bg-[var(--mews-cream)] border-r border-gray-200 flex flex-col overflow-y-auto">
        {/* Logo / brand */}
        <div className="px-4 py-5 border-b border-gray-200">
          <span className="text-xs font-bold text-[var(--mews-night-black)] tracking-widest uppercase">
            Onboarding
          </span>
        </div>

        {/* Step list */}
        <nav className="flex-1 px-3 py-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 px-2">
            Steps
          </p>
          <ol className="space-y-0.5">
            {WIZARD_STEPS.map((s) => {
              const isDone = s.index < currentStep;
              const isCurrent = s.index === currentStep;
              const isClickable = !!onStepClick && !isCurrent;
              return (
                <li key={s.index}>
                  <div
                    role={isClickable ? 'button' : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    onClick={isClickable ? () => onStepClick(s.index) : undefined}
                    onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onStepClick(s.index); } : undefined}
                    className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors ${
                      isCurrent
                        ? 'bg-pink-50 border border-pink-200'
                        : isDone
                        ? 'text-gray-500 hover:bg-gray-100 cursor-pointer'
                        : 'text-gray-400 hover:bg-gray-100 cursor-pointer'
                    }`}
                  >
                    {/* Step indicator circle */}
                    <span
                      className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-colors ${
                        isDone
                          ? 'bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)]'
                          : isCurrent
                          ? 'bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)]'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isDone ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        s.index + 1
                      )}
                    </span>
                    <span
                      className={`text-xs leading-tight ${
                        isCurrent ? 'font-semibold text-[var(--mews-night-black)]' : ''
                      }`}
                    >
                      {s.shortLabel}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Step header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex-shrink-0">
          <p className="text-xs font-semibold text-[var(--mews-primary-pink)] uppercase tracking-widest mb-0.5">
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </p>
          <h1 className="text-xl font-bold text-[var(--mews-night-black)]">{step.label}</h1>
        </header>

        {/* Scrollable step content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </div>

        {/* Footer navigation */}
        <footer className="bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-gray-400">
            {isSaving ? (
              <span className="text-gray-400 animate-pulse">Saving…</span>
            ) : lastSaved ? (
              <>Auto-saved {formatRelative(lastSaved)}</>
            ) : null}
          </span>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              disabled={isNextDisabled}
              className="px-5 py-2 text-sm font-bold bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)] hover:bg-[var(--mews-primary-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLastStep ? 'Done' : 'Next →'}
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

function formatRelative(date: Date): string {
  const diffSecs = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSecs < 5) return 'just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  return `${Math.round(diffSecs / 60)}m ago`;
}
