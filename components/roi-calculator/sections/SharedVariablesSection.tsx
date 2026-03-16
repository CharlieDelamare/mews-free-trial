'use client';

import { Settings, ArrowRight } from 'lucide-react';
import CollapsibleSection from '@/components/roi-calculator/ui/CollapsibleSection';
import Slider from '@/components/roi-calculator/ui/Slider';
import type { SharedVariables } from '@/lib/roi-calculator/types/calculator';

interface SharedVariablesSectionProps {
  isExpanded?: boolean;
  onToggle?: () => void;
  inputs: SharedVariables;
  onInputChange: <K extends keyof SharedVariables>(field: K, value: SharedVariables[K]) => void;
  currencySymbol: string;
}

export default function SharedVariablesSection({
  isExpanded,
  onToggle,
  inputs,
  onInputChange,
  currencySymbol,
}: SharedVariablesSectionProps) {
  const {
    numberOfRooms,
    averageDailyRate,
    occupancyRate,
    avgLengthOfStay,
    reservationsPerMonth,
    monthlyRevenue,
    staffHourlyWage,
  } = inputs;

  return (
    <CollapsibleSection
      title="Shared Variables"
      icon={<Settings className="w-5 h-5 text-purple-600" />}
      iconColor="bg-purple-50"
      summaryMetrics={[
        { label: 'Rooms', value: numberOfRooms.toLocaleString() },
        { label: 'Occupancy', value: `${occupancyRate}%` },
        { label: 'Reservations/mo', value: reservationsPerMonth.toLocaleString() },
      ]}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="space-y-6">

        {/* Primary inputs */}
        <div className="rounded-xl p-5 md:p-6" style={{ background: 'rgba(147,51,234,0.04)', border: '1px solid rgba(147,51,234,0.12)' }}>
          <h3 className="text-base font-bold text-gray-900 mb-1">Property Metrics</h3>
          <p className="text-sm text-gray-500 mb-5">
            These four values drive all calculations. Reservations and revenue are auto-derived from them.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <Slider
                  label="Number of Rooms"
                  value={numberOfRooms}
                  onChange={(v) => onInputChange('numberOfRooms', v)}
                  min={1} max={500} step={1}
                  color="purple"
                />
                <p className="text-xs text-gray-500 mt-1">Used in: Revenue Management, all derived calculations</p>
              </div>

              <div>
                <Slider
                  label="Average Daily Rate (ADR)"
                  value={averageDailyRate}
                  onChange={(v) => onInputChange('averageDailyRate', v)}
                  min={0} max={1000} step={5}
                  unit={currencySymbol}
                  color="purple"
                />
                <p className="text-xs text-gray-500 mt-1">Used in: Guest Experience, Revenue Management, derived monthly revenue</p>
              </div>

              <div>
                <Slider
                  label="Staff Hourly Wage"
                  value={staffHourlyWage}
                  onChange={(v) => onInputChange('staffHourlyWage', v)}
                  min={0} max={100} step={0.5}
                  unit={currencySymbol}
                  color="purple"
                />
                <p className="text-xs text-gray-500 mt-1">Used in: All sections (check-in, payment, RMS)</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Slider
                  label="Occupancy Rate"
                  value={occupancyRate}
                  onChange={(v) => onInputChange('occupancyRate', v)}
                  min={1} max={100} step={1}
                  unit="%"
                  color="purple"
                />
                <p className="text-xs text-gray-500 mt-1">Used in: Derived reservations and monthly revenue</p>
              </div>

              <div>
                <Slider
                  label="Avg Length of Stay"
                  value={avgLengthOfStay}
                  onChange={(v) => onInputChange('avgLengthOfStay', v)}
                  min={0.5} max={14} step={0.1}
                  unit="nights"
                  color="purple"
                />
                <p className="text-xs text-gray-500 mt-1">Used in: Derived reservations per month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Derived metrics */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(28,29,36,0.03)', border: '1px solid rgba(28,29,36,0.09)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ background: 'var(--mews-indigo)' }} />
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Auto-Derived Values</h4>
            <span className="text-xs text-gray-400 ml-1">— recalculate whenever you change the inputs above</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Reservations */}
            <div className="rounded-xl p-4" style={{ background: 'white', border: '1px solid rgba(28,29,36,0.10)' }}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Reservations / Month</p>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{reservationsPerMonth.toLocaleString()}</p>
              <div
                className="flex items-center gap-1.5 mt-3 text-xs rounded-lg px-3 py-2 flex-wrap"
                style={{ background: 'rgba(28,29,36,0.04)', color: 'var(--roi-gray-500)' }}
              >
                <span className="font-semibold text-gray-700">{numberOfRooms}</span>
                <span>rooms</span>
                <ArrowRight className="w-3 h-3 flex-shrink-0" />
                <span className="font-semibold text-gray-700">×{occupancyRate}%</span>
                <span>occ</span>
                <ArrowRight className="w-3 h-3 flex-shrink-0" />
                <span className="font-semibold text-gray-700">×30d</span>
                <ArrowRight className="w-3 h-3 flex-shrink-0" />
                <span className="font-semibold text-gray-700">÷{avgLengthOfStay}n</span>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--mews-indigo)' }}>
                = {numberOfRooms} × 30 × {occupancyRate}% ÷ {avgLengthOfStay} nights
              </p>
            </div>

            {/* Monthly Revenue */}
            <div className="rounded-xl p-4" style={{ background: 'white', border: '1px solid rgba(28,29,36,0.10)' }}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Monthly Room Revenue</p>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {currencySymbol}{monthlyRevenue.toLocaleString()}
              </p>
              <div
                className="flex items-center gap-1.5 mt-3 text-xs rounded-lg px-3 py-2 flex-wrap"
                style={{ background: 'rgba(28,29,36,0.04)', color: 'var(--roi-gray-500)' }}
              >
                <span className="font-semibold text-gray-700">{numberOfRooms}</span>
                <span>rooms</span>
                <ArrowRight className="w-3 h-3 flex-shrink-0" />
                <span className="font-semibold text-gray-700">{currencySymbol}{averageDailyRate}</span>
                <span>ADR</span>
                <ArrowRight className="w-3 h-3 flex-shrink-0" />
                <span className="font-semibold text-gray-700">×30d</span>
                <ArrowRight className="w-3 h-3 flex-shrink-0" />
                <span className="font-semibold text-gray-700">×{occupancyRate}%</span>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--mews-indigo)' }}>
                = {numberOfRooms} × {currencySymbol}{averageDailyRate} × 30 × {occupancyRate}%
              </p>
            </div>

          </div>
        </div>

        {/* Info note */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(28,29,36,0.03)', border: '1px solid rgba(28,29,36,0.07)' }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(179,178,251,0.12)' }}>
              <svg className="w-4 h-4" style={{ color: 'var(--mews-indigo)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">How the linked model works</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                Changing <strong>Rooms</strong>, <strong>ADR</strong>, <strong>Occupancy</strong>, or <strong>Avg Stay</strong> instantly recalculates Reservations/month and Monthly Revenue.
                These derived values feed directly into all ROI sections — Guest Experience, Payment, and Revenue Management.
              </p>
            </div>
          </div>
        </div>

      </div>
    </CollapsibleSection>
  );
}
