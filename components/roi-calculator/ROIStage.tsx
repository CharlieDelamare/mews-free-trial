'use client';

import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import HeroNumber from '@/components/roi-calculator/HeroNumber';
import { MODULE_META, MODULE_KEYS } from '@/hooks/useROICalculator';
import WaterfallChart from '@/components/roi-calculator/WaterfallChart';
import ModuleStoryPanel from '@/components/roi-calculator/ModuleStoryPanel';
import ActionDock from '@/components/roi-calculator/ActionDock';
import CinematicOverlay from '@/components/roi-calculator/CinematicOverlay';
import ProspectIntake from '@/components/roi-calculator/ProspectIntake';
import DataComparisonSection from '@/components/roi-calculator/DataComparisonSection';
import DiscoverySection from '@/components/roi-calculator/sections/DiscoverySection';
import ExportModal from '@/components/roi-calculator/ui/ExportModal';
import PDFTemplate from '@/components/roi-calculator/PDFTemplate';
import { ChevronDown } from 'lucide-react';
import { countries, hotelTypes, usStates, getSmartDefaults, getBenchmarkForField } from '@/lib/roi-calculator/utils/hotelDefaults';
import { getTranslations } from '@/lib/roi-calculator/translations';
import { useROICalculator } from '@/hooks/useROICalculator';
import { useConfidence } from '@/hooks/useConfidence';
import { getPriorityInputs } from '@/lib/roi-calculator/utils/priorityInputs';
import { buildInitialConfidenceMap, inferConfidenceMap } from '@/lib/roi-calculator/utils/confidenceScoring';
import { serializeState } from '@/lib/roi-calculator/utils/persistence';
import type { PersistedState } from '@/lib/roi-calculator/utils/persistence';
import type {
  SharedVariables,
  GuestExperienceInputs,
  PaymentInputs,
  RMSInputs,
  HousekeepingInputs,
  ModuleKey,
} from '@/lib/roi-calculator/types/calculator';
import type { IntakeMode } from '@/lib/roi-calculator/types/confidence';

interface ROIStageProps {
  presentationId?: string;
  initialState?: PersistedState;
}

export default function ROIStage({ presentationId, initialState }: ROIStageProps = {}) {
  const {
    state,
    dispatch,
    results,
    filteredResults,
    leverDescriptors,
    enabledModuleKeys,
    propertyContextString,
  } = useROICalculator(initialState);

  const { config, ui, sharedVariables, guestExperience, payment, rms, housekeeping } = state;
  const { currencySymbol } = config;
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);

  // ── Priority inputs & confidence tracking ────────────────────────
  const priorityInputs = useMemo(
    () => getPriorityInputs(currencySymbol, config.country, config.hotelType),
    [currencySymbol, config.country, config.hotelType],
  );

  const {
    confidenceState,
    confidenceDispatch,
    score,
    getFieldStatus,
    getBenchmarkValue,
    setFieldConfidence,
    confirmField,
    revertToBenchmark,
    initConfidence,
  } = useConfidence(priorityInputs);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  // Always hold the latest state so the debounced save never uses a stale snapshot
  const latestStateRef = useRef(state);
  latestStateRef.current = state;
  const latestConfidenceRef = useRef(confidenceState.map);
  latestConfidenceRef.current = confidenceState.map;

  useEffect(() => {
    if (!presentationId) return;
    // Skip the very first render — state hasn't changed yet
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/roi-presentations/${presentationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          // Use latestStateRef to always capture the most recent state, even if
          // the user kept editing during the 1.5s debounce window.
          body: JSON.stringify({ state: serializeState(latestStateRef.current, latestConfidenceRef.current) }),
        });
        if (!res.ok) throw new Error(`Save failed: ${res.status}`);
        setSaveStatus('saved');
        if (savedClearRef.current) clearTimeout(savedClearRef.current);
        savedClearRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
        console.error('[ROI] Auto-save failed');
      }
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (savedClearRef.current) clearTimeout(savedClearRef.current);
    };
  // Depend only on non-ui slices so UI-only changes (opening modals, cinematic mode)
  // don't trigger unnecessary PATCH requests. Confidence map is included because
  // confirmed/adjusted/unknown statuses are meaningful and must be persisted.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.config, state.sharedVariables, state.guestExperience, state.payment, state.rms, state.housekeeping, confidenceState.map, presentationId]);

  // Helper: get a value from any state slice by name
  const getSliceValue = useCallback(
    (slice: string, field: string): number => {
      const sliceData = state[slice as keyof typeof state] as unknown as Record<string, unknown>;
      return (sliceData?.[field] as number) ?? 0;
    },
    [state],
  );

  // Helper: set a value in any state slice by name
  const setSliceValue = useCallback(
    (slice: string, field: string, value: number) => {
      dispatch({ type: 'SET_FIELD', slice: slice as 'sharedVariables', field: field as keyof SharedVariables, value } as Parameters<typeof dispatch>[0]);
    },
    [dispatch],
  );

  // On mount, restore confidence map from a saved presentation.
  // For new presentations saved after the confidence-persistence fix: use the stored map.
  // For old presentations (no stored map): infer status by comparing saved values vs benchmarks.
  const hasRestoredConfidence = useRef(false);
  useEffect(() => {
    if (hasRestoredConfidence.current || !initialState) return;
    hasRestoredConfidence.current = true;
    if (initialState.confidenceMap) {
      initConfidence(initialState.confidenceMap);
    } else {
      const defaults = getSmartDefaults(
        initialState.config.country,
        initialState.config.hotelType,
        initialState.config.usState || undefined,
      );
      const map = inferConfidenceMap(
        priorityInputs,
        (slice, field) => getBenchmarkForField(defaults, slice, field) ?? getSliceValue(slice, field),
        getSliceValue,
      );
      initConfidence(map);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize confidence map when benchmarks are applied (new presentations, or
  // when the user explicitly changes country / hotel type on an existing one).
  useEffect(() => {
    if (!config.isInitialLoad) {
      const map = buildInitialConfidenceMap(priorityInputs, getSliceValue);
      initConfidence(map);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.country, config.hotelType]);

  const handleRevertFieldToBenchmark = useCallback(
    (key: string) => revertToBenchmark(key),
    [revertToBenchmark],
  );

  const handleIntakeComplete = useCallback(() => {
    confidenceDispatch({ type: 'COMPLETE_INTAKE' });
  }, [confidenceDispatch]);

  const handleIntakeModeChange = useCallback(
    (mode: IntakeMode) => confidenceDispatch({ type: 'SET_INTAKE_MODE', mode }),
    [confidenceDispatch],
  );

  // Change handlers
  const handleSharedVariablesChange = useCallback(
    <K extends keyof SharedVariables>(field: K, value: SharedVariables[K]) => {
      dispatch({ type: 'SET_FIELD', slice: 'sharedVariables', field, value });
    },
    [dispatch],
  );

  const handleGuestExperienceChange = useCallback(
    <K extends keyof GuestExperienceInputs>(field: K, value: GuestExperienceInputs[K]) => {
      dispatch({ type: 'SET_FIELD', slice: 'guestExperience', field, value });
    },
    [dispatch],
  );

  const handlePaymentChange = useCallback(
    <K extends keyof PaymentInputs>(field: K, value: PaymentInputs[K]) => {
      dispatch({ type: 'SET_FIELD', slice: 'payment', field, value });
    },
    [dispatch],
  );

  const handleRMSChange = useCallback(
    <K extends keyof RMSInputs>(field: K, value: RMSInputs[K]) => {
      dispatch({ type: 'SET_FIELD', slice: 'rms', field, value });
    },
    [dispatch],
  );

  const handleHousekeepingChange = useCallback(
    <K extends keyof HousekeepingInputs>(field: K, value: HousekeepingInputs[K]) => {
      dispatch({ type: 'SET_FIELD', slice: 'housekeeping', field, value });
    },
    [dispatch],
  );

  // Export — modal UI always in English; PDF uses presentationLanguage
  const enT = getTranslations('en');
  const exportableSections = [
    { id: 'guest-experience', label: enT.modules.guestExperience },
    { id: 'payment', label: enT.modules.payment },
    { id: 'rms', label: enT.modules.rms },
    { id: 'housekeeping', label: enT.modules.housekeeping },
  ];

  const handleExportPDF = async () => {
    dispatch({ type: 'SET_EXPORTING', value: true });
    try {
      // SSR-safe dynamic imports — html2canvas and jsPDF access window/document
      // at module load time; dynamic imports ensure they only load in the browser.
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      let filteredTime = 0, filteredSavings = 0;
      if (ui.selectedSections.includes('guest-experience')) { filteredTime += results.guestExperience.totalTime; filteredSavings += results.guestExperience.totalSavings; }
      if (ui.selectedSections.includes('payment')) { filteredTime += results.payment.totalTime; filteredSavings += results.payment.totalSavings; }
      if (ui.selectedSections.includes('rms')) { filteredTime += results.rms.totalTime; filteredSavings += results.rms.totalSavings; }
      if (ui.selectedSections.includes('housekeeping')) { filteredTime += results.housekeeping.totalTime; filteredSavings += results.housekeeping.totalSavings; }

      const pdfData = {
        title: config.title,
        country: config.country,
        hotelType: config.hotelType,
        presentationLanguage: config.presentationLanguage,
        currencySymbol,
        totalSavings: filteredSavings,
        totalTime: filteredTime,
        sections: {
          ...(ui.selectedSections.includes('guest-experience') && {
            guestExperience: {
              inputs: guestExperience,
              checkInSavings: results.guestExperience.checkInSavings,
              roomAssignmentSavings: results.guestExperience.roomAssignmentSavings,
              upsellRevenue: results.guestExperience.upsellRevenue,
              commissionSaved: results.guestExperience.commissionSaved,
              totalTime: results.guestExperience.totalTime,
              totalSavings: results.guestExperience.totalSavings,
            },
          }),
          ...(ui.selectedSections.includes('payment') && {
            payment: {
              inputs: {
                transactionsPerMonth: payment.transactionsPerMonth,
                secondsPerTransaction: payment.secondsPerTransaction,
                processingWage: payment.processingWage,
                chargebackRate: payment.chargebackRate,
                mewsChargebackRate: payment.mewsChargebackRate,
                reconciliationTimeDaily: payment.reconciliationTimeDaily,
                monthlyRevenue: payment.monthlyRevenue,
                noShowRate: payment.noShowRate,
                noShowWithoutFee: payment.noShowWithoutFee,
                foreignCurrencyPercent: payment.foreignCurrencyPercent,
                multiCurrencyAdoption: payment.multiCurrencyAdoption,
                revenueShare: payment.revenueShare,
              },
              tokenizationTimeSaved: results.payment.tokenizationTimeSaved,
              tokenizationCostSavings: results.payment.tokenizationCostSavings,
              chargebackReduction: results.payment.chargebackReduction,
              reconciliationTimeSaved: results.payment.reconciliationTimeSaved,
              reconciliationCostSavings: results.payment.reconciliationCostSavings,
              noShowRevenue: results.payment.noShowRevenue,
              multiCurrencyRevenue: results.payment.multiCurrencyRevenue,
              totalTime: results.payment.totalTime,
              totalSavings: results.payment.totalSavings,
            },
          }),
          ...(ui.selectedSections.includes('rms') && {
            rms: {
              inputs: {
                hotelRevPAR: rms.hotelRevPAR,
                numberOfRooms: rms.numberOfRooms,
                numberOfRatePlans: rms.numberOfRatePlans,
                rateUpdateFrequency: rms.rateUpdateFrequency,
                numberOfChannels: rms.numberOfChannels,
                avgTimeToUpdateRate: rms.avgTimeToUpdateRate,
                hasRevenueManager: rms.hasRevenueManager,
                hasExistingRMS: rms.hasExistingRMS,
                estimatedRevenueUplift: results.rms.estimatedRevenueUplift,
              },
              annualRevenueGain: results.rms.annualRevenueGain,
              annualHoursSaved: results.rms.annualHoursSaved,
              annualLaborCostSavings: results.rms.annualLaborCostSavings,
              totalTime: results.rms.totalTime,
              totalSavings: results.rms.totalSavings,
            },
          }),
          ...(ui.selectedSections.includes('housekeeping') && {
            housekeeping: {
              roomAssignmentHours: results.housekeeping.roomAssignmentHours,
              roomAssignmentCost: results.housekeeping.roomAssignmentCost,
              cleaningStatusHours: results.housekeeping.cleaningStatusHours,
              cleaningStatusCost: results.housekeeping.cleaningStatusCost,
              maintenanceCommHours: results.housekeeping.maintenanceCommHours,
              maintenanceCommCost: results.housekeeping.maintenanceCommCost,
              taskMgmtHours: results.housekeeping.taskMgmtHours,
              taskMgmtCost: results.housekeeping.taskMgmtCost,
              amenitiesCostSaved: results.housekeeping.amenitiesCostSaved,
              paperCostSaved: results.housekeeping.paperCostSaved,
              totalTime: results.housekeeping.totalTime,
              totalSavings: results.housekeeping.totalSavings,
            },
          }),
        },
      };

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '1056px';
      document.body.appendChild(tempContainer);
      const root = createRoot(tempContainer);
      root.render(<PDFTemplate data={pdfData} />);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Render each slide individually for true landscape PDF
      const slides = tempContainer.querySelectorAll('.slide-page');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [816, 1056], hotfixes: ['px_scaling'] });

      for (let i = 0; i < slides.length; i++) {
        const canvas = await html2canvas(slides[i] as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#0a0a12', // matches --roi-pdf-bg-dark in globals.css; canvas API requires a literal color string
          width: 1056,
          height: 816,
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage([816, 1056], 'landscape');
        pdf.addImage(imgData, 'JPEG', 0, 0, 1056, 816);
      }

      pdf.save(`Mews-ROI-Presentation-${new Date().toISOString().split('T')[0]}.pdf`);
      root.unmount();
      document.body.removeChild(tempContainer);
      dispatch({ type: 'CLOSE_EXPORT' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      dispatch({ type: 'SET_EXPORTING', value: false });
    }
  };

  return (
    <>
      {/* ─── Presentation Mode Overlay ─── */}
      {ui.cinematicMode && (
        <CinematicOverlay
          slideIndex={ui.cinematicSlideIndex}
          autoAdvance={ui.cinematicAutoAdvance}
          enabledModuleKeys={enabledModuleKeys}
          filteredResults={filteredResults}
          leverDescriptors={leverDescriptors}
          propertyContext={propertyContextString}
          title={config.title}
          currencySymbol={currencySymbol}
          dispatch={dispatch}
          presentationLanguage={config.presentationLanguage}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        {/* ─── Zone 1: The Stage ─── */}
        <div className="pt-6 md:pt-10">
          {/* Page heading */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-mews-night-black">ROI Calculator</h1>
          </div>

          {/* Presentation title */}
          <div className="flex flex-col items-center mb-4">
            <input
              type="text"
              value={config.title}
              onChange={(e) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'title', value: e.target.value })}
              placeholder="Enter presentation title…"
              className="w-full max-w-xl text-center text-2xl font-bold text-gray-800 bg-transparent outline-none placeholder:text-gray-300 placeholder:font-normal"
            />
          </div>

          {/* Country, State & Hotel Type selectors */}
          <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
            <div className="relative">
              <select
                value={config.country}
                onChange={(e) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'country', value: e.target.value })}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 font-medium focus:ring-2 focus:ring-mews-primary focus:border-mews-primary outline-none transition-all cursor-pointer"
              >
                {countries.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {config.country === 'United States' && (
              <div className="relative">
                <select
                  value={config.usState}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'usState', value: e.target.value })}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 font-medium focus:ring-2 focus:ring-mews-primary focus:border-mews-primary outline-none transition-all cursor-pointer"
                >
                  <option value="">All states (national avg)</option>
                  {usStates.map((s) => (
                    <option key={s.code} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            )}
            <div className="relative">
              <select
                value={config.hotelType}
                onChange={(e) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'hotelType', value: e.target.value })}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 font-medium focus:ring-2 focus:ring-mews-primary focus:border-mews-primary outline-none transition-all cursor-pointer"
              >
                {hotelTypes.map((ht) => (
                  <option key={ht} value={ht}>{ht}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Hero Number */}
          <HeroNumber
            totalSavings={filteredResults.totalSavings}
            costSavings={filteredResults.costSavings}
            revenueUplift={filteredResults.revenueUplift}
            totalTime={filteredResults.totalTime}
            currencySymbol={currencySymbol}
            contributions={filteredResults.contributions}
            leverDescriptors={leverDescriptors}
          />

          {/* Module Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {MODULE_KEYS.map((moduleKey) => {
              const meta = MODULE_META[moduleKey];
              const enabled = ui.enabledModules[moduleKey];
              const isActive = ui.activeDetailModule === moduleKey;
              const contribution = filteredResults.contributions.find((c) => c.key === moduleKey);
              const savings = contribution?.savings ?? 0;
              const fmt = (v: number) => {
                const abs = Math.abs(v);
                if (abs >= 1_000_000) return `${currencySymbol}${(v / 1_000_000).toFixed(1)}M`;
                if (abs >= 10_000) return `${currencySymbol}${Math.round(v / 1_000)}k`;
                if (abs >= 1_000) return `${currencySymbol}${(v / 1_000).toFixed(1)}k`;
                return `${currencySymbol}${Math.round(v)}`;
              };
              return (
                <button
                  key={moduleKey}
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`${enabled ? 'Disable' : 'Enable'} ${meta.label}`}
                  className="inline-flex items-center rounded-2xl border-2 bg-white transition-all duration-200 select-none cursor-pointer focus:outline-none pl-2 pr-3 py-2 gap-2"
                  style={{
                    borderColor: isActive ? meta.color : enabled ? meta.color + '55' : 'var(--neutral-200)',
                    opacity: enabled ? 1 : 0.55,
                    boxShadow: isActive ? `0 2px 12px ${meta.color}30` : 'none',
                  }}
                  onClick={() => dispatch({ type: 'TOGGLE_MODULE', module: moduleKey })}
                >
                  {/* Visual toggle track */}
                  <span
                    className="relative inline-flex w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
                    style={{ background: enabled ? meta.color : 'var(--neutral-300)' }}
                  >
                    {/* Knob */}
                    <span
                      className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200"
                      style={{ transform: enabled ? 'translateX(19px)' : 'translateX(3px)' }}
                    />
                  </span>
                  <span className="text-sm font-bold text-gray-800 whitespace-nowrap">{meta.label}</span>
                  {enabled && savings > 0 && (
                    <span className="text-xs font-semibold tabular-nums" style={{ color: meta.textColor }}>
                      {fmt(savings)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Waterfall Chart */}
          <div className="mt-6">
            <WaterfallChart
              contributions={filteredResults.contributions}
              totalSavings={filteredResults.totalSavings}
              currencySymbol={currencySymbol}
              leverDescriptors={leverDescriptors}
            />
          </div>

          {/* Data Comparison: Mews Benchmarks vs Prospect */}
          <DataComparisonSection
            priorityInputs={priorityInputs}
            currencySymbol={currencySymbol}
            getValue={getSliceValue}
            getBenchmarkValue={getBenchmarkValue}
            getFieldStatus={getFieldStatus}
            onValueChange={setSliceValue}
            onConfirmField={confirmField}
            score={score}
          />

        </div>

        {/* ─── Zone 2: Module Detail Drawer ─── */}
        {ui.activeDetailModule && ui.enabledModules[ui.activeDetailModule] && (
          <div className="mt-6">
            <ModuleStoryPanel
              moduleKey={ui.activeDetailModule}
              levers={leverDescriptors[ui.activeDetailModule]}
              currencySymbol={currencySymbol}
              expandedLever={ui.expandedLever}
              editingLever={ui.editingLever}
              dispatch={dispatch}
              state={state as unknown as Record<string, unknown>}
              onClose={() => dispatch({ type: 'SET_ACTIVE_DETAIL', module: ui.activeDetailModule })}
            />
          </div>
        )}
      </div>

      {/* ─── Zone 3: Action Dock ─── */}
      <ActionDock
        onPresentationMode={() => dispatch({ type: 'ENTER_CINEMATIC' })}
        onExport={() => dispatch({ type: 'SET_FIELD', slice: 'ui', field: 'isExportModalOpen', value: true })}
        onDiscovery={() => setIsDiscoveryOpen(true)}
        presentationLanguage={config.presentationLanguage}
        onLanguageChange={(lang) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'presentationLanguage', value: lang })}
        saveStatus={presentationId ? saveStatus : undefined}
      />

      {/* Modals */}
      <ExportModal
        isOpen={ui.isExportModalOpen}
        onClose={() => dispatch({ type: 'SET_FIELD', slice: 'ui', field: 'isExportModalOpen', value: false })}
        sections={exportableSections}
        selectedSections={ui.selectedSections}
        onToggleSection={(id) => dispatch({ type: 'TOGGLE_EXPORT_SECTION', sectionId: id })}
        onExport={handleExportPDF}
        isExporting={ui.isExporting}
        presentationLanguage={config.presentationLanguage}
      />

      <DiscoverySection
        isOpen={isDiscoveryOpen}
        onClose={() => setIsDiscoveryOpen(false)}
        country={config.country}
        usState={config.usState}
        hotelType={config.hotelType}
        onCountryChange={(v) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'country', value: v })}
        onUSStateChange={(v) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'usState', value: v })}
        onHotelTypeChange={(v) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'hotelType', value: v })}
        countries={countries}
        hotelTypes={hotelTypes}
        usStates={usStates}
        sharedVariables={sharedVariables}
        onSharedVariablesChange={handleSharedVariablesChange}
        guestExperience={guestExperience}
        onGuestExperienceChange={handleGuestExperienceChange}
        payment={payment}
        onPaymentChange={handlePaymentChange}
        rms={rms}
        onRMSChange={handleRMSChange}
        currencySymbol={currencySymbol}
      />

      {/* ─── Prospect Intake (Benchmark Validation Flow) ─── */}
      <ProspectIntake
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        intakeMode={'validated' as IntakeMode}
        onModeChange={handleIntakeModeChange}
        priorityInputs={priorityInputs}
        getValue={getSliceValue}
        onValueChange={setSliceValue}
        getFieldStatus={getFieldStatus}
        getBenchmarkValue={getBenchmarkValue}
        onConfirmField={confirmField}
        onRevertFieldToBenchmark={handleRevertFieldToBenchmark}
        score={score}
        currencySymbol={currencySymbol}
        hasExistingRMS={rms.hasExistingRMS}
        onHasExistingRMSChange={(v) => dispatch({ type: 'SET_FIELD', slice: 'rms', field: 'hasExistingRMS', value: v })}
        onComplete={handleIntakeComplete}
      />
    </>
  );
}
