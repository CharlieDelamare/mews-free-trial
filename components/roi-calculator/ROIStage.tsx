'use client';

import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import PropertyContextLine from '@/components/roi-calculator/PropertyContextLine';
import HeroNumber from '@/components/roi-calculator/HeroNumber';
import ModulePillsBar from '@/components/roi-calculator/ModulePillsBar';
import WaterfallChart from '@/components/roi-calculator/WaterfallChart';
import ModuleStoryPanel from '@/components/roi-calculator/ModuleStoryPanel';
import ActionDock from '@/components/roi-calculator/ActionDock';
import CinematicOverlay from '@/components/roi-calculator/CinematicOverlay';
import ProspectIntake from '@/components/roi-calculator/ProspectIntake';
import DataComparisonSection from '@/components/roi-calculator/DataComparisonSection';
import DiscoverySection from '@/components/roi-calculator/sections/DiscoverySection';
import ExportModal from '@/components/roi-calculator/ui/ExportModal';
import { AlertTriangle, Shield, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { CONFIDENCE_LABELS } from '@/lib/roi-calculator/utils/confidenceScoring';
import PDFTemplate from '@/components/roi-calculator/PDFTemplate';
import { countries, hotelTypes, usStates } from '@/lib/roi-calculator/utils/hotelDefaults';
import { getTranslations } from '@/lib/roi-calculator/translations';
import { useROICalculator } from '@/hooks/useROICalculator';
import { useConfidence } from '@/hooks/useConfidence';
import { getPriorityInputs } from '@/lib/roi-calculator/utils/priorityInputs';
import { buildInitialConfidenceMap } from '@/lib/roi-calculator/utils/confidenceScoring';
import { serializeState } from '@/lib/roi-calculator/utils/persistence';
import type {
  SharedVariables,
  GuestExperienceInputs,
  PaymentInputs,
  RMSInputs,
  ModuleKey,
  CalculatorState,
} from '@/lib/roi-calculator/types/calculator';
import type { IntakeMode } from '@/lib/roi-calculator/types/confidence';

interface ROIStageProps {
  presentationId?: string;
  initialState?: Omit<CalculatorState, 'ui'>;
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

  const { config, ui, sharedVariables, guestExperience, payment, rms } = state;
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
    markUnknown,
    initConfidence,
  } = useConfidence(priorityInputs);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

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
        await fetch(`/api/roi-presentations/${presentationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: serializeState(state) }),
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
        console.error('[ROI] Auto-save failed');
      }
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [state, presentationId]);

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

  // Initialize confidence map when benchmarks are applied
  useEffect(() => {
    if (!config.isInitialLoad) {
      const map = buildInitialConfidenceMap(priorityInputs, getSliceValue);
      initConfidence(map);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.country, config.hotelType]);

  const handleAdjustField = useCallback(
    (key: string) => setFieldConfidence(key, 'adjusted'),
    [setFieldConfidence],
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

  // Export
  const t = getTranslations(config.presentationLanguage);
  const exportableSections = [
    { id: 'guest-experience', label: t.modules.guestExperience },
    { id: 'payment', label: t.modules.payment },
    { id: 'rms', label: t.modules.rms },
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
          {/* Presentation title */}
          <div className="flex justify-center mb-4">
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
            <select
              value={config.country}
              onChange={(e) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'country', value: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 font-medium focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
            >
              {countries.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            {config.country === 'United States' && (
              <select
                value={config.usState}
                onChange={(e) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'usState', value: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 font-medium focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
              >
                <option value="">All states (national avg)</option>
                {usStates.map((s) => (
                  <option key={s.code} value={s.name}>{s.name}</option>
                ))}
              </select>
            )}
            <select
              value={config.hotelType}
              onChange={(e) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'hotelType', value: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 font-medium focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
            >
              {hotelTypes.map((ht) => (
                <option key={ht} value={ht}>{ht}</option>
              ))}
            </select>
          </div>

          {/* Property Context Line */}
          <div className="flex items-center justify-center gap-2">
            <PropertyContextLine contextString={propertyContextString} />
            {presentationId && saveStatus !== 'idle' && (
              <span className="text-xs text-[--mews-night-black]/50">
                {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
              </span>
            )}
          </div>

          {/* Confidence CTA — big button to open prospect intake */}
          {(() => {
            const meta = CONFIDENCE_LABELS[score.level];
            const LevelIcon = score.level === 'directional' ? AlertTriangle
              : score.level === 'indicative' ? Shield
              : score.level === 'validated' ? CheckCircle2
              : ShieldCheck;
            return (
              <div className="flex justify-center mt-3 mb-2">
                <button
                  onClick={() => setIsIntakeOpen(true)}
                  className="flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md group"
                  style={{
                    borderColor: meta.color + '40',
                    backgroundColor: meta.bgColor,
                  }}
                >
                  <LevelIcon className="w-5 h-5 flex-shrink-0" style={{ color: meta.color }} />
                  <div className="text-left">
                    <div className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</div>
                    <div className="text-xs text-gray-500">Customize inputs with prospect</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            );
          })()}

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
          <ModulePillsBar
            enabledModules={ui.enabledModules}
            activeDetailModule={ui.activeDetailModule}
            filteredResults={filteredResults}
            currencySymbol={currencySymbol}
            onToggleModule={(module: ModuleKey) => dispatch({ type: 'TOGGLE_MODULE', module })}
            onSelectModule={(module: ModuleKey) => dispatch({ type: 'SET_ACTIVE_DETAIL', module })}
          />

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
            onAdjustField={handleAdjustField}
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
        onAdjustField={handleAdjustField}
        onMarkUnknown={markUnknown}
        score={score}
        country={config.country}
        usState={config.usState}
        hotelType={config.hotelType}
        onCountryChange={(v) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'country', value: v })}
        onUSStateChange={(v) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'usState', value: v })}
        onHotelTypeChange={(v) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'hotelType', value: v })}
        currencySymbol={currencySymbol}
        hasExistingRMS={rms.hasExistingRMS}
        onHasExistingRMSChange={(v) => dispatch({ type: 'SET_FIELD', slice: 'rms', field: 'hasExistingRMS', value: v })}
        onComplete={handleIntakeComplete}
      />
    </>
  );
}
