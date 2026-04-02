'use client';

import { useState } from 'react';
import type { HotelCandidate, HotelResearchData } from '@/types/research';

type Phase = 'idle' | 'searching' | 'selecting' | 'fetching' | 'results' | 'error';
type Tab = 'overview' | 'gallery' | 'rooms' | 'facilities';

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-neutral-50 last:border-0">
      <span className="text-xs font-medium text-neutral-400 w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-neutral-700">{value}</span>
    </div>
  );
}

function PolicyBadge({ label, value }: { label: string; value: boolean | null }) {
  if (value === null) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
      value ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
    }`}>
      {value ? '✓' : '✗'} {label}
    </span>
  );
}

export default function ResearchPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [form, setForm] = useState<SearchForm>({ name: '', city: '', countryCode: '' });
  const [candidates, setCandidates] = useState<HotelCandidate[]>([]);
  const [hotel, setHotel] = useState<HotelResearchData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
      setActiveTab('overview');
      setPhase('results');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load hotel data');
      setPhase('error');
    }
  }

  const tabs: { id: Tab; label: (h: HotelResearchData) => string }[] = [
    { id: 'overview', label: () => 'Overview' },
    { id: 'gallery', label: h => `Gallery (${h.images.length})` },
    { id: 'rooms', label: h => `Rooms (${h.roomTypes.length})` },
    { id: 'facilities', label: h => `Facilities (${h.generalFacilities.length})` },
  ];

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
                City <span className="text-neutral-400 font-normal text-xs">(optional)</span>
              </label>
              <input
                id="city"
                type="text"
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
              <button onClick={resetToIdle} className="text-sm text-mews-primary hover:underline">
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

        {/* ── RESULTS ── */}
        {phase === 'results' && hotel && (
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-5 gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-mews-night-black">{hotel.hotelName}</h2>
                  <StarRating rating={hotel.starRating} />
                  {hotel.reviewRating !== null && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-mews-yellow text-mews-night-black font-semibold">
                      ★ {hotel.reviewRating.toFixed(1)}
                      {hotel.reviewCount ? ` (${hotel.reviewCount.toLocaleString()})` : ''}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
                    via {hotel.source === 'liteapi' ? 'LiteAPI' : 'SerpApi'}
                  </span>
                </div>
                {hotel.address && <p className="text-sm text-neutral-500">{hotel.address}</p>}
                {(hotel.chain || hotel.hotelType) && (
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {[hotel.chain, hotel.hotelType].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <button onClick={resetToIdle} className="text-sm text-mews-primary hover:underline shrink-0">
                ← Search again
              </button>
            </div>

            {/* Hero image */}
            {hotel.mainPhoto && (
              <div className="mb-5 rounded-xl overflow-hidden h-48 bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hotel.mainPhoto}
                  alt={hotel.hotelName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-neutral-200 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-mews-night-black border-mews-primary bg-mews-primary/10'
                      : 'text-neutral-500 border-transparent hover:text-mews-night-black hover:border-neutral-300'
                  }`}
                >
                  {tab.label(hotel)}
                </button>
              ))}
            </div>

            {/* ── Overview Tab ── */}
            {activeTab === 'overview' && (
              <div className="space-y-5">

                {/* Description */}
                {hotel.description && (
                  <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-neutral-700 mb-2">About</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {hotel.description.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim()}
                    </p>
                  </div>
                )}

                {/* Key facts */}
                {(hotel.checkinTime || hotel.checkoutTime || hotel.phone || hotel.email || hotel.airportCode) && (
                  <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-neutral-700 mb-2">Key Details</h3>
                    <div className="divide-y divide-neutral-50">
                      {hotel.checkinTime && <InfoRow label="Check-in" value={hotel.checkinTime} />}
                      {hotel.checkoutTime && <InfoRow label="Check-out" value={hotel.checkoutTime} />}
                      {hotel.phone && <InfoRow label="Phone" value={hotel.phone} />}
                      {hotel.email && <InfoRow label="Email" value={hotel.email} />}
                      {hotel.airportCode && <InfoRow label="Nearest airport" value={hotel.airportCode} />}
                    </div>
                  </div>
                )}

                {/* Check-in instructions */}
                {hotel.checkinInstructions.length > 0 && (
                  <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-neutral-700 mb-2">Check-in Instructions</h3>
                    <ul className="space-y-1">
                      {hotel.checkinInstructions.map((line, i) => (
                        <li key={i} className="text-sm text-neutral-600 flex gap-2">
                          <span className="text-neutral-300 mt-0.5">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Guest policies quick view */}
                {(hotel.parking !== null || hotel.childAllowed !== null || hotel.petsAllowed !== null) && (
                  <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-neutral-700 mb-3">Guest Policies</h3>
                    <div className="flex flex-wrap gap-2">
                      <PolicyBadge label="Parking" value={hotel.parking} />
                      <PolicyBadge label="Children welcome" value={hotel.childAllowed} />
                      <PolicyBadge label="Pets allowed" value={hotel.petsAllowed} />
                    </div>
                  </div>
                )}

                {/* Sentiment — pros & cons */}
                {(hotel.sentimentPros.length > 0 || hotel.sentimentCons.length > 0) && (
                  <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-neutral-700 mb-3">Guest Sentiment</h3>

                    {hotel.sentimentCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {hotel.sentimentCategories.map((cat, i) => (
                          <span
                            key={i}
                            title={cat.description}
                            className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 font-medium"
                          >
                            {cat.name} · {cat.rating.toFixed(1)}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {hotel.sentimentPros.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-green-600 mb-2">Guests love</p>
                          <ul className="space-y-1">
                            {hotel.sentimentPros.map((pro, i) => (
                              <li key={i} className="text-xs text-neutral-600 flex gap-1.5">
                                <span className="text-green-400 mt-0.5">+</span>
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {hotel.sentimentCons.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-red-500 mb-2">Guests mention</p>
                          <ul className="space-y-1">
                            {hotel.sentimentCons.map((con, i) => (
                              <li key={i} className="text-xs text-neutral-600 flex gap-1.5">
                                <span className="text-red-400 mt-0.5">−</span>
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Detailed policies */}
                {hotel.policies.length > 0 && (
                  <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-neutral-700 mb-3">Hotel Policies</h3>
                    <div className="space-y-3">
                      {hotel.policies.map((policy, i) => (
                        <div key={i}>
                          {policy.name && (
                            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-0.5">
                              {policy.name}
                            </p>
                          )}
                          <p className="text-sm text-neutral-600">{policy.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Important information */}
                {hotel.importantInfo && (
                  <div className="bg-mews-light-lavender rounded-xl border border-neutral-100 p-5">
                    <h3 className="text-sm font-semibold text-neutral-700 mb-2">Important Information</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {hotel.importantInfo.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim()}
                    </p>
                  </div>
                )}

                {!hotel.description && !hotel.checkinTime && !hotel.checkoutTime && hotel.sentimentPros.length === 0 && hotel.policies.length === 0 && (
                  <p className="text-neutral-400 text-sm text-center py-12">No overview data available from this source.</p>
                )}
              </div>
            )}

            {/* ── Gallery Tab ── */}
            {activeTab === 'gallery' && (
              <div>
                {hotel.images.length === 0 ? (
                  <p className="text-neutral-400 text-sm text-center py-12">No images available from this source.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {hotel.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setLightboxIndex(i)}
                          className="relative group aspect-[4/3] rounded-lg overflow-hidden bg-neutral-100 block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.caption ?? `${hotel.hotelName} photo ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {img.caption && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white text-xs truncate">{img.caption}</p>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Lightbox */}
                    {lightboxIndex !== null && (
                      <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-mews-night-black/70"
                        onClick={() => setLightboxIndex(null)}
                      >
                        <div
                          className="relative max-w-4xl max-h-[90vh] mx-4"
                          onClick={e => e.stopPropagation()}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={hotel.images[lightboxIndex].urlHd ?? hotel.images[lightboxIndex].url}
                            alt={hotel.images[lightboxIndex].caption ?? hotel.hotelName}
                            className="max-h-[80vh] max-w-full rounded-lg object-contain"
                          />
                          {hotel.images[lightboxIndex].caption && (
                            <p className="text-white text-sm text-center mt-2 opacity-80">
                              {hotel.images[lightboxIndex].caption}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <button
                              onClick={() => setLightboxIndex(i => Math.max(0, (i ?? 0) - 1))}
                              disabled={lightboxIndex === 0}
                              className="text-white/70 hover:text-white disabled:opacity-30 px-4 py-2 text-sm"
                            >
                              ← Prev
                            </button>
                            <span className="text-white/50 text-xs">
                              {lightboxIndex + 1} / {hotel.images.length}
                            </span>
                            <button
                              onClick={() => setLightboxIndex(i => Math.min(hotel.images.length - 1, (i ?? 0) + 1))}
                              disabled={lightboxIndex === hotel.images.length - 1}
                              className="text-white/70 hover:text-white disabled:opacity-30 px-4 py-2 text-sm"
                            >
                              Next →
                            </button>
                          </div>
                          <button
                            onClick={() => setLightboxIndex(null)}
                            className="absolute top-2 right-2 text-white/70 hover:text-white text-xl leading-none bg-black/30 rounded-full w-8 h-8 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Rooms Tab ── */}
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
                          {room.bedType && <span>{room.bedType}</span>}
                          {room.sizeSqm && <span>{room.sizeSqm} m²</span>}
                        </div>
                        {room.description && (
                          <p className="text-sm text-neutral-600 mb-3">
                            {room.description.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim()}
                          </p>
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

            {/* ── Facilities Tab ── */}
            {activeTab === 'facilities' && (
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
                    <h3 className="text-sm font-semibold text-neutral-700 mb-1">Hotel Facilities</h3>
                    <p className="text-xs text-neutral-400 mb-3">Hotel amenities — not mapped to individual Mews products</p>
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
                  <p className="text-neutral-400 text-sm text-center py-12">No facility data available from this source.</p>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </main>
  );
}
