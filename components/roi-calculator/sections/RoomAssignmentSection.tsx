'use client';

import { Home } from 'lucide-react';
import CollapsibleSection from '@/components/roi-calculator/ui/CollapsibleSection';
import Slider from '@/components/roi-calculator/ui/Slider';
import ResultCard from '@/components/roi-calculator/ui/ResultCard';
import Explanation from '@/components/roi-calculator/ui/Explanation';
import { formatMinutes } from '@/lib/roi-calculator/utils/timeFormat';

interface RoomAssignmentSectionProps {
  reservationsPerMonth: number;
  roomAssignmentTime: number;
  setRoomAssignmentTime: (value: number) => void;
  averageStaffWage: number;
  roomAssignmentSavings: {
    annualTimeSaved: number;
    annualCostSaving: number;
  };
}

export default function RoomAssignmentSection({
  reservationsPerMonth,
  roomAssignmentTime,
  setRoomAssignmentTime,
  averageStaffWage,
  roomAssignmentSavings,
}: RoomAssignmentSectionProps) {
  return (
    <CollapsibleSection
      title="Automatic Room Assignment"
      icon={<Home className="w-5 h-5 text-white" />}
      iconColor="from-indigo-500 to-purple-600 shadow-indigo-500/50"
      summaryMetrics={[
        { label: 'Time Saved', value: `${roomAssignmentSavings.annualTimeSaved} hrs` },
        { label: 'Annual Savings', value: `€ ${roomAssignmentSavings.annualCostSaving.toLocaleString()}` },
      ]}
    >

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Your Current Process</h3>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Reservations Per Month</p>
            <p className="text-2xl font-bold text-indigo-400">{reservationsPerMonth}</p>
          </div>
          <Slider
            label="Time to Assign Rooms"
            value={roomAssignmentTime}
            onChange={setRoomAssignmentTime}
            min={0}
            max={10}
            step={0.5}
            formatValue={formatMinutes}
            color="purple"
          />
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Average Staff Hourly Wage</p>
            <p className="text-2xl font-bold text-indigo-400">€ {averageStaffWage.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-rose-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/50">
              <Home className="w-12 h-12 text-white" />
            </div>
            <p className="text-gray-300 text-lg font-medium">Automated with Mews</p>
            <p className="text-gray-500 text-sm">Rooms assigned instantly</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ResultCard
          label="Annual Time Saved in Room Assignment"
          value={roomAssignmentSavings.annualTimeSaved}
          unit="hours"
        />
        <ResultCard
          label="Annual Cost Saving in Room Assignment"
          value={`€ ${roomAssignmentSavings.annualCostSaving.toLocaleString()}`}
          large
        />
      </div>

      <Explanation
        title="How This Works"
        description={`Currently, your staff spends approximately ${formatMinutes(roomAssignmentTime)} per reservation manually assigning rooms based on availability, guest preferences, and property constraints. With ${reservationsPerMonth.toLocaleString()} monthly reservations, this adds up quickly. Mews' intelligent automation engine eliminates this manual task entirely by instantly assigning optimal rooms based on pre-configured rules, guest profiles, and real-time availability. This saves ${roomAssignmentSavings.annualTimeSaved} hours per year—worth €${roomAssignmentSavings.annualCostSaving.toLocaleString()} in labor costs. Your team is freed from repetitive administrative work and can instead focus on creating memorable guest experiences, driving upsells, and maximizing revenue opportunities. The system works 24/7, ensuring seamless operations even during peak periods.`}
      />
    </CollapsibleSection>
  );
}
