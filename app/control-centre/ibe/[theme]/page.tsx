'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { IbeTheme, IbeSearchResult } from '@/types/control-centre';

const IBE_THEME_CONFIG: Record<IbeTheme, { displayName: string; primaryColor: string; description: string }> = {
  luxury: { displayName: 'Luxury Retreat', primaryColor: '#1C1D24', description: 'Premium experiences for discerning travellers' },
  city: { displayName: 'City Break', primaryColor: '#172135', description: 'Urban escapes in the heart of the city' },
  resort: { displayName: 'Resort & Spa', primaryColor: '#222B28', description: 'Relaxation and wellness in a resort setting' },
  conference: { displayName: 'Conference & Events', primaryColor: 'var(--mews-charcoal)', description: 'Professional venues for meetings and events' },
  budget: { displayName: 'Budget Smart', primaryColor: 'var(--mews-deep-blue)', description: 'Great value stays without compromising quality' },
};

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getFutureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

type Step = 'search' | 'results' | 'booking' | 'confirmation';

interface BookingForm {
  firstName: string;
  lastName: string;
  email: string;
}

export default function IbePage({ params }: { params: { theme: string } }) {
  const theme = params.theme as IbeTheme;
  const searchParams = useSearchParams();
  const router = useRouter();
  const enterpriseId = searchParams.get('enterpriseId') || '';

  const themeConfig = IBE_THEME_CONFIG[theme] || IBE_THEME_CONFIG.city;

  const [step, setStep] = useState<Step>('search');
  const [checkIn, setCheckIn] = useState(getFutureDate(7));
  const [checkOut, setCheckOut] = useState(getFutureDate(9));
  const [guestCount, setGuestCount] = useState(2);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<IbeSearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<IbeSearchResult | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({ firstName: '', lastName: '', email: '' });
  const [confirmation, setConfirmation] = useState<{ reservationId: string; confirmationNumber?: string } | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setError('');
    try {
      const res = await fetch('/api/control-centre/ibe/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterpriseId, checkIn, checkOut, guestCount, theme }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setStep('results');
      } else {
        setError(data.error || 'Search failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setSearching(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResult) return;
    setBooking(true);
    setError('');
    try {
      const res = await fetch('/api/control-centre/ibe/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enterpriseId,
          serviceId: undefined,
          rateId: selectedResult.rateId,
          resourceCategoryId: selectedResult.resourceCategoryId,
          checkIn,
          checkOut,
          guestCount,
          theme,
          guestFirstName: bookingForm.firstName,
          guestLastName: bookingForm.lastName,
          guestEmail: bookingForm.email,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setConfirmation({ reservationId: data.result.reservationId, confirmationNumber: data.result.confirmationNumber });
        setStep('confirmation');
      } else {
        setError(data.error || 'Booking failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ '--ibe-primary': themeConfig.primaryColor } as React.CSSProperties}>
      {/* Header */}
      <header style={{ backgroundColor: themeConfig.primaryColor }} className="text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{themeConfig.displayName}</h1>
            <p className="text-sm opacity-75">{themeConfig.description}</p>
          </div>
          <button
            onClick={() => router.push(`/control-centre?tab=ibe`)}
            className="text-sm opacity-75 hover:opacity-100 transition-opacity"
          >
            &larr; Back
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Step: Search */}
        {step === 'search' && (
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Find Availability</h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={e => setCheckIn(e.target.value)}
                    min={getTodayDate()}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                <input
                  type="number"
                  value={guestCount}
                  onChange={e => setGuestCount(parseInt(e.target.value) || 1)}
                  min={1} max={10} required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={searching}
                style={{ backgroundColor: searching ? undefined : themeConfig.primaryColor }}
                className={`w-full py-2 px-4 text-white text-sm font-semibold rounded-lg ${searching ? 'bg-gray-400 cursor-not-allowed' : ''}`}
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{results.length} option{results.length !== 1 ? 's' : ''} available</h2>
              <button onClick={() => setStep('search')} className="text-sm text-gray-500 hover:text-gray-700">&larr; Modify search</button>
            </div>
            {results.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No availability found for these dates.</p>
            ) : (
              results.map((result, i) => (
                <div
                  key={i}
                  onClick={() => { setSelectedResult(result); setStep('booking'); }}
                  className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow border border-transparent hover:border-indigo-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{result.resourceCategoryName}</p>
                      <p className="text-sm text-gray-500">{result.rateName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">&euro;{result.markedUpPrice}</p>
                      <p className="text-xs text-gray-400">per night</p>
                    </div>
                  </div>
                  <button
                    style={{ backgroundColor: themeConfig.primaryColor }}
                    className="mt-3 w-full py-2 text-white text-sm font-semibold rounded-lg"
                  >
                    Select
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Step: Booking */}
        {step === 'booking' && selectedResult && (
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Guest Details</h2>
              <button onClick={() => setStep('results')} className="text-sm text-gray-500 hover:text-gray-700">&larr; Back</button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <p className="font-medium">{selectedResult.resourceCategoryName}</p>
              <p className="text-gray-500">{checkIn} &rarr; {checkOut} &middot; {guestCount} guest{guestCount !== 1 ? 's' : ''} &middot; &euro;{selectedResult.markedUpPrice}/night</p>
            </div>
            <form onSubmit={handleBook} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={bookingForm.firstName}
                    onChange={e => setBookingForm(p => ({ ...p, firstName: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={bookingForm.lastName}
                    onChange={e => setBookingForm(p => ({ ...p, lastName: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={bookingForm.email}
                  onChange={e => setBookingForm(p => ({ ...p, email: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={booking}
                style={{ backgroundColor: booking ? undefined : themeConfig.primaryColor }}
                className={`w-full py-2 px-4 text-white text-sm font-semibold rounded-lg ${booking ? 'bg-gray-400 cursor-not-allowed' : ''}`}
              >
                {booking ? 'Booking...' : 'Complete Booking'}
              </button>
            </form>
          </div>
        )}

        {/* Step: Confirmation */}
        {step === 'confirmation' && confirmation && (
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-lg mx-auto text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl text-white mx-auto mb-4"
              style={{ backgroundColor: themeConfig.primaryColor }}
            >
              &#10003;
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            {confirmation.confirmationNumber && (
              <p className="text-gray-600 mb-1">Confirmation: <span className="font-mono font-medium">{confirmation.confirmationNumber}</span></p>
            )}
            <p className="text-xs text-gray-400 mb-6">Reservation ID: {confirmation.reservationId}</p>
            <button
              onClick={() => { setStep('search'); setConfirmation(null); setSelectedResult(null); }}
              style={{ backgroundColor: themeConfig.primaryColor }}
              className="py-2 px-6 text-white text-sm font-semibold rounded-lg"
            >
              New Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
