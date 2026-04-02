'use client';

import { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Maximize2, Minimize2 } from 'lucide-react';
import CinematicSlide from '@/components/roi-calculator/CinematicSlide';
import { MODULE_META, MODULE_KEYS } from '@/hooks/useROICalculator';
import { getTranslations } from '@/lib/roi-calculator/translations';
import type { LanguageCode } from '@/lib/roi-calculator/types/translations';
import type { ModuleKey, FilteredResults, LeverDescriptor, CalculatorAction } from '@/lib/roi-calculator/types/calculator';

interface CinematicOverlayProps {
  slideIndex: number;
  autoAdvance: boolean;
  enabledModuleKeys: ModuleKey[];
  filteredResults: FilteredResults;
  leverDescriptors: Record<ModuleKey, LeverDescriptor[]>;
  propertyContext: string;
  title: string;
  currencySymbol: string;
  dispatch: React.Dispatch<CalculatorAction>;
  presentationLanguage: LanguageCode;
}

export default function CinematicOverlay({
  slideIndex,
  autoAdvance,
  enabledModuleKeys,
  filteredResults,
  leverDescriptors,
  propertyContext,
  title,
  currencySymbol,
  dispatch,
  presentationLanguage,
}: CinematicOverlayProps) {
  const t = getTranslations(presentationLanguage);

  // Total slides: title + N modules + summary
  const totalSlides = enabledModuleKeys.length + 2;

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const next = useCallback(() => dispatch({ type: 'CINEMATIC_NEXT' }), [dispatch]);
  const prev = useCallback(() => dispatch({ type: 'CINEMATIC_PREV' }), [dispatch]);
  const exit = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    dispatch({ type: 'EXIT_CINEMATIC' });
  }, [dispatch]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit();
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, exit]);

  // Auto-advance
  useEffect(() => {
    if (!autoAdvance) return;
    if (slideIndex >= totalSlides - 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [autoAdvance, slideIndex, totalSlides, next]);

  // Build current slide content
  const renderSlide = () => {
    if (slideIndex === 0) {
      return (
        <CinematicSlide
          type="title"
          title={title}
          propertyContext={propertyContext}
          totalSavings={filteredResults.totalSavings}
          costSavings={filteredResults.costSavings}
          revenueUplift={filteredResults.revenueUplift}
          totalTime={filteredResults.totalTime}
          currencySymbol={currencySymbol}
          t={t}
        />
      );
    }

    if (slideIndex <= enabledModuleKeys.length) {
      const moduleKey = enabledModuleKeys[slideIndex - 1];
      const meta = MODULE_META[moduleKey];
      const contribution = filteredResults.contributions.find((c) => c.key === moduleKey);
      return (
        <CinematicSlide
          type="module"
          moduleKey={moduleKey}
          label={t.modules[moduleKey]}
          color={meta.color}
          totalSavings={contribution?.savings ?? 0}
          levers={leverDescriptors[moduleKey]}
          currencySymbol={currencySymbol}
          t={t}
        />
      );
    }

    return (
      <CinematicSlide
        type="summary"
        filteredResults={filteredResults}
        currencySymbol={currencySymbol}
        leverDescriptors={leverDescriptors}
        t={t}
      />
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--roi-cinematic-bg)' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-sm text-gray-500 font-medium">
          {slideIndex + 1} / {totalSlides}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_CINEMATIC_AUTO' })}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: autoAdvance ? 'color-mix(in srgb, var(--mews-indigo) 15%, transparent)' : 'color-mix(in srgb, var(--mews-white) 5%, transparent)',
            }}
          >
            {autoAdvance ? (
              <Pause className="w-4 h-4 text-teal-400" />
            ) : (
              <Play className="w-4 h-4 text-gray-500" />
            )}
          </button>
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              } else {
                document.documentElement.requestFullscreen().catch(() => {});
              }
            }}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-pressed={isFullscreen}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={exit}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center mx-auto w-full">
        {renderSlide()}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-4 px-6 py-6">
        <button
          onClick={prev}
          disabled={slideIndex === 0}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-20"
          style={{ background: 'color-mix(in srgb, var(--mews-white) 8%, transparent)' }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Slide dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                // Navigate to specific slide by dispatching the right number of next/prev
                const diff = i - slideIndex;
                for (let j = 0; j < Math.abs(diff); j++) {
                  dispatch({ type: diff > 0 ? 'CINEMATIC_NEXT' : 'CINEMATIC_PREV' });
                }
              }}
              className="transition-all duration-200"
              style={{
                width: i === slideIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === slideIndex ? 'var(--mews-primary-pink)' : 'color-mix(in srgb, var(--mews-white) 20%, transparent)',
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={slideIndex >= totalSlides - 1}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-20"
          style={{ background: 'color-mix(in srgb, var(--mews-white) 8%, transparent)' }}
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
