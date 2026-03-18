'use client';

import { TrendingUp, Info } from 'lucide-react';
import CollapsibleSection from '@/components/roi-calculator/ui/CollapsibleSection';
import Slider from '@/components/roi-calculator/ui/Slider';
import ResultCard from '@/components/roi-calculator/ui/ResultCard';
import Explanation from '@/components/roi-calculator/ui/Explanation';
import type { RMSInputs, RMSResults, SharedVariables } from '@/lib/roi-calculator/types/calculator';

interface RMSSectionProps {
  inputs: RMSInputs;
  onInputChange: <K extends keyof RMSInputs>(field: K, value: RMSInputs[K]) => void;
  sharedVariables: SharedVariables;
  onSharedVariableChange: <K extends keyof SharedVariables>(field: K, value: SharedVariables[K]) => void;
  hotelType: string;
  onHotelTypeChange: (value: string) => void;
  results: RMSResults;
  currencySymbol: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  headerless?: boolean;
}

export default function RMSSection({
  inputs,
  onInputChange,
  sharedVariables,
  onSharedVariableChange,
  hotelType,
  onHotelTypeChange,
  results,
  currencySymbol,
  isExpanded,
  onToggle,
  headerless = false,
}: RMSSectionProps) {
  const hotelTypes = [
    'Boutique Hotel',
    'City Hotel',
    'Conference Hotel',
    'Serviced Apartment',
    'Short-Term Rental',
  ];

  const updateFrequencies = ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly'];

  return (
    <CollapsibleSection
      title="Mews RMS"
      icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
      iconColor="bg-purple-50"
      summaryMetrics={[
        { label: 'Time Saved', value: `${results.totalTime.toLocaleString()} hrs` },
        { label: 'Annual Savings', value: `${currencySymbol} ${results.totalSavings.toLocaleString()}` },
      ]}
      isExpanded={isExpanded}
      onToggle={onToggle}
      headerless={headerless}
    >
      <div className="space-y-8">
        <div className="rounded-xl p-5 md:p-6" style={{ background: 'color-mix(in srgb, var(--mews-night-black) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 7%, transparent)' }}>
          <h3 className="text-base font-bold text-gray-900 mb-5">Rate Update Automation</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Your Property</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Do you already have an RMS?</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => onInputChange('hasExistingRMS', true)}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                      inputs.hasExistingRMS
                        ? 'bg-yellow-100 border-2 border-yellow-300 text-gray-900'
                        : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => onInputChange('hasExistingRMS', false)}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                      !inputs.hasExistingRMS
                        ? 'bg-yellow-100 border-2 border-yellow-300 text-gray-900'
                        : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    No
                  </button>
                </div>
                {inputs.hasExistingRMS && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-lg" style={{ background: 'color-mix(in srgb, var(--roi-module-gx) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--roi-module-gx) 20%, transparent)' }}>
                    <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-purple-800">
                      Since you already have an RMS, the incremental uplift from switching to Mews RMS is estimated at ~2% rather than the full uplift for a property without one. Time savings from rate automation are also excluded since your current RMS already handles this.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Type</label>
                <select
                  value={hotelType}
                  onChange={(e) => onHotelTypeChange(e.target.value)}
                  className="w-full px-4 py-3 bg-yellow-100 border-2 border-yellow-300 rounded-lg text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  {hotelTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dedicated Revenue Manager</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => onInputChange('hasRevenueManager', true)}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                      inputs.hasRevenueManager
                        ? 'bg-yellow-100 border-2 border-yellow-300 text-gray-900'
                        : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => onInputChange('hasRevenueManager', false)}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                      !inputs.hasRevenueManager
                        ? 'bg-yellow-100 border-2 border-yellow-300 text-gray-900'
                        : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <Slider
                label="Hotel RevPAR"
                value={inputs.hotelRevPAR}
                onChange={(v) => onInputChange('hotelRevPAR', v)}
                min={0}
                max={300}
                step={5}
                unit={currencySymbol}
                color="yellow"
                tooltip="Revenue Per Available Room. Calculated as ADR x occupancy rate. Auto-set based on country and hotel type. Source: STR/CoStar 2024, CBRE, HVS. | Ask: What's your current RevPAR? Do you know your ADR and occupancy rate?"
              />

              <div>
                <Slider
                  label="Number of Rooms"
                  value={sharedVariables.numberOfRooms}
                  onChange={(v) => onSharedVariableChange('numberOfRooms', v)}
                  min={1}
                  max={200}
                  step={1}
                  color="purple"
                  tooltip="Total rooms in your property. Default: 50 base x hotel-type size multiplier (Boutique 0.3x, City 1.0x, Conference 1.6x). Source: STR/CoStar 2024. | Ask: How many rooms does your property have?"
                />
                <p className="text-xs text-gray-500 mt-1">⚙️ Shared variable - synced across all sections</p>
              </div>
            </div>

            <div className="space-y-6 p-5 rounded-xl" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--mews-indigo) 7%, transparent) 0%, color-mix(in srgb, var(--mews-night-black) 4%, transparent) 100%)', border: '1px solid color-mix(in srgb, var(--mews-indigo) 15%, transparent)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--mews-indigo)' }}>Mews RMS Impact</h3>

              <div className="rounded-xl p-4" style={{ background: 'color-mix(in srgb, var(--mews-white) 80%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)' }}>
                <p className="text-sm text-gray-600 mb-2">Estimated Revenue Uplift</p>
                <p className="text-2xl font-bold text-gray-900">{results.estimatedRevenueUplift.toFixed(2)}%</p>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'color-mix(in srgb, var(--mews-white) 80%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)' }}>
                <p className="text-sm text-gray-600 mb-2">RevPAR Uplift</p>
                <p className="text-2xl font-bold text-gray-900">{currencySymbol} {results.revPARUplift.toFixed(2)}</p>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'color-mix(in srgb, var(--mews-white) 80%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)' }}>
                <p className="text-sm text-gray-600 mb-2">New Hotel RevPAR</p>
                <p className="text-2xl font-bold text-gray-900">{currencySymbol} {results.newHotelRevPAR.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <ResultCard
              label="Annual Revenue Gain"
              value={`${currencySymbol} ${results.annualRevenueGain.toLocaleString()}`}
              large
            />
          </div>

          <Explanation
            title="How This Works"
            description={`Your ${hotelType.toLowerCase()} with ${sharedVariables.numberOfRooms} rooms operates at ${currencySymbol}${inputs.hotelRevPAR} RevPAR. ${
              inputs.hasRevenueManager
                ? 'With an existing revenue manager, Mews RMS augments their expertise with AI-powered automation'
                : 'Without a dedicated revenue manager, Mews RMS provides enterprise-level revenue optimization'
            }, typically delivering ${results.estimatedRevenueUplift.toFixed(1)}% revenue uplift for your property type. This increases your RevPAR by ${currencySymbol}${results.revPARUplift.toFixed(
              2
            )} to ${currencySymbol}${results.newHotelRevPAR.toFixed(
              2
            )}. Through intelligent dynamic pricing that responds to demand patterns, competitor rates, and booking velocity, Mews RMS generates ${currencySymbol}${results.annualRevenueGain.toLocaleString()} in additional annual revenue. The system continuously optimizes pricing 24/7, capturing revenue opportunities that manual management would miss.`}
          />
        </div>

        <div className="rounded-xl p-5 md:p-6" style={{ background: 'color-mix(in srgb, var(--mews-night-black) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 7%, transparent)' }}>
          <h3 className="text-base font-bold text-gray-900 mb-5">Operational Impact</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Your Current Process</h3>

              <Slider
                label="# of Rate Plans"
                value={inputs.numberOfRatePlans}
                onChange={(v) => onInputChange('numberOfRatePlans', v)}
                min={1}
                max={20}
                step={1}
                color="yellow"
                tooltip="Number of distinct rate plans managed (BAR, corporate, group, packages, etc). Industry range: 3-8. Source: HFTP, operator interviews. | Ask: How many rate plans do you currently manage - BAR, corporate, group, packages?"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency of Rate Updates</label>
                <select
                  value={inputs.rateUpdateFrequency}
                  onChange={(e) => onInputChange('rateUpdateFrequency', e.target.value)}
                  className="w-full px-4 py-3 bg-yellow-100 border-2 border-yellow-300 rounded-lg text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  {updateFrequencies.map((freq) => (
                    <option key={freq} value={freq}>
                      {freq}
                    </option>
                  ))}
                </select>
              </div>

              <Slider
                label="# Distribution Channels (OTAs, Tour, etc)"
                value={inputs.numberOfChannels}
                onChange={(v) => onInputChange('numberOfChannels', v)}
                min={1}
                max={15}
                step={1}
                color="yellow"
                tooltip="Number of distribution channels (Booking.com, Expedia, direct, GDS, tour operators, etc). Industry range: 4-12. Source: HFTP, Phocuswright. | Ask: How many distribution channels are you selling through - OTAs, GDS, tour operators, direct?"
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
                  tooltip="Average hourly cost of front-desk/hospitality staff in your country. Auto-set based on country selection. Source: BLS, ERI SalaryExpert, Eurostat. | Ask: What's the average hourly rate for your front-desk or hospitality staff?"
                />
                <p className="text-xs text-gray-500 mt-1">⚙️ Shared variable - synced across all sections</p>
              </div>
            </div>

            <div className="space-y-6 p-5 rounded-xl" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--mews-indigo) 7%, transparent) 0%, color-mix(in srgb, var(--mews-night-black) 4%, transparent) 100%)', border: '1px solid color-mix(in srgb, var(--mews-indigo) 15%, transparent)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--mews-indigo)' }}>With Mews RMS</h3>

              <div className="rounded-xl p-4" style={{ background: 'color-mix(in srgb, var(--mews-white) 80%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)' }}>
                <p className="text-sm text-gray-600 mb-2">Avg. Updates per Week</p>
                <p className="text-2xl font-bold text-gray-900">{results.avgUpdatesPerWeek.toFixed(2)}</p>
              </div>

              <Slider
                label="Avg. Time to Update Rate (min)"
                value={inputs.avgTimeToUpdateRate}
                onChange={(v) => onInputChange('avgTimeToUpdateRate', v)}
                min={1}
                max={15}
                step={0.5}
                color="pink"
                tooltip="Mews RMS uses AI to automate rate management - set your rates and let the technology do the rest. Eliminates repetitive manual updates across all channels with dynamic product pricing. Default: 5 min. Source: HFTP, operator interviews."
              />

              <div className="flex items-center justify-center h-32">
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 mx-auto bg-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-gray-700 text-base font-medium">Fully Automated</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <ResultCard
              label="Annual Hours Saved"
              value={results.annualHoursSaved}
              unit="hours"
            />
            <ResultCard
              label="Annual Labor Cost Savings"
              value={`${currencySymbol} ${results.annualLaborCostSavings.toLocaleString()}`}
              large
            />
          </div>

          <Explanation
            title="How This Works"
            description={`Industry benchmark: Properties typically manage 3-8 rate plans across 4-12 channels, with manual updates taking 3-8 minutes per channel per rate plan. Managing ${inputs.numberOfRatePlans} rate plans across ${inputs.numberOfChannels} distribution channels with ${inputs.rateUpdateFrequency.toLowerCase()} updates requires significant manual effort. Each rate update takes approximately ${inputs.avgTimeToUpdateRate} minutes when done manually across all channels and rate plans. With ${results.avgUpdatesPerWeek.toFixed(
              1
            )} updates per week, your team spends ${results.annualHoursSaved.toFixed(
              0
            )} hours annually on rate management—worth ${currencySymbol}${results.annualLaborCostSavings.toLocaleString()} at ${currencySymbol}${sharedVariables.staffHourlyWage}/hour. Mews RMS eliminates this tedious work through full automation, updating rates across all channels instantly based on AI-powered optimization. Your team is freed from repetitive spreadsheet work and can focus on strategic initiatives, guest service, and revenue-generating activities.`}
          />
        </div>

        <div className="mt-6">
          <ResultCard
            label="Total Annual RMS Impact"
            value={`${currencySymbol} ${results.totalSavings.toLocaleString()}`}
            large
          />
        </div>
      </div>
    </CollapsibleSection>
  );
}
