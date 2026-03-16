'use client';

import { X, SlidersHorizontal } from 'lucide-react';
import LeverCard from '@/components/roi-calculator/ui/LeverCard';
import Slider from '@/components/roi-calculator/ui/Slider';
import { MODULE_META } from '@/hooks/useROICalculator';
import type { ModuleKey, LeverDescriptor, LeverExpansion, CalculatorAction } from '@/lib/roi-calculator/types/calculator';

interface ModuleStoryPanelProps {
  moduleKey: ModuleKey;
  levers: LeverDescriptor[];
  currencySymbol: string;
  expandedLever: LeverExpansion | null;
  editingLever: LeverExpansion | null;
  dispatch: React.Dispatch<CalculatorAction>;
  state: Record<string, unknown>;
  onClose: () => void;
}

function getSliderValue(state: Record<string, unknown>, slice: string, field: string): number {
  const s = state[slice];
  if (s && typeof s === 'object' && field in (s as Record<string, unknown>)) {
    return (s as Record<string, number>)[field] ?? 0;
  }
  return 0;
}

export default function ModuleStoryPanel({
  moduleKey,
  levers,
  currencySymbol,
  expandedLever,
  editingLever,
  dispatch,
  state,
  onClose,
}: ModuleStoryPanelProps) {
  const meta = MODULE_META[moduleKey];
  const totalSavings = levers.reduce((sum, l) => sum + l.resultValue, 0);

  const isLeverExpanded = (leverKey: string) =>
    expandedLever?.module === moduleKey && expandedLever?.lever === leverKey;

  const isLeverEditing = (leverKey: string) =>
    editingLever?.module === moduleKey && editingLever?.lever === leverKey;

  return (
    <div
      className="rounded-2xl overflow-hidden animate-slide-up"
      style={{
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(28,29,36,0.08)',
        boxShadow: '0 4px 24px rgba(28,29,36,0.08)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(28,29,36,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full" style={{ background: meta.color }} />
          <div>
            <h3 className="text-base font-bold text-gray-800">{meta.label}</h3>
            <span className="text-sm text-gray-500 tabular-nums">
              {currencySymbol}{Math.round(totalSavings).toLocaleString()}/yr
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Level 1: Lever cards grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {levers.map((lever) => (
            <LeverCard
              key={lever.key}
              label={lever.label}
              value={lever.resultValue}
              currencySymbol={currencySymbol}
              resultType={lever.resultType}
              monetaryEquivalent={lever.monetaryEquivalent}
              isExpanded={isLeverExpanded(lever.key)}
              onClick={() =>
                dispatch({ type: 'EXPAND_LEVER', module: moduleKey, lever: lever.key })
              }
            />
          ))}
        </div>

        {/* Level 2: Lever detail (when a lever card is clicked) */}
        {expandedLever?.module === moduleKey && (() => {
          const lever = levers.find((l) => l.key === expandedLever.lever);
          if (!lever) return null;

          return (
            <div
              className="mt-4 p-4 rounded-xl animate-fade-in"
              style={{
                background: 'rgba(28,29,36,0.02)',
                border: '1px solid rgba(28,29,36,0.06)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-gray-800">{lever.label}</h4>
                  <p className="text-lg font-bold text-gray-900 tabular-nums mt-0.5">
                    {lever.resultType === 'timeReclaimed'
                      ? <>{Math.round(lever.resultValue).toLocaleString()} hrs</>
                      : <>{currencySymbol}{Math.round(lever.resultValue).toLocaleString()}</>
                    }
                    <span className="text-xs font-medium text-gray-400 ml-1">
                      annual {lever.resultType === 'costSaving' ? 'savings' : lever.resultType === 'revenueUplift' ? 'uplift' : 'time reclaimed'}
                    </span>
                  </p>
                  {lever.resultType === 'timeReclaimed' && lever.monetaryEquivalent && lever.monetaryEquivalent > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">~{currencySymbol}{Math.round(lever.monetaryEquivalent).toLocaleString()}/yr equivalent</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{lever.summary}</p>
                </div>
              </div>

              {/* Customize button */}
              {!isLeverEditing(lever.key) && (
                <button
                  onClick={() => dispatch({ type: 'EDIT_LEVER', module: moduleKey, lever: lever.key })}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                  style={{
                    color: meta.color,
                    background: `${meta.color}10`,
                    border: `1px solid ${meta.color}25`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = `${meta.color}18`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = `${meta.color}10`;
                  }}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  Customize assumptions
                </button>
              )}

              {/* Level 3: Sliders (when "Customize assumptions" is clicked) */}
              {isLeverEditing(lever.key) && (
                <div className="mt-4 space-y-4 animate-fade-in">
                  {lever.sliders.map((slider) => (
                    <Slider
                      key={`${slider.slice}-${slider.field}`}
                      label={slider.label}
                      value={getSliderValue(state, slider.slice, slider.field)}
                      onChange={(v) =>
                        dispatch({
                          type: 'SET_FIELD',
                          slice: slider.slice,
                          field: slider.field,
                          value: v,
                        } as CalculatorAction)
                      }
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      unit={slider.unit}
                      color={slider.color}
                      formatValue={slider.formatValue}
                      tooltip={slider.tooltip}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
