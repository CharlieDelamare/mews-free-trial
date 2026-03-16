'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';
import type { OtaChannel } from '@/types/control-centre';

interface Props {
  enterpriseId: string;
}

const CHANNELS: Array<{ value: OtaChannel; label: string }> = [
  { value: 'booking_com', label: 'Booking.com' },
  { value: 'expedia', label: 'Expedia' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'agoda', label: 'Agoda' },
  { value: 'direct', label: 'Direct' },
];

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getFutureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export default function OtaTab({ enterpriseId }: Props) {
  const { showToast } = useToast();
  const [channel, setChannel] = useState<OtaChannel>('booking_com');
  const [checkIn, setCheckIn] = useState(getFutureDate(7));
  const [checkOut, setCheckOut] = useState(getFutureDate(9));
  const [guestCount, setGuestCount] = useState(2);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/control-centre/ota-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterpriseId, channel, checkIn, checkOut, guestCount }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Booking simulated via ${CHANNELS.find(c => c.value === channel)?.label}!`, 'success');
      } else {
        showToast(data.error || 'OTA simulation failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Simulate OTA Booking</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
            <select
              value={channel}
              onChange={e => setChannel(e.target.value as OtaChannel)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {CHANNELS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
              <input
                type="date"
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                min={getTodayDate()}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
              <input
                type="date"
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                min={checkIn}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
            <input
              type="number"
              value={guestCount}
              onChange={e => setGuestCount(parseInt(e.target.value) || 1)}
              min={1}
              max={10}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 text-white text-sm font-semibold rounded-lg transition-colors ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Simulating...' : 'Simulate Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
