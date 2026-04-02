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
                Country Code <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                id="countryCode"
                type="text"
                placeholder="e.g. GB"
                maxLength={2}
                value={form.countryCode}
                onChange={e => setForm(f => ({ ...f, countryCode: e.target.value.toUpperCase() }))}
                className="w-32 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-mews-primary focus:border-mews-primary uppercase"
              />
              <p className="text-xs text-neutral-500 mt-1">2-letter ISO code — helps narrow results (e.g. GB, US, FR)</p>
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

        {/* ── RESULTS: placeholder until Task 9 ── */}
        {phase === 'results' && hotel && (
          <p className="text-center text-neutral-400 text-sm py-12">Results view — implemented in Task 9</p>
        )}

      </div>
    </main>
  );
}
