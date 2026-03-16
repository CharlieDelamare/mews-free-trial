'use client';

import { Percent } from 'lucide-react';
import CollapsibleSection from '@/components/roi-calculator/ui/CollapsibleSection';
import Slider from '@/components/roi-calculator/ui/Slider';
import ResultCard from '@/components/roi-calculator/ui/ResultCard';
import Explanation from '@/components/roi-calculator/ui/Explanation';

interface DirectBookingSectionProps {
  reservationsPerMonth: number;
  averageDailyRate: number;
  directBookingIncrease: number;
  setDirectBookingIncrease: (value: number) => void;
  averageCommission: number;
  setAverageCommission: (value: number) => void;
  commissionSaved: number;
}

export default function DirectBookingSection({
  reservationsPerMonth,
  averageDailyRate,
  directBookingIncrease,
  setDirectBookingIncrease,
  averageCommission,
  setAverageCommission,
  commissionSaved,
}: DirectBookingSectionProps) {
  return (
    <CollapsibleSection
      title="Direct Booking & Commission"
      icon={<Percent className="w-5 h-5 text-white" />}
      iconColor="from-indigo-500 to-purple-600 shadow-indigo-500/50"
      summaryMetrics={[
        { label: 'Annual Savings', value: `€ ${commissionSaved.toLocaleString()}` },
      ]}
    >

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Your Property</h3>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Reservations Per Month</p>
            <p className="text-2xl font-bold text-indigo-400">{reservationsPerMonth}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Average Daily Rate (ADR)</p>
            <p className="text-2xl font-bold text-indigo-400">€ {averageDailyRate}</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">Mews Impact</h3>
          <Slider
            label="% of Direct Booking Increase"
            value={directBookingIncrease}
            onChange={setDirectBookingIncrease}
            min={0}
            max={80}
            step={5}
            unit="%"
            color="pink"
          />
          <Slider
            label="Average Commission"
            value={averageCommission}
            onChange={setAverageCommission}
            min={0}
            max={25}
            step={1}
            unit="%"
            color="pink"
          />
        </div>
      </div>

      <ResultCard
        label="Estimated OTA Commission Saved"
        value={`€ ${commissionSaved.toLocaleString()}`}
        large
      />

      <Explanation
        title="How This Works"
        description={`Online travel agencies (OTAs) charge an average commission of ${averageCommission}% per booking, significantly impacting your bottom line. With ${reservationsPerMonth.toLocaleString()} monthly reservations at €${averageDailyRate} average daily rate, these fees add up quickly. Mews' integrated booking engine and seamless direct booking experience can increase your direct reservations by ${directBookingIncrease}%—that's money going straight to your property instead of third-party platforms. By saving €${commissionSaved.toLocaleString()} annually in OTA commissions, you gain greater control over guest relationships, data, and the entire booking journey. Mews provides a modern, user-friendly booking interface that rivals OTA experiences, complete with real-time availability, dynamic pricing, and mobile optimization. Plus, you own the guest data, enabling personalized marketing and building long-term loyalty that drives repeat bookings—all commission-free.`}
      />
    </CollapsibleSection>
  );
}
