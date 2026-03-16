'use client';

import { UserCheck } from 'lucide-react';
import CollapsibleSection from '@/components/roi-calculator/ui/CollapsibleSection';
import Slider from '@/components/roi-calculator/ui/Slider';
import ResultCard from '@/components/roi-calculator/ui/ResultCard';
import Explanation from '@/components/roi-calculator/ui/Explanation';
import { formatMinutes } from '@/lib/roi-calculator/utils/timeFormat';

interface CheckInPortalSectionProps {
  reservationsPerMonth: number;
  setReservationsPerMonth: (value: number) => void;
  checkInTime: number;
  setCheckInTime: (value: number) => void;
  checkOutTime: number;
  setCheckOutTime: (value: number) => void;
  averageStaffWage: number;
  setAverageStaffWage: (value: number) => void;
  mewsCheckInTime: number;
  setMewsCheckInTime: (value: number) => void;
  mewsCheckOutTime: number;
  setMewsCheckOutTime: (value: number) => void;
  checkInSavings: {
    annualCheckInTimeSaved: number;
    annualCheckOutTimeSaved: number;
    annualTotalCostSavings: number;
  };
}

export default function CheckInPortalSection({
  reservationsPerMonth,
  setReservationsPerMonth,
  checkInTime,
  setCheckInTime,
  checkOutTime,
  setCheckOutTime,
  averageStaffWage,
  setAverageStaffWage,
  mewsCheckInTime,
  setMewsCheckInTime,
  mewsCheckOutTime,
  setMewsCheckOutTime,
  checkInSavings,
}: CheckInPortalSectionProps) {
  return (
    <CollapsibleSection
      title="Intuitive Check-In & Guest Portal"
      icon={<UserCheck className="w-5 h-5 text-white" />}
      iconColor="from-indigo-500 to-purple-600 shadow-indigo-500/50"
      summaryMetrics={[
        { label: 'Time Saved', value: `${checkInSavings.annualCheckInTimeSaved + checkInSavings.annualCheckOutTimeSaved} hrs` },
        { label: 'Annual Savings', value: `€ ${checkInSavings.annualTotalCostSavings.toLocaleString()}` },
      ]}
    >
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Your Current Process</h3>
          <Slider
            label="Reservations Per Month"
            value={reservationsPerMonth}
            onChange={setReservationsPerMonth}
            min={0}
            max={1000}
            step={10}
            color="purple"
          />
          <Slider
            label="Time to Check In"
            value={checkInTime}
            onChange={setCheckInTime}
            min={0}
            max={15}
            step={0.5}
            formatValue={formatMinutes}
            color="purple"
          />
          <Slider
            label="Time to Check Out"
            value={checkOutTime}
            onChange={setCheckOutTime}
            min={0}
            max={10}
            step={0.5}
            formatValue={formatMinutes}
            color="purple"
          />
          <Slider
            label="Average Staff Hourly Wage"
            value={averageStaffWage}
            onChange={setAverageStaffWage}
            min={0}
            max={50}
            step={0.5}
            unit="€"
            color="purple"
          />
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">With Mews</h3>
          <Slider
            label="Mews Time to Check In"
            value={mewsCheckInTime}
            onChange={setMewsCheckInTime}
            min={0.1}
            max={5}
            step={0.1}
            formatValue={formatMinutes}
            color="pink"
          />
          <Slider
            label="Mews Time to Check Out"
            value={mewsCheckOutTime}
            onChange={setMewsCheckOutTime}
            min={0.1}
            max={5}
            step={0.1}
            formatValue={formatMinutes}
            color="pink"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <ResultCard
          label="Annual Check-In Time Saved"
          value={checkInSavings.annualCheckInTimeSaved}
          unit="hours"
        />
        <ResultCard
          label="Annual Check-Out Time Saved"
          value={checkInSavings.annualCheckOutTimeSaved}
          unit="hours"
        />
        <ResultCard
          label="Annual Total Cost Savings"
          value={`€ ${checkInSavings.annualTotalCostSavings.toLocaleString()}`}
          large
        />
      </div>

      <Explanation
        title="How This Works"
        description={`Your property currently handles ${reservationsPerMonth.toLocaleString()} reservations monthly, with each guest spending an average of ${formatMinutes(checkInTime)} checking in and ${formatMinutes(checkOutTime)} checking out. With Mews' intuitive digital check-in portal, guests can complete these processes in ${formatMinutes(mewsCheckInTime)} and ${formatMinutes(mewsCheckOutTime)} respectively—directly from their mobile device or room. This streamlined experience reclaims approximately ${checkInSavings.annualCheckInTimeSaved + checkInSavings.annualCheckOutTimeSaved} hours annually, valued at €${checkInSavings.annualTotalCostSavings.toLocaleString()}. Your team can redirect this saved time toward exceptional guest service, personalized interactions, and revenue-generating activities. Mews' cloud-native platform powers over 12,500 hospitality properties worldwide, automating tedious manual tasks while guests enjoy a modern, frictionless arrival experience.`}
      />
    </CollapsibleSection>
  );
}
