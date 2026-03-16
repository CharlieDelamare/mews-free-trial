'use client';

import { useState, useRef, useEffect } from 'react';
import { Building2, Globe, Info, ChevronDown, Search, MapPin } from 'lucide-react';
import type { USStateConfig } from '@/lib/roi-calculator/utils/hotelDefaults';

interface HotelConfigSectionProps {
  country: string;
  setCountry: (value: string) => void;
  usState: string;
  setUSState: (value: string) => void;
  hotelType: string;
  setHotelType: (value: string) => void;
  countries: Array<{ name: string; currency: string; currencySymbol: string }>;
  hotelTypes: string[];
  usStates: USStateConfig[];
}

function CountryCombobox({
  country,
  setCountry,
  countries,
}: {
  country: string;
  setCountry: (v: string) => void;
  countries: Array<{ name: string; currency: string; currencySymbol: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = countries.find((c) => c.name === country);

  const filtered = query.trim() === ''
    ? countries
    : countries.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (name: string) => {
    setCountry(name);
    setOpen(false);
    setQuery('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!open) setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    } else if (e.key === 'Enter' && filtered.length > 0) {
      handleSelect(filtered[0].name);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div
        className="relative flex items-center rounded-xl overflow-hidden cursor-text"
        style={{
          background: 'rgba(255,255,255,0.96)',
          boxShadow: open ? `0 0 0 2px var(--mews-indigo), 0 2px 8px rgba(0,0,0,0.15)` : '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'box-shadow 0.15s',
        }}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={open ? query : (selected ? `${selected.name} (${selected.currencySymbol})` : '')}
          onChange={handleInputChange}
          onFocus={() => { setOpen(true); setQuery(''); }}
          onKeyDown={handleKeyDown}
          placeholder="Search country…"
          className="w-full pl-9 pr-8 py-3 text-sm font-medium text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
          autoComplete="off"
        />
        <ChevronDown
          className="absolute right-3 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 w-full mt-1.5 rounded-xl overflow-hidden"
          style={{
            background: 'var(--roi-white)',
            boxShadow: '0 8px 32px rgba(28,29,36,0.18), 0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid rgba(28,29,36,0.08)',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">No results</div>
          ) : (
            filtered.map((c) => {
              const isSelected = c.name === country;
              return (
                <button
                  key={c.name}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(c.name); }}
                  className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors duration-100"
                  style={{
                    background: isSelected ? 'rgba(179,178,251,0.1)' : 'transparent',
                    color: isSelected ? 'var(--mews-indigo)' : 'var(--roi-gray-700)',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(28,29,36,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{c.currencySymbol}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function StateCombobox({
  usState,
  setUSState,
  usStates,
}: {
  usState: string;
  setUSState: (v: string) => void;
  usStates: USStateConfig[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = usStates.find((s) => s.name === usState);

  const filtered = query.trim() === ''
    ? usStates
    : usStates.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.code.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (name: string) => {
    setUSState(name);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUSState('');
    setOpen(false);
    setQuery('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!open) setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    } else if (e.key === 'Enter' && filtered.length > 0) {
      handleSelect(filtered[0].name);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="relative flex items-center rounded-xl overflow-hidden cursor-text"
        style={{
          background: 'rgba(255,255,255,0.96)',
          boxShadow: open ? `0 0 0 2px var(--mews-indigo), 0 2px 8px rgba(0,0,0,0.15)` : '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'box-shadow 0.15s',
        }}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={open ? query : (selected ? `${selected.name} (${selected.code})` : '')}
          onChange={handleInputChange}
          onFocus={() => { setOpen(true); setQuery(''); }}
          onKeyDown={handleKeyDown}
          placeholder="Select a state (optional)…"
          className="w-full pl-9 pr-14 py-3 text-sm font-medium text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
          autoComplete="off"
        />
        {selected && !open && (
          <button
            onMouseDown={handleClear}
            className="absolute right-8 w-4 h-4 text-gray-400 hover:text-gray-600 flex items-center justify-center"
            title="Clear state selection"
          >
            ×
          </button>
        )}
        <ChevronDown
          className="absolute right-3 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>

      {open && (
        <div
          className="absolute z-50 w-full mt-1.5 rounded-xl overflow-hidden"
          style={{
            background: 'var(--roi-white)',
            boxShadow: '0 8px 32px rgba(28,29,36,0.18), 0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid rgba(28,29,36,0.08)',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {/* Option to use national average */}
          <button
            onMouseDown={(e) => { e.preventDefault(); handleSelect(''); }}
            className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors duration-100 border-b"
            style={{
              background: !usState ? 'rgba(179,178,251,0.1)' : 'transparent',
              color: !usState ? 'var(--mews-indigo)' : 'var(--roi-gray-500)',
              fontWeight: !usState ? 600 : 400,
              borderColor: 'rgba(28,29,36,0.06)',
              fontStyle: 'italic',
            }}
            onMouseEnter={(e) => {
              if (usState) (e.currentTarget as HTMLElement).style.background = 'rgba(28,29,36,0.04)';
            }}
            onMouseLeave={(e) => {
              if (usState) (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <span>Use national average</span>
          </button>
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">No results</div>
          ) : (
            filtered.map((s) => {
              const isSelected = s.name === usState;
              return (
                <button
                  key={s.code}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(s.name); }}
                  className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors duration-100"
                  style={{
                    background: isSelected ? 'rgba(179,178,251,0.1)' : 'transparent',
                    color: isSelected ? 'var(--mews-indigo)' : 'var(--roi-gray-700)',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(28,29,36,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <span>{s.name}</span>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{s.code}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function HotelConfigSection({
  country,
  setCountry,
  usState,
  setUSState,
  hotelType,
  setHotelType,
  countries,
  hotelTypes,
  usStates,
}: HotelConfigSectionProps) {
  const showStateSelector = country === 'United States';

  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-6"
      style={{
        background: 'linear-gradient(135deg, var(--roi-navy-dark) 0%, var(--mews-night-black) 40%, var(--roi-navy-light) 100%)',
        boxShadow: '0 8px 32px rgba(0,35,71,0.3), 0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* Decorative background elements */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 80% 50%, rgba(179,178,251,0.18) 0%, transparent 60%), radial-gradient(ellipse at 10% 80%, rgba(179,178,251,0.10) 0%, transparent 50%)',
        }}
      />

      <div className="relative p-6 md:p-8">
        <div className={`grid gap-5 ${showStateSelector ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {/* Country Combobox */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-white/80 tracking-wide">
              <Globe className="w-4 h-4 text-teal-400" />
              Country / Market
            </label>
            <CountryCombobox country={country} setCountry={setCountry} countries={countries} />
          </div>

          {/* U.S. State Combobox — only shown when United States is selected */}
          {showStateSelector && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-white/80 tracking-wide">
                <MapPin className="w-4 h-4 text-teal-400" />
                State
              </label>
              <StateCombobox usState={usState} setUSState={setUSState} usStates={usStates} />
            </div>
          )}

          {/* Property Type Select */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-white/80 tracking-wide">
              <Building2 className="w-4 h-4 text-teal-400" />
              Property Type
            </label>
            <select
              value={hotelType}
              onChange={(e) => setHotelType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all duration-200 text-sm"
              style={{
                background: 'rgba(255,255,255,0.96)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {hotelTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-5 flex items-center gap-2 text-xs text-white/50">
          <Info className="w-3.5 h-3.5 flex-shrink-0 text-teal-400/70" />
          <p>
            {showStateSelector
              ? 'All benchmark values auto-adjust based on your country, state, and property type selection'
              : 'All benchmark values auto-adjust based on your country and property type selection'}
          </p>
        </div>
      </div>
    </div>
  );
}
