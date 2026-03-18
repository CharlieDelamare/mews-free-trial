'use client';

import { Users } from 'lucide-react';
import CollapsibleSection from '@/components/roi-calculator/ui/CollapsibleSection';
import Slider from '@/components/roi-calculator/ui/Slider';
import ResultCard from '@/components/roi-calculator/ui/ResultCard';
import Explanation from '@/components/roi-calculator/ui/Explanation';
import { formatMinutes } from '@/lib/roi-calculator/utils/timeFormat';
import type { GuestExperienceInputs, GuestExperienceResults, SharedVariables } from '@/lib/roi-calculator/types/calculator';

interface GuestExperienceSectionProps {
  isExpanded?: boolean;
  onToggle?: () => void;
  inputs: GuestExperienceInputs;
  onInputChange: <K extends keyof GuestExperienceInputs>(field: K, value: GuestExperienceInputs[K]) => void;
  sharedVariables: SharedVariables;
  onSharedVariableChange: <K extends keyof SharedVariables>(field: K, value: SharedVariables[K]) => void;
  results: GuestExperienceResults;
  currencySymbol: string;
  headerless?: boolean;
}

export default function GuestExperienceSection({
  isExpanded,
  onToggle,
  inputs,
  onInputChange,
  sharedVariables,
  onSharedVariableChange,
  results,
  currencySymbol,
  headerless = false,
}: GuestExperienceSectionProps) {
  const {
    checkInTime, checkOutTime,
    mewsCheckInTime, mewsCheckOutTime, roomAssignmentTime,
    onlineCheckInPercentage, revenueUplift, directBookingIncrease, averageCommission,
  } = inputs;
  const { reservationsPerMonth, staffHourlyWage, averageDailyRate } = sharedVariables;
  const { checkInSavings, roomAssignmentSavings, upsellRevenue, commissionSaved, totalTime, totalSavings } = results;

  return (
    <CollapsibleSection
      title="Guest Experience"
      icon={<Users className="w-5 h-5 text-blue-600" />}
      iconColor="bg-blue-50"
      summaryMetrics={[
        { label: 'Time Saved', value: `${totalTime.toLocaleString()} hrs` },
        { label: 'Annual Savings', value: `${currencySymbol} ${totalSavings.toLocaleString()}` },
      ]}
      isExpanded={isExpanded}
      onToggle={onToggle}
      headerless={headerless}
    >
      <div className="space-y-8">
        <div className="rounded-xl p-5 md:p-6" style={{ background: 'color-mix(in srgb, var(--mews-night-black) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 7%, transparent)' }}>
          <h3 className="text-base font-bold text-gray-900 mb-5">Intuitive Check-In & Guest Portal</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Current Process</h3>
              <div>
                <Slider label="Reservations Per Month" value={reservationsPerMonth} onChange={(v) => onSharedVariableChange('reservationsPerMonth', v)} min={0} max={1000} step={10} color="purple" tooltip="Total monthly reservations for your property. Derived from occupancy rate and number of rooms. Source: STR/CoStar 2024, CBRE Trends 2024. | Ask: How many reservations do you handle per month on average?" />
                <p className="text-xs text-gray-500 mt-1">⚙️ Shared variable - synced across all sections</p>
              </div>
              <Slider label="Time to Check In" value={checkInTime} onChange={(v) => onInputChange('checkInTime', v)} min={0} max={15} step={0.5} formatValue={formatMinutes} color="yellow" tooltip="Average time for a guest to complete front-desk check-in. Industry range: 7-12 min depending on hotel type. Source: CBRE Trends 2024, Mews research. | Ask: How long does a typical guest check-in take at your front desk, start to finish?" />
              <Slider label="Time to Check Out" value={checkOutTime} onChange={(v) => onInputChange('checkOutTime', v)} min={0} max={10} step={0.5} formatValue={formatMinutes} color="yellow" tooltip="Average time for a guest to complete check-out at the front desk. Industry range: 1-5 min. Source: CBRE Trends 2024, Mews research. | Ask: How long does your check-out process usually take per guest?" />
              <div>
                <Slider label="Staff Hourly Wage" value={staffHourlyWage} onChange={(v) => onSharedVariableChange('staffHourlyWage', v)} min={0} max={50} step={0.5} unit={currencySymbol} color="purple" tooltip="Average hourly cost of front-desk/hospitality staff in your country. Auto-set based on country selection. Source: BLS, ERI SalaryExpert, Eurostat. | Ask: What's the average hourly rate for your front-desk or hospitality staff?" />
                <p className="text-xs text-gray-500 mt-1">⚙️ Shared variable - synced across all sections</p>
              </div>
            </div>
            <div className="space-y-6 p-5 rounded-xl" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--mews-indigo) 7%, transparent) 0%, color-mix(in srgb, var(--mews-night-black) 4%, transparent) 100%)', border: '1px solid color-mix(in srgb, var(--mews-indigo) 15%, transparent)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--mews-indigo)' }}>With Mews</h3>
              <Slider label="Mews Time to Check In" value={mewsCheckInTime} onChange={(v) => onInputChange('mewsCheckInTime', v)} min={0.1} max={5} step={0.1} formatValue={formatMinutes} color="pink" tooltip="Mews' digital guest portal lets guests check in from their mobile device, whenever and wherever they prefer. Faster check-ins, improved guest satisfaction. Default: 1.5 min. Source: Mews internal benchmark." />
              <Slider label="Mews Time to Check Out" value={mewsCheckOutTime} onChange={(v) => onInputChange('mewsCheckOutTime', v)} min={0.1} max={5} step={0.1} formatValue={formatMinutes} color="pink" tooltip="Mews enables contactless check-out from any device - no queues, no waiting. Guests settle their bill digitally at their own pace. Default: 0.5 min. Source: Mews internal benchmark." />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <ResultCard label="Annual Check-In Time Saved" value={checkInSavings.annualCheckInTimeSaved} unit="hours" />
            <ResultCard label="Annual Check-Out Time Saved" value={checkInSavings.annualCheckOutTimeSaved} unit="hours" />
            <ResultCard label="Annual Total Cost Savings" value={`${currencySymbol} ${checkInSavings.annualTotalCostSavings.toLocaleString()}`} large />
          </div>
          <Explanation
            title="How This Works"
            description={`Your property currently handles ${reservationsPerMonth.toLocaleString()} reservations monthly, with each guest spending an average of ${formatMinutes(checkInTime)} checking in and ${formatMinutes(checkOutTime)} checking out. With Mews' intuitive digital check-in portal, guests can complete these processes in ${formatMinutes(mewsCheckInTime)} and ${formatMinutes(mewsCheckOutTime)} respectively—directly from their mobile device or room. This streamlined experience reclaims approximately ${checkInSavings.annualCheckInTimeSaved + checkInSavings.annualCheckOutTimeSaved} hours annually, valued at ${currencySymbol}${checkInSavings.annualTotalCostSavings.toLocaleString()}. Your team can redirect this saved time toward exceptional guest service, personalized interactions, and revenue-generating activities. Mews' cloud-native platform powers over 12,500 hospitality properties worldwide, automating tedious manual tasks while guests enjoy a modern, frictionless arrival experience.`}
          />
        </div>

        <div className="rounded-xl p-5 md:p-6" style={{ background: 'color-mix(in srgb, var(--mews-night-black) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 7%, transparent)' }}>
          <h3 className="text-base font-bold text-gray-900 mb-5">Automatic Room Assignment</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Current Process</h3>
              <div>
                <Slider label="Reservations Per Month" value={reservationsPerMonth} onChange={(v) => onSharedVariableChange('reservationsPerMonth', v)} min={0} max={1000} step={10} color="purple" tooltip="Total monthly reservations for your property. Derived from occupancy rate and number of rooms. Source: STR/CoStar 2024, CBRE Trends 2024. | Ask: How many reservations do you handle per month on average?" />
                <p className="text-xs text-gray-500 mt-1">⚙️ Shared variable - synced across all sections</p>
              </div>
              <Slider label="Time to Assign Rooms" value={roomAssignmentTime} onChange={(v) => onInputChange('roomAssignmentTime', v)} min={0} max={10} step={0.5} formatValue={formatMinutes} color="yellow" tooltip="Average time staff spends manually assigning a room per reservation. Industry range: 2-5 min. Source: CBRE Trends 2024, operator interviews. | Ask: How much time does your team spend manually assigning rooms for each reservation?" />
              <div>
                <Slider label="Staff Hourly Wage" value={staffHourlyWage} onChange={(v) => onSharedVariableChange('staffHourlyWage', v)} min={0} max={50} step={0.5} unit={currencySymbol} color="purple" tooltip="Average hourly cost of front-desk/hospitality staff in your country. Auto-set based on country selection. Source: BLS, ERI SalaryExpert, Eurostat. | Ask: What's the average hourly rate for your front-desk or hospitality staff?" />
                <p className="text-xs text-gray-500 mt-1">⚙️ Shared variable - synced across all sections</p>
              </div>
            </div>
            <div className="flex items-center justify-center p-5 rounded-xl" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--mews-indigo) 7%, transparent) 0%, color-mix(in srgb, var(--mews-night-black) 4%, transparent) 100%)', border: '1px solid color-mix(in srgb, var(--mews-indigo) 15%, transparent)' }}>
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <p className="text-gray-700 text-lg font-medium">Automated with Mews</p>
                <p className="text-gray-600 text-sm">Rooms assigned instantly</p>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <ResultCard label="Annual Time Saved in Room Assignment" value={roomAssignmentSavings.annualTimeSaved} unit="hours" />
            <ResultCard label="Annual Cost Saving in Room Assignment" value={`${currencySymbol} ${roomAssignmentSavings.annualCostSaving.toLocaleString()}`} large />
          </div>
          <Explanation
            title="How This Works"
            description={`Industry standard: Most properties spend 2-5 minutes per reservation on manual room assignments, with front desk staff wages typically ranging $15-25/hour depending on location. Currently, your staff spends approximately ${formatMinutes(roomAssignmentTime)} per reservation manually assigning rooms based on availability, guest preferences, and property constraints. With ${reservationsPerMonth.toLocaleString()} monthly reservations, this adds up quickly. Mews' intelligent automation engine eliminates this manual task entirely by instantly assigning optimal rooms based on pre-configured rules, guest profiles, and real-time availability. This saves ${roomAssignmentSavings.annualTimeSaved} hours per year—worth ${currencySymbol}${roomAssignmentSavings.annualCostSaving.toLocaleString()} in labor costs. Your team is freed from repetitive administrative work and can instead focus on creating memorable guest experiences, driving upsells, and maximizing revenue opportunities. The system works 24/7, ensuring seamless operations even during peak periods.`}
          />
        </div>

        <div className="rounded-xl p-5 md:p-6" style={{ background: 'color-mix(in srgb, var(--mews-night-black) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 7%, transparent)' }}>
          <h3 className="text-base font-bold text-gray-900 mb-5">Upsell in Guest Portal</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Property</h3>
              <div>
                <Slider label="Reservations Per Month" value={reservationsPerMonth} onChange={(v) => onSharedVariableChange('reservationsPerMonth', v)} min={0} max={1000} step={10} color="purple" tooltip="Total monthly reservations for your property. Derived from occupancy rate and number of rooms. Source: STR/CoStar 2024, CBRE Trends 2024. | Ask: How many reservations do you handle per month on average?" />
                <p className="text-xs text-gray-500 mt-1">⚙️ Shared variable - synced across all sections</p>
              </div>
              <div>
                <Slider label="Average Daily Rate (ADR)" value={averageDailyRate} onChange={(v) => onSharedVariableChange('averageDailyRate', v)} min={0} max={500} step={5} unit={currencySymbol} color="purple" tooltip="Average revenue earned per occupied room per day. Auto-set based on country and hotel type. Source: STR/CoStar 2024, CBRE, HVS. | Ask: What's your current average daily rate (ADR)?" />
                <p className="text-xs text-gray-500 mt-1">⚙️ Shared variable - synced across all sections</p>
              </div>
            </div>
            <div className="space-y-6 p-5 rounded-xl" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--mews-indigo) 7%, transparent) 0%, color-mix(in srgb, var(--mews-night-black) 4%, transparent) 100%)', border: '1px solid color-mix(in srgb, var(--mews-indigo) 15%, transparent)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--mews-indigo)' }}>Mews Impact</h3>
              <Slider label="% Reservations Checked In Online" value={onlineCheckInPercentage} onChange={(v) => onInputChange('onlineCheckInPercentage', v)} min={0} max={100} step={5} unit="%" color="pink" tooltip="Mews' digital guest portal and kiosk allow guests to check in digitally, reducing front-desk queues and putting guests in control of their experience. Default varies by region (15–35%) and hotel type. Source: Mews June 2025 survey — US portal 10.5%, kiosk 30%; global portal 8.6%, kiosk 20%." />
              <Slider label="Average Revenue Uplift" value={revenueUplift} onChange={(v) => onInputChange('revenueUplift', v)} min={0} max={30} step={1} unit="%" color="pink" tooltip="Mews Kiosk and Guest Portal present smart, relevant upsells at every touchpoint - room upgrades, late checkout, spa, parking, and more. Guests browse at their own pace without pressure. Default: 10-15%. Source: Mews research." />
            </div>
          </div>
          <div className="mb-6">
            <ResultCard label="Estimated Upsell Revenue" value={`${currencySymbol} ${upsellRevenue.toLocaleString()}`} large />
          </div>
          <Explanation
            title="How This Works"
            description={`With an average daily rate of ${currencySymbol}${averageDailyRate} and ${reservationsPerMonth.toLocaleString()} monthly reservations, your property has significant untapped revenue potential. When ${onlineCheckInPercentage}% of guests use Mews' digital check-in portal, they're presented with personalized upsell opportunities at the perfect moment—room upgrades, late checkout, spa packages, and dining experiences. Unlike traditional front desk interactions where staff may be too busy or guests too rushed, the digital portal creates a pressure-free environment for guests to explore premium add-ons. Industry data shows this approach generates an average revenue uplift of ${revenueUplift}%, translating to ${currencySymbol}${upsellRevenue.toLocaleString()} in additional annual revenue. Mews uses AI-powered guest profiles to surface the most relevant offers, increasing conversion rates while enhancing the guest experience with options tailored to their preferences.`}
          />
        </div>

        <div className="rounded-xl p-5 md:p-6" style={{ background: 'color-mix(in srgb, var(--mews-night-black) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mews-night-black) 7%, transparent)' }}>
          <h3 className="text-base font-bold text-gray-900 mb-5">Direct Booking & Commission Savings</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Property</h3>
              <div>
                <Slider label="Reservations Per Month" value={reservationsPerMonth} onChange={(v) => onSharedVariableChange('reservationsPerMonth', v)} min={0} max={1000} step={10} color="purple" tooltip="Total monthly reservations for your property. Derived from occupancy rate and number of rooms. Source: STR/CoStar 2024, CBRE Trends 2024. | Ask: How many reservations do you handle per month on average?" />
                <p className="text-xs text-gray-500 mt-1">⚙️ Shared variable - synced across all sections</p>
              </div>
              <div>
                <Slider label="Average Daily Rate" value={averageDailyRate} onChange={(v) => onSharedVariableChange('averageDailyRate', v)} min={0} max={500} step={5} unit={currencySymbol} color="purple" tooltip="Average revenue earned per occupied room per day. Auto-set based on country and hotel type. Source: STR/CoStar 2024, CBRE, HVS. | Ask: What's your current average daily rate (ADR)?" />
                <p className="text-xs text-gray-500 mt-1">⚙️ Shared variable - synced across all sections</p>
              </div>
              <Slider label="Average OTA Commission Rate" value={averageCommission} onChange={(v) => onInputChange('averageCommission', v)} min={0} max={30} step={1} unit="%" color="yellow" tooltip="Average commission rate charged by OTAs (Booking.com, Expedia, etc). Industry standard: 15-25%. Default: 18%. Source: HFTP, Phocuswright. | Ask: What commission rate are you paying your main OTA partners like Booking.com or Expedia?" />
            </div>
            <div className="space-y-6 p-5 rounded-xl" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--mews-indigo) 7%, transparent) 0%, color-mix(in srgb, var(--mews-night-black) 4%, transparent) 100%)', border: '1px solid color-mix(in srgb, var(--mews-indigo) 15%, transparent)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--mews-indigo)' }}>Mews Impact</h3>
              <Slider label="Direct Booking Increase" value={directBookingIncrease} onChange={(v) => onInputChange('directBookingIncrease', v)} min={0} max={100} step={5} unit="%" color="pink" tooltip="Mews' user-friendly booking engine drives direct bookings with customizable options and a branded experience. One customer reported 40% more direct bookings in the first year. Default: 40-45%. Source: Mews research." />
            </div>
          </div>
          <div className="mb-6">
            <ResultCard label="Annual OTA Commission Savings" value={`${currencySymbol} ${commissionSaved.toLocaleString()}`} large />
          </div>
          <Explanation
            title="How This Works"
            description={`Online travel agencies (OTAs) charge an average commission of ${averageCommission}% per booking, significantly impacting your bottom line. With ${reservationsPerMonth.toLocaleString()} monthly reservations at ${currencySymbol}${averageDailyRate} average daily rate, these fees add up quickly. Mews' integrated booking engine and seamless direct booking experience can increase your direct reservations by ${directBookingIncrease}%—that's money going straight to your property instead of third-party platforms. By saving ${currencySymbol}${commissionSaved.toLocaleString()} annually in OTA commissions, you gain greater control over guest relationships, data, and the entire booking journey. Mews provides a modern, user-friendly booking interface that rivals OTA experiences, complete with real-time availability, dynamic pricing, and mobile optimization. Plus, you own the guest data, enabling personalized marketing and building long-term loyalty that drives repeat bookings—all commission-free.`}
          />
        </div>

        <div className="mt-6">
          <ResultCard label="Total Annual Guest Experience Impact" value={`${currencySymbol} ${totalSavings.toLocaleString()}`} large />
        </div>
      </div>
    </CollapsibleSection>
  );
}
