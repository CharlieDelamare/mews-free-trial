'use client';

import { ShoppingBag } from 'lucide-react';
import CollapsibleSection from '@/components/roi-calculator/ui/CollapsibleSection';
import Slider from '@/components/roi-calculator/ui/Slider';
import ResultCard from '@/components/roi-calculator/ui/ResultCard';
import Explanation from '@/components/roi-calculator/ui/Explanation';

interface UpsellSectionProps {
  reservationsPerMonth: number;
  averageDailyRate: number;
  setAverageDailyRate: (value: number) => void;
  onlineCheckInPercentage: number;
  setOnlineCheckInPercentage: (value: number) => void;
  revenueUplift: number;
  setRevenueUplift: (value: number) => void;
  upsellRevenue: number;
}

export default function UpsellSection({
  reservationsPerMonth,
  averageDailyRate,
  setAverageDailyRate,
  onlineCheckInPercentage,
  setOnlineCheckInPercentage,
  revenueUplift,
  setRevenueUplift,
  upsellRevenue,
}: UpsellSectionProps) {
  return (
    <CollapsibleSection
      title="Upsell in Guest Portal"
      icon={<ShoppingBag className="w-5 h-5 text-white" />}
      iconColor="from-indigo-500 to-purple-600 shadow-indigo-500/50"
      summaryMetrics={[
        { label: 'Annual Revenue', value: `€ ${upsellRevenue.toLocaleString()}` },
      ]}
    >

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Your Property</h3>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Reservations Per Month</p>
            <p className="text-2xl font-bold text-indigo-400">{reservationsPerMonth}</p>
          </div>
          <Slider
            label="Average Daily Rate (ADR)"
            value={averageDailyRate}
            onChange={setAverageDailyRate}
            min={0}
            max={300}
            step={5}
            unit="€"
            color="purple"
          />
        </div>

        <div className="space-y-6 p-5 rounded-xl" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--mews-indigo) 7%, transparent) 0%, color-mix(in srgb, var(--mews-night-black) 4%, transparent) 100%)', border: '1px solid color-mix(in srgb, var(--mews-indigo) 15%, transparent)' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--mews-indigo)' }}>Mews Impact</h3>
          <Slider
            label="% Reservations Checked In Online"
            value={onlineCheckInPercentage}
            onChange={setOnlineCheckInPercentage}
            min={0}
            max={100}
            step={5}
            unit="%"
            color="pink"
          />
          <Slider
            label="Average Revenue Uplift"
            value={revenueUplift}
            onChange={setRevenueUplift}
            min={0}
            max={30}
            step={1}
            unit="%"
            color="pink"
          />
        </div>
      </div>

      <ResultCard
        label="Estimated Upsell Revenue"
        value={`€ ${upsellRevenue.toLocaleString()}`}
        large
      />

      <Explanation
        title="How This Works"
        description={`With an average daily rate of €${averageDailyRate} and ${reservationsPerMonth.toLocaleString()} monthly reservations, your property has significant untapped revenue potential. When ${onlineCheckInPercentage}% of guests use Mews' digital check-in portal, they're presented with personalized upsell opportunities at the perfect moment—room upgrades, late checkout, spa packages, and dining experiences. Unlike traditional front desk interactions where staff may be too busy or guests too rushed, the digital portal creates a pressure-free environment for guests to explore premium add-ons. Industry data shows this approach generates an average revenue uplift of ${revenueUplift}%, translating to €${upsellRevenue.toLocaleString()} in additional annual revenue. Mews uses AI-powered guest profiles to surface the most relevant offers, increasing conversion rates while enhancing the guest experience with options tailored to their preferences.`}
      />
    </CollapsibleSection>
  );
}
