'use client';

import { BedDouble } from 'lucide-react';
import CollapsibleSection from '@/components/roi-calculator/ui/CollapsibleSection';
import Slider from '@/components/roi-calculator/ui/Slider';
import ResultCard from '@/components/roi-calculator/ui/ResultCard';
import Explanation from '@/components/roi-calculator/ui/Explanation';
import type { HousekeepingInputs, HousekeepingResults, SharedVariables } from '@/lib/roi-calculator/types/calculator';

interface HousekeepingSectionProps {
  inputs: HousekeepingInputs;
  onInputChange: <K extends keyof HousekeepingInputs>(field: K, value: HousekeepingInputs[K]) => void;
  sharedVariables: SharedVariables;
  onSharedVariableChange: <K extends keyof SharedVariables>(field: K, value: SharedVariables[K]) => void;
  hotelType: string;
  results: HousekeepingResults;
  currencySymbol: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  headerless?: boolean;
}

const ROOM_ASSIGNMENT_METHODS = [
  { value: 'manual', label: 'Manual' },
  { value: 'partially_digital', label: 'Partially digital' },
  { value: 'fully_digital', label: 'Fully digital' },
] as const;

export default function HousekeepingSection({
  inputs,
  onInputChange,
  sharedVariables,
  onSharedVariableChange,
  hotelType,
  results,
  currencySymbol,
  isExpanded,
  onToggle,
  headerless = false,
}: HousekeepingSectionProps) {
  const isSTR = hotelType === 'Short-Term Rental';

  return (
    <CollapsibleSection
      title="Mews Housekeeping"
      icon={<BedDouble className="w-5 h-5 text-amber-600" />}
      iconColor="bg-amber-50"
      summaryMetrics={[
        { label: 'Time Saved', value: `${results.totalTime.toLocaleString()} hrs` },
        { label: 'Annual Savings', value: `${currencySymbol} ${results.totalSavings.toLocaleString()}` },
      ]}
      isExpanded={isExpanded}
      onToggle={onToggle}
      headerless={headerless}
    >
      <div className="space-y-8">

        {/* ── Room Assignment & Staffing ── */}
        <div className="rounded-xl p-5 md:p-6" style={{ background: 'color-mix(in srgb, var(--mews-night-black) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 7%, transparent)' }}>
          <h3 className="text-base font-bold text-gray-900 mb-5">Room Assignment &amp; Staffing</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Your Property</h3>

              {/* HK staff on duty */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">HK Staff on Duty (per day)</label>
                  {inputs.hkStaffOnDutyIsManual && (
                    <button
                      onClick={() => onInputChange('hkStaffOnDutyIsManual', false)}
                      className="text-xs text-amber-600 underline hover:text-amber-800"
                    >
                      Reset to auto
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  value={inputs.hkStaffOnDuty}
                  onChange={(e) => onInputChange('hkStaffOnDuty', Number(e.target.value))}
                  min={1}
                  max={200}
                  className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-200 rounded-lg text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {!inputs.hkStaffOnDutyIsManual && (
                  <p className="text-xs text-gray-500 mt-1">⚙️ Auto-calculated from rooms, occupancy &amp; clean times</p>
                )}
              </div>

              {/* Room assignment method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Assignment Method</label>
                <div className="flex gap-2">
                  {ROOM_ASSIGNMENT_METHODS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => onInputChange('roomAssignmentMethod', value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        inputs.roomAssignmentMethod === value
                          ? 'bg-amber-100 border-2 border-amber-300 text-gray-900'
                          : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Uses housekeeping software */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Uses Housekeeping Software?</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => onInputChange('usesHousekeepingSoftware', true)}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                      inputs.usesHousekeepingSoftware
                        ? 'bg-amber-100 border-2 border-amber-300 text-gray-900'
                        : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => onInputChange('usesHousekeepingSoftware', false)}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                      !inputs.usesHousekeepingSoftware
                        ? 'bg-amber-100 border-2 border-amber-300 text-gray-900'
                        : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    No
                  </button>
                </div>
                {inputs.usesHousekeepingSoftware && (
                  <p className="text-xs text-amber-700 mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                    Since you already use housekeeping software, the incremental gains from Mews are reduced by 30–70% depending on the lever.
                  </p>
                )}
              </div>

              {/* Departure clean time */}
              <Slider
                label="Departure Clean Time (min)"
                value={inputs.departureCleanTime}
                onChange={(v) => onInputChange('departureCleanTime', v)}
                min={15}
                max={120}
                step={5}
                unit="min"
                color="orange"
                tooltip="Minutes to clean a room after a guest departs. Varies by hotel type: STR ~60 min, Serviced Apartment ~50 min, Boutique ~35 min, City Hotel ~30 min."
              />

              {/* Stayover clean time */}
              {isSTR ? (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-500">Stayover service: <strong>N/A for Short-Term Rentals</strong></p>
                </div>
              ) : (
                <Slider
                  label="Stayover Clean Time (min)"
                  value={inputs.stayoverCleanTime}
                  onChange={(v) => onInputChange('stayoverCleanTime', v)}
                  min={0}
                  max={60}
                  step={5}
                  unit="min"
                  color="orange"
                  tooltip="Minutes for a mid-stay room service. Set to 0 if you don't offer stayover service."
                />
              )}
            </div>

            <div className="space-y-4 p-5 rounded-xl" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, #f59e0b 7%, transparent) 0%, color-mix(in srgb, var(--mews-night-black) 4%, transparent) 100%)', border: '1px solid color-mix(in srgb, #f59e0b 20%, transparent)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700">Mews Automation Impact</h3>

              <div className="rounded-xl p-4" style={{ background: 'color-mix(in srgb, var(--mews-white) 80%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)' }}>
                <p className="text-sm text-gray-600 mb-1">Room Assignment Hours Saved</p>
                <p className="text-2xl font-bold text-gray-900">{results.roomAssignmentHours.toLocaleString()} hrs/yr</p>
              </div>

              {!isSTR && (
                <div className="rounded-xl p-4" style={{ background: 'color-mix(in srgb, var(--mews-white) 80%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)' }}>
                  <p className="text-sm text-gray-600 mb-1">Cleaning Status Hours Saved</p>
                  <p className="text-2xl font-bold text-gray-900">{results.cleaningStatusHours.toLocaleString()} hrs/yr</p>
                </div>
              )}

              <div className="rounded-xl p-4" style={{ background: 'color-mix(in srgb, var(--mews-white) 80%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)' }}>
                <p className="text-sm text-gray-600 mb-1">Maintenance &amp; Task Mgmt Hours</p>
                <p className="text-2xl font-bold text-gray-900">{(results.maintenanceCommHours + results.taskMgmtHours).toLocaleString()} hrs/yr</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <ResultCard
              label="Room Assignment Hours Saved"
              value={results.roomAssignmentHours}
              unit="hours"
            />
            <ResultCard
              label="Room Assignment Labor Savings"
              value={`${currencySymbol} ${results.roomAssignmentCost.toLocaleString()}`}
            />
          </div>

          {!isSTR && (
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <ResultCard
                label="Cleaning Status Hours Saved"
                value={results.cleaningStatusHours}
                unit="hours"
              />
              <ResultCard
                label="Maintenance Comm. Hours Saved"
                value={results.maintenanceCommHours}
                unit="hours"
              />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <ResultCard
              label="Task Management Hours Saved"
              value={results.taskMgmtHours}
              unit="hours"
            />
            <ResultCard
              label="Total Operations Labor Savings"
              value={`${currencySymbol} ${(results.roomAssignmentCost + results.cleaningStatusCost + results.maintenanceCommCost + results.taskMgmtCost).toLocaleString()}`}
              large
            />
          </div>

          <Explanation
            title="How This Works"
            description={`With ${inputs.hkStaffOnDuty} housekeeping staff on duty daily, Mews automates room assignment (eliminating ${inputs.roomAssignmentTimeManual.toFixed(1)} min/room of manual briefing work), digitises cleaning status updates in real time, and streamlines maintenance communication and task coordination. ${inputs.usesHousekeepingSoftware ? 'Since you already use housekeeping software, incremental savings reflect the uplift from Mews\'s tighter PMS integration.' : 'The full time savings are based on transitioning from manual processes to Mews.'}`}
          />
        </div>

        {/* ── Cost Reduction ── */}
        <div className="rounded-xl p-5 md:p-6" style={{ background: 'color-mix(in srgb, var(--mews-night-black) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 7%, transparent)' }}>
          <h3 className="text-base font-bold text-gray-900 mb-5">Cost Reduction</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Your Costs</h3>

              <Slider
                label={`Amenity Cost per Room Night (${currencySymbol})`}
                value={inputs.amenityCostPerRoomNight}
                onChange={(v) => onInputChange('amenityCostPerRoomNight', v)}
                min={0.10}
                max={25}
                step={0.10}
                unit={currencySymbol}
                color="orange"
                tooltip="Average spend on in-room amenities (toiletries, minibar restocking, coffee capsules, etc.) per occupied room night. Boutique Hotels typically spend €2-5, City Hotels €0.5-2."
              />

              <div>
                <Slider
                  label="Staff Hourly Wage"
                  value={sharedVariables.staffHourlyWage}
                  onChange={(v) => onSharedVariableChange('staffHourlyWage', v)}
                  min={0}
                  max={50}
                  step={0.5}
                  unit={currencySymbol}
                  color="purple"
                  tooltip="Average hourly cost of housekeeping staff. Auto-set from country benchmarks. Housekeeping is applied at 85% of this rate."
                />
                <p className="text-xs text-gray-500 mt-1">⚙️ Shared variable — synced across all sections</p>
              </div>
            </div>

            <div className="space-y-4 p-5 rounded-xl" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, #f59e0b 7%, transparent) 0%, color-mix(in srgb, var(--mews-night-black) 4%, transparent) 100%)', border: '1px solid color-mix(in srgb, #f59e0b 20%, transparent)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700">With Mews</h3>

              <div className="rounded-xl p-4" style={{ background: 'color-mix(in srgb, var(--mews-white) 80%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)' }}>
                <p className="text-sm text-gray-600 mb-1">Amenity Cost Saved</p>
                <p className="text-2xl font-bold text-gray-900">{currencySymbol} {results.amenitiesCostSaved.toLocaleString()}/yr</p>
                <p className="text-xs text-gray-500 mt-1">~{(inputs.amenityReductionPct * 100).toFixed(0)}% reduction through smart replenishment</p>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'color-mix(in srgb, var(--mews-white) 80%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)' }}>
                <p className="text-sm text-gray-600 mb-1">🌿 Paper Elimination Savings</p>
                <p className="text-2xl font-bold text-gray-900">{currencySymbol} {results.paperCostSaved.toLocaleString()}/yr</p>
                <p className="text-xs text-gray-500 mt-1">Going fully digital across every shift</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <ResultCard
              label="Amenities Cost Saved"
              value={`${currencySymbol} ${results.amenitiesCostSaved.toLocaleString()}`}
            />
            <ResultCard
              label="🌿 Paper Elimination Savings"
              value={`${currencySymbol} ${results.paperCostSaved.toLocaleString()}`}
            />
          </div>

          <Explanation
            title="How This Works"
            description={`Smart amenity management through Mews reduces unnecessary replenishment by approximately ${(inputs.amenityReductionPct * 100).toFixed(0)}% — saving ${currencySymbol}${results.amenitiesCostSaved.toLocaleString()} per year. Going fully digital eliminates paper-based housekeeping sheets, run reports, and task lists across every shift — better for your team and the environment.`}
          />
        </div>

        {/* ── Total ── */}
        <div className="mt-6">
          <ResultCard
            label="Total Annual Housekeeping Impact"
            value={`${currencySymbol} ${results.totalSavings.toLocaleString()}`}
            large
          />
        </div>
      </div>
    </CollapsibleSection>
  );
}
