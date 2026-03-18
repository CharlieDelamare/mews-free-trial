'use client';

import { CreditCard } from 'lucide-react';
import CollapsibleSection from '@/components/roi-calculator/ui/CollapsibleSection';
import Slider from '@/components/roi-calculator/ui/Slider';
import ResultCard from '@/components/roi-calculator/ui/ResultCard';
import Explanation from '@/components/roi-calculator/ui/Explanation';
import type { PaymentInputs, PaymentResults, SharedVariables } from '@/lib/roi-calculator/types/calculator';

interface PaymentSectionProps {
  inputs: PaymentInputs;
  onInputChange: <K extends keyof PaymentInputs>(field: K, value: PaymentInputs[K]) => void;
  sharedVariables: SharedVariables;
  onSharedVariableChange: <K extends keyof SharedVariables>(field: K, value: SharedVariables[K]) => void;
  results: PaymentResults;
  currencySymbol: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  headerless?: boolean;
}

export default function PaymentSection({
  inputs,
  onInputChange,
  sharedVariables,
  onSharedVariableChange,
  results,
  currencySymbol,
  isExpanded,
  onToggle,
  headerless = false,
}: PaymentSectionProps) {
  return (
    <CollapsibleSection
      title="Payment Processing"
      icon={<CreditCard className="w-5 h-5 text-green-600" />}
      iconColor="bg-green-50"
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
          <h3 className="text-base font-bold text-gray-900 mb-5">Tokenization</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Current Process</h3>
              <div>
                <Slider
                  label="Transactions per Month"
                  value={sharedVariables.reservationsPerMonth}
                  onChange={(v) => onSharedVariableChange('reservationsPerMonth', v)}
                  min={0}
                  max={1000}
                  step={10}
                  color="purple"
                  tooltip="Total monthly reservations for your property. Derived from occupancy rate and number of rooms. Source: STR/CoStar 2024, CBRE Trends 2024. | Ask: How many reservations do you handle per month on average?"
                />
                <p className="text-xs text-gray-500 mt-1">⚙️ Shared variable - synced across all sections</p>
              </div>
              <Slider
                label="Seconds per Transaction"
                value={inputs.secondsPerTransaction}
                onChange={(v) => onInputChange('secondsPerTransaction', v)}
                min={0}
                max={300}
                step={5}
                color="yellow"
                tooltip="Time spent manually processing each payment transaction. Industry standard: 45-90 seconds across multiple systems. Default: 60s. Source: HFTP, Mews research. | Ask: How long does it take your team to process a single payment transaction end to end?"
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
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--mews-indigo)' }}>With Mews</h3>
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                    <CreditCard className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-gray-700 text-lg font-medium">Automated Payment Processing</p>
                  <p className="text-gray-600 text-sm">Tokenized payments, instant processing</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <ResultCard
              label="Annual Time Saved (Hours)"
              value={results.tokenizationTimeSaved}
              unit="hours"
            />
            <ResultCard
              label="Annual Labor Cost Savings"
              value={`${currencySymbol} ${results.tokenizationCostSavings.toLocaleString()}`}
              large
            />
          </div>

          <Explanation
            title="How This Works"
            description={`Industry standard: Manual payment processing averages 45-90 seconds per transaction across multiple systems, with processing staff wages typically $12-18/hour. Manual payment processing for ${sharedVariables.reservationsPerMonth.toLocaleString()} monthly transactions consumes significant staff time—approximately ${inputs.secondsPerTransaction} seconds per transaction. Mews' payment tokenization securely stores guest payment information, enabling automatic charging for no-shows, damages, and ancillary services without manual card entry. This automation saves ${results.tokenizationTimeSaved} hours annually, worth ${currencySymbol}${results.tokenizationCostSavings.toLocaleString()}, while reducing PCI compliance burden and human error. Mews partners with leading payment gateways and uses advanced encryption to tokenize card data, allowing seamless recurring charges and pre-authorizations. Your staff is freed from tedious payment processing tasks and can focus on guest service excellence.`}
          />
        </div>

        <div className="rounded-xl p-5 md:p-6" style={{ background: 'color-mix(in srgb, var(--mews-night-black) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 7%, transparent)' }}>
          <h3 className="text-base font-bold text-gray-900 mb-5">Chargeback Management</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Current Process</h3>
              <Slider
                label="Current Chargeback Rate"
                value={inputs.chargebackRate}
                onChange={(v) => onInputChange('chargebackRate', v)}
                min={0}
                max={5}
                step={0.05}
                unit="%"
                color="yellow"
                tooltip="Percentage of transactions that result in chargebacks. Industry average: 0.5-1.5%. Default: 0.95%. Source: HFTP, Visa/Mastercard industry reports. | Ask: Do you track your chargeback rate? What percentage of transactions result in disputes?"
              />
              <Slider
                label="Chargeback Volume per Month"
                value={inputs.chargebackVolume}
                onChange={(v) => onInputChange('chargebackVolume', v)}
                min={0}
                max={200}
                step={5}
                color="yellow"
                tooltip="Number of chargeback disputes received monthly. Default: ~1% of total reservations. Source: HFTP, payment processor data. | Ask: How many chargeback disputes do you deal with in a typical month?"
              />
              <Slider
                label="Current Chargeback Cost per Month"
                value={inputs.chargebackCostPerMonth}
                onChange={(v) => onInputChange('chargebackCostPerMonth', v)}
                min={0}
                max={10000}
                step={100}
                unit={currencySymbol}
                color="yellow"
                tooltip="Total monthly cost of chargebacks including fees, labor, and lost revenue. Default: ~1.5% of monthly revenue. Source: HFTP, Mews research. | Ask: What's the total monthly cost of chargebacks for you - including fees, staff time, and lost revenue?"
              />
            </div>
            <div className="space-y-6 p-5 rounded-xl" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--mews-indigo) 7%, transparent) 0%, color-mix(in srgb, var(--mews-night-black) 4%, transparent) 100%)', border: '1px solid color-mix(in srgb, var(--mews-indigo) 15%, transparent)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--mews-indigo)' }}>With Mews</h3>
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Mews Expected Chargeback Rate</p>
                <p className="text-2xl font-bold text-gray-700">{inputs.mewsChargebackRate}%</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <ResultCard
              label="Annual Chargeback Reduction Savings"
              value={`${currencySymbol} ${results.chargebackReduction.toLocaleString()}`}
              large
            />
          </div>

          <Explanation
            title="How This Works"
            description={`With a current chargeback rate of ${inputs.chargebackRate}%, your property faces approximately ${inputs.chargebackVolume} disputes monthly, costing ${currencySymbol}${inputs.chargebackCostPerMonth.toLocaleString()} in fees, labor, and lost revenue. Mews' integrated payment system with comprehensive audit trails, automated pre-authorizations, and clear guest communication reduces chargebacks to an industry-leading ${inputs.mewsChargebackRate}%. This represents annual savings of ${currencySymbol}${results.chargebackReduction.toLocaleString()}. Mews maintains detailed transaction records, automatically captures digital signatures, and provides dispute resolution tools that significantly improve your win rate when chargebacks do occur. The platform's fraud detection algorithms flag suspicious bookings before they become problems.`}
          />
        </div>

        <div className="rounded-xl p-5 md:p-6" style={{ background: 'color-mix(in srgb, var(--mews-night-black) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 7%, transparent)' }}>
          <h3 className="text-base font-bold text-gray-900 mb-5">Payment Reconciliation</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Current Process</h3>
              <Slider
                label="Time Spent Reconciling Daily (Hours)"
                value={inputs.reconciliationTimeDaily}
                onChange={(v) => onInputChange('reconciliationTimeDaily', v)}
                min={0}
                max={8}
                step={0.25}
                color="yellow"
                tooltip="Hours spent daily reconciling payments across channels, gateways, and booking sources. Industry range: 2-5 hrs. Default: 3.5 hrs. Source: HFTP, operator interviews. | Ask: How many hours does your team spend each day on payment reconciliation?"
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
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--mews-indigo)' }}>With Mews</h3>
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                    <CreditCard className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-gray-700 text-lg font-medium">Automated Reconciliation</p>
                  <p className="text-gray-600 text-sm">Real-time matching & reporting</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <ResultCard
              label="Annual Time Saved (Hours)"
              value={results.reconciliationTimeSaved}
              unit="hours"
            />
            <ResultCard
              label="Annual Labor Cost Savings"
              value={`${currencySymbol} ${results.reconciliationCostSavings.toLocaleString()}`}
              large
            />
          </div>

          <Explanation
            title="How This Works"
            description={`Your accounting team currently spends ${inputs.reconciliationTimeDaily} hours daily reconciling payments across multiple channels, payment gateways, and booking sources. Mews automates payment reconciliation with real-time synchronization between your PMS, payment processors, and accounting systems. The platform automatically matches transactions, identifies discrepancies, and generates reconciliation reports—eliminating ${results.reconciliationTimeSaved} hours of manual work annually, valued at ${currencySymbol}${results.reconciliationCostSavings.toLocaleString()}. Mews provides complete payment visibility with drill-down capabilities to transaction details, supporting multi-gateway configurations and automated bank file imports. Your finance team gains accuracy and efficiency while closing books faster.`}
          />
        </div>

        <div className="rounded-xl p-5 md:p-6" style={{ background: 'color-mix(in srgb, var(--mews-night-black) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 7%, transparent)' }}>
          <h3 className="text-base font-bold text-gray-900 mb-5">No-Show Revenue Protection</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Current Process</h3>
              <div>
                <Slider
                  label="Monthly Revenue from Bookings"
                  value={sharedVariables.monthlyRevenue}
                  onChange={(v) => onSharedVariableChange('monthlyRevenue', v)}
                  min={0}
                  max={500000}
                  step={5000}
                  unit={currencySymbol}
                  color="purple"
                  tooltip="Total monthly booking revenue. Calculated from reservations x ADR x occupancy. Source: STR/CoStar 2024, CBRE. | Ask: What's your total monthly revenue from room bookings?"
                />
                <p className="text-xs text-gray-500 mt-1">⚙️ Shared variable - synced across all sections</p>
              </div>
              <Slider
                label="% of Bookings that No-Show"
                value={inputs.noShowRate}
                onChange={(v) => onInputChange('noShowRate', v)}
                min={0}
                max={10}
                step={0.5}
                unit="%"
                color="yellow"
                tooltip="Percentage of bookings where the guest doesn't arrive. Industry range: 2-5% depending on hotel type. Source: STR/CoStar 2024, CBRE. | Ask: What's your no-show rate? What percentage of bookings result in a no-show?"
              />
              <Slider
                label="% of No-Shows without Fee Collection"
                value={inputs.noShowWithoutFee}
                onChange={(v) => onInputChange('noShowWithoutFee', v)}
                min={0}
                max={100}
                step={5}
                unit="%"
                color="yellow"
                tooltip="Proportion of no-shows where cancellation/no-show fee is not collected. Default: 50%. Source: Mews research, HFTP. | Ask: Of your no-shows, what percentage do you actually manage to collect the fee from?"
              />
            </div>
            <div className="space-y-6 p-5 rounded-xl" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--mews-indigo) 7%, transparent) 0%, color-mix(in srgb, var(--mews-night-black) 4%, transparent) 100%)', border: '1px solid color-mix(in srgb, var(--mews-indigo) 15%, transparent)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--mews-indigo)' }}>With Mews</h3>
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                    <CreditCard className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-gray-700 text-lg font-medium">Automatic Fee Collection</p>
                  <p className="text-gray-600 text-sm">100% no-show fee capture</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <ResultCard
              label="Annual Revenue Protection"
              value={`${currencySymbol} ${results.noShowRevenue.toLocaleString()}`}
              large
            />
          </div>

          <Explanation
            title="How This Works"
            description={`With ${currencySymbol}${sharedVariables.monthlyRevenue.toLocaleString()} in monthly booking revenue and a ${inputs.noShowRate}% no-show rate, your property loses significant revenue when ${inputs.noShowWithoutFee}% of no-shows result in uncollected fees. Mews' automated payment tokenization and policy enforcement ensures you capture no-show fees automatically—protecting ${currencySymbol}${results.noShowRevenue.toLocaleString()} in annual revenue. The system stores tokenized payment methods securely, applies cancellation policies consistently, and processes no-show charges without staff intervention. Clear communication of policies during booking and automated reminders reduce disputes while maximizing revenue recovery. This isn't new revenue—it's revenue you're already entitled to but currently leaving on the table.`}
          />
        </div>

        <div className="rounded-xl p-5 md:p-6" style={{ background: 'color-mix(in srgb, var(--mews-night-black) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 7%, transparent)' }}>
          <h3 className="text-base font-bold text-gray-900 mb-5">Multi-Currency Support</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Current Process</h3>
              <div>
                <Slider
                  label="Monthly Revenue"
                  value={sharedVariables.monthlyRevenue}
                  onChange={(v) => onSharedVariableChange('monthlyRevenue', v)}
                  min={0}
                  max={500000}
                  step={5000}
                  unit={currencySymbol}
                  color="purple"
                  tooltip="Total monthly booking revenue. Calculated from reservations x ADR x occupancy. Source: STR/CoStar 2024, CBRE. | Ask: What's your total monthly revenue from room bookings?"
                />
                <p className="text-xs text-gray-500 mt-1">⚙️ Shared variable - synced across all sections</p>
              </div>
              <Slider
                label="% Monthly Revenue from Foreign Currency"
                value={inputs.foreignCurrencyPercent}
                onChange={(v) => onInputChange('foreignCurrencyPercent', v)}
                min={0}
                max={100}
                step={5}
                unit="%"
                color="yellow"
                tooltip="Share of revenue from international guests paying in foreign currencies. Major cities: 25-45%, tourist destinations: 40-70%. Source: HFTP, Mews research. | Ask: What share of your guests are international travelers? Do they ask about paying in their own currency?"
              />
            </div>
            <div className="space-y-6 p-5 rounded-xl" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--mews-indigo) 7%, transparent) 0%, color-mix(in srgb, var(--mews-night-black) 4%, transparent) 100%)', border: '1px solid color-mix(in srgb, var(--mews-indigo) 15%, transparent)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--mews-indigo)' }}>Mews Impact</h3>
              <Slider
                label="Multi-Currency Adoption Rate"
                value={inputs.multiCurrencyAdoption}
                onChange={(v) => onInputChange('multiCurrencyAdoption', v)}
                min={0}
                max={100}
                step={5}
                unit="%"
                color="pink"
                tooltip="Mews supports 40+ currencies with transparent rates. Guests pay in their preferred currency while you retain a portion of conversion fees as additional revenue. Default: 35%. Source: Mews internal benchmark."
              />
              <Slider
                label="Revenue Share Increase (%)"
                value={inputs.revenueShare}
                onChange={(v) => onInputChange('revenueShare', v)}
                min={0}
                max={5}
                step={0.1}
                unit="%"
                color="pink"
                tooltip="Mews multi-currency pricing removes conversion friction and builds trust with international guests. Transparent rates increase booking confidence and completion. Default: 1%. Source: Mews research."
              />
            </div>
          </div>

          <div className="mb-6">
            <ResultCard
              label="Estimated Annual Revenue Impact"
              value={`${currencySymbol} ${results.multiCurrencyRevenue.toLocaleString()}`}
              large
            />
          </div>

          <Explanation
            title="How This Works"
            description={`Industry data: Properties in major cities receive 25-45% of revenue from international guests; tourist destinations see 40-70%. With ${inputs.foreignCurrencyPercent}% of your ${currencySymbol}${sharedVariables.monthlyRevenue.toLocaleString()} monthly revenue coming from international guests, offering native currency pricing removes conversion friction and increases booking conversion by ${inputs.multiCurrencyAdoption}%. Mews' multi-currency support displays prices in guests' local currencies with real-time exchange rates, eliminating confusion and building trust. This capability drives an estimated ${inputs.revenueShare}% revenue increase—${currencySymbol}${results.multiCurrencyRevenue.toLocaleString()} annually. The system handles currency conversion, displays transparent pricing, and settles in your preferred currency while guests see familiar denominations. International travelers are more likely to complete bookings when they can pay in their home currency, particularly for higher-value room types and packages.`}
          />
        </div>

        <div className="mt-6">
          <ResultCard
            label="Total Annual Payment Optimization"
            value={`${currencySymbol} ${results.totalSavings.toLocaleString()}`}
            large
          />
        </div>
      </div>
    </CollapsibleSection>
  );
}
