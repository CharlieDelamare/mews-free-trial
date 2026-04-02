'use client';

import { useState } from 'react';
import type { HotelCandidate, HotelResearchData } from '@/types/research';

type Phase = 'idle' | 'searching' | 'selecting' | 'fetching' | 'results' | 'error';

interface SearchForm {
  name: string;
  city: string;
  countryCode: string;
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <span className="text-xs text-neutral-500">
      {'★'.repeat(rating)}{'☆'.repeat(Math.max(0, 5 - rating))}
    </span>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <svg className="animate-spin h-8 w-8 text-mews-primary" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}

export default function ResearchPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [form, setForm] = useState<SearchForm>({ name: '', city: '', countryCode: '' });
  const [candidates, setCandidates] = useState<HotelCandidate[]>([]);
  const [hotel, setHotel] = useState<HotelResearchData | null>(null);
  const [activeTab, setActiveTab] = useState<'rooms' | 'rates' | 'products'>('rooms');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function resetToIdle() {
    setPhase('idle');
    setCandidates([]);
    setHotel(null);
    setErrorMessage(null);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPhase('searching');
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({ name: form.name, city: form.city });
      if (form.countryCode) params.set('countryCode', form.countryCode);

      const res = await fetch(`/api/research/search?${params}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error ?? 'Search failed');

      setCandidates(data.candidates);
      setPhase('selecting');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Search failed');
      setPhase('error');
    }
  }

  async function handleSelectCandidate(candidate: HotelCandidate) {
    setPhase('fetching');

    try {
      const params = new URLSearchParams({
        hotelId: candidate.hotelId,
        source: candidate.source,
      });

      const res = await fetch(`/api/research/hotel?${params}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error ?? 'Failed to load hotel data');

      setHotel(data.hotel);
      setActiveTab('rooms');
      setPhase('results');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load hotel data');
      setPhase('error');
    }
  }

  return (
    <main className="min-h-screen bg-mews-linen py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-mews-night-black mb-2">Hotel Research</h1>
          <p className="text-neutral-600">Look up a real hotel to inspire your Mews sandbox configuration</p>
        </div>

        {/* ── IDLE: Search form ── */}
        {phase === 'idle' && (
          <form onSubmit={handleSearch} className="bg-white rounded-xl border border-neutral-100 shadow-sm p-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                Hotel Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="e.g. The Savoy"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-mews-primary focus:border-mews-primary"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="city"
                type="text"
                required
                placeholder="e.g. London"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-mews-primary focus:border-mews-primary"
              />
            </div>

            <div>
              <label htmlFor="countryCode" className="block text-sm font-medium text-neutral-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                id="countryCode"
                required
                value={form.countryCode}
                onChange={e => setForm(f => ({ ...f, countryCode: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-mews-primary focus:border-mews-primary bg-white"
              >
                <option value="" disabled>Select a country…</option>
                <option value="GB">🇬🇧 United Kingdom</option>
                <option value="US">🇺🇸 United States</option>
                <option value="DE">🇩🇪 Germany</option>
                <option value="FR">🇫🇷 France</option>
                <option value="ES">🇪🇸 Spain</option>
                <option value="IT">🇮🇹 Italy</option>
                <option value="NL">🇳🇱 Netherlands</option>
                <option value="BE">🇧🇪 Belgium</option>
                <option value="PT">🇵🇹 Portugal</option>
                <option value="CH">🇨🇭 Switzerland</option>
                <option value="AT">🇦🇹 Austria</option>
                <option value="CZ">🇨🇿 Czech Republic</option>
                <option value="PL">🇵🇱 Poland</option>
                <option value="SE">🇸🇪 Sweden</option>
                <option value="NO">🇳🇴 Norway</option>
                <option value="DK">🇩🇰 Denmark</option>
                <option value="FI">🇫🇮 Finland</option>
                <option value="IE">🇮🇪 Ireland</option>
                <option value="AU">🇦🇺 Australia</option>
                <option value="NZ">🇳🇿 New Zealand</option>
                <option value="CA">🇨🇦 Canada</option>
                <option value="AE">🇦🇪 UAE</option>
                <option value="SG">🇸🇬 Singapore</option>
                <option value="JP">🇯🇵 Japan</option>
                <option value="TH">🇹🇭 Thailand</option>
                <option value="ZA">🇿🇦 South Africa</option>
                <option value="MX">🇲🇽 Mexico</option>
                <option value="BR">🇧🇷 Brazil</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 font-semibold rounded-lg bg-mews-primary text-mews-night-black hover:bg-mews-primary-hover transition-colors"
            >
              Search
            </button>
          </form>
        )}

        {/* ── SEARCHING ── */}
        {phase === 'searching' && <Spinner label="Finding hotels…" />}

        {/* ── SELECTING: Disambiguation list ── */}
        {phase === 'selecting' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-mews-night-black">
                {candidates.length === 0
                  ? `No results for "${form.name}" in ${form.city}`
                  : `${candidates.length} match${candidates.length === 1 ? '' : 'es'} found — select the right property`}
              </h2>
              <button
                onClick={resetToIdle}
                className="text-sm text-mews-primary hover:underline"
              >
                ← Search again
              </button>
            </div>

            {candidates.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-8 text-center">
                <p className="text-neutral-500 text-sm mb-4">
                  Try adjusting the hotel name or city, or check the spelling.
                </p>
                <button
                  onClick={resetToIdle}
                  className="py-2 px-4 bg-mews-primary text-mews-night-black font-semibold rounded-lg hover:bg-mews-primary-hover transition-colors text-sm"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map(candidate => (
                  <button
                    key={candidate.hotelId}
                    onClick={() => handleSelectCandidate(candidate)}
                    className="w-full text-left bg-white rounded-xl border border-neutral-100 shadow-sm p-5 hover:border-mews-primary hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-mews-night-black group-hover:text-mews-primary transition-colors">
                            {candidate.name}
                          </span>
                          <StarRating rating={candidate.starRating} />
                        </div>
                        <p className="text-sm text-neutral-500">
                          {[candidate.address, candidate.country].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-500 shrink-0">
                        {candidate.source === 'liteapi' ? 'LiteAPI' : 'SerpApi'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FETCHING ── */}
        {phase === 'fetching' && <Spinner label="Loading hotel data…" />}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-8 text-center">
            <p className="text-red-600 text-sm mb-4">{errorMessage ?? 'Something went wrong.'}</p>
            <button
              onClick={resetToIdle}
              className="py-2 px-4 bg-mews-primary text-mews-night-black font-semibold rounded-lg hover:bg-mews-primary-hover transition-colors text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── RESULTS: Tabbed view ── */}
        {phase === 'results' && hotel && (
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-mews-night-black">{hotel.hotelName}</h2>
                  <StarRating rating={hotel.starRating} />
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
                    via {hotel.source === 'liteapi' ? 'LiteAPI' : 'SerpApi'}
                  </span>
                </div>
                {hotel.address && (
                  <p className="text-sm text-neutral-500">{hotel.address}</p>
                )}
              </div>
              <button
                onClick={resetToIdle}
                className="text-sm text-mews-primary hover:underline shrink-0"
              >
                ← Search again
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-neutral-200">
              {(['rooms', 'rates', 'products'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'text-mews-night-black border-mews-primary bg-mews-primary/10'
                      : 'text-neutral-500 border-transparent hover:text-mews-night-black hover:border-neutral-300'
                  }`}
                >
                  {tab === 'rooms' && `Room Types (${hotel.roomTypes.length})`}
                  {tab === 'rates' && `Rate Plans (${hotel.ratePlans.length})`}
                  {tab === 'products' && `Products (${hotel.products.length + hotel.generalFacilities.length})`}
                </button>
              ))}
            </div>

            {/* ── Room Types Tab ── */}
            {activeTab === 'rooms' && (
              <div>
                {hotel.roomTypes.length === 0 ? (
                  <p className="text-neutral-400 text-sm text-center py-12">No room type data available from this source.</p>
                ) : (
                  <div className="space-y-4">
                    {hotel.roomTypes.map((room, i) => (
                      <div key={i} className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-mews-night-black">{room.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-mews-primary/10 text-mews-night-black shrink-0">
                            {room.spaceType}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-neutral-500 mb-3">
                          {room.maxOccupancy && <span>Max {room.maxOccupancy} guests</span>}
                          {room.bedType && <span>{room.bedType} bed</span>}
                          {room.sizeSqm && <span>{room.sizeSqm} m²</span>}
                        </div>
                        {room.description && (
                          <p className="text-sm text-neutral-600 mb-3">{room.description}</p>
                        )}
                        {room.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {room.amenities.map((a, j) => (
                              <span key={j} className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full">
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Rate Plans Tab ── */}
            {activeTab === 'rates' && (
              <div>
                {hotel.ratePlans.length === 0 ? (
                  <p className="text-neutral-400 text-sm text-center py-12">No rate plan data available from this source.</p>
                ) : (
                  <div className="space-y-4">
                    {hotel.ratePlans.map((rate, i) => (
                      <div key={i} className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-mews-night-black">{rate.name}</h3>
                          <div className="flex gap-2 shrink-0">
                            {rate.boardType && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-mews-yellow text-mews-night-black font-semibold">
                                {rate.boardType}
                              </span>
                            )}
                            {rate.isRefundable !== null && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                rate.isRefundable
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {rate.isRefundable ? 'Refundable' : 'Non-refundable'}
                              </span>
                            )}
                          </div>
                        </div>
                        {rate.cancellationPolicy && (
                          <p className="text-sm text-neutral-600">{rate.cancellationPolicy}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Products Tab ── */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                {hotel.products.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700 mb-3">Individually Bookable Products</h3>
                    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm divide-y divide-neutral-50">
                      {hotel.products.map((p, i) => (
                        <div key={i} className="flex items-center justify-between px-5 py-3">
                          <span className="text-sm text-mews-night-black">{p.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full">
                            {p.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hotel.generalFacilities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700 mb-1">General Hotel Facilities</h3>
                    <p className="text-xs text-neutral-400 mb-3">These are hotel amenities — not mapped to individual Mews products</p>
                    <div className="flex flex-wrap gap-2">
                      {hotel.generalFacilities.map((f, i) => (
                        <span key={i} className="text-xs px-3 py-1 bg-white border border-neutral-200 text-neutral-600 rounded-full">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {hotel.products.length === 0 && hotel.generalFacilities.length === 0 && (
                  <p className="text-neutral-400 text-sm text-center py-12">No product or facility data available from this source.</p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
